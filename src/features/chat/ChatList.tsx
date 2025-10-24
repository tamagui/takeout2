import type {
  ScrollModifier,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'
import {
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  type ListScrollLocation,
} from '@virtuoso.dev/message-list'
import { memo, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { useDebounce, useEvent, YStack } from 'tamagui'
import { useGetCurrentThreadId } from '~/context/CurrentThreadContext'
import type { ChatListHandle, ChatListItem } from '~/features/chat/ChatListProps'
import { sleep } from '@vxrn/helpers'
import { useAsyncEffect, useAsyncLayoutEffect } from '@vxrn/helpers'
import { useEmitter } from '@vxrn/helpers'
import { ensure } from '@vxrn/helpers'
import { useLastValue } from '@vxrn/hooks'
import { getLastLinkMeta } from '~/interface/app/Link'
import { draggableDividerEmitter } from '~/interface/dividers/useDraggableDivider'
import type { MessageWithRelations } from '~/data/types'
import { useIsInThread } from '../thread/ui/ThreadContext'
import type { ChatListProps } from './ChatListProps'
import { scrollToBottomIfAtBottom } from './scrollToBottomIfAtBottom'
import { useMessageItemEmitter } from '../message/emitters'

// use this shape to start channels at the bottom of the list
const startScrollModifier: ScrollModifier = {
  type: 'item-location',
  location: {
    index: 'LAST',
    align: 'start-no-overflow',
  },
  purgeItemSizes: true,
}

const defaultScrollModifier: ScrollModifier = {
  type: 'items-change',
  behavior: 'smooth',
}

const DebugInfo = new WeakMap<any, any>()

export const ChatList = memo((props: ChatListProps) => {
  const {
    items,
    ItemContent: MessageItemComponent,
    onScrollToTop,
    onScroll,
    ref,
    Header,
    context,
    Footer,
    scrollToMessageId,
  } = props

  const isInThread = useIsInThread()
  const isResizing = useRef(false)
  const virtuosoRef = useRef<VirtuosoMessageListMethods<ChatListItem>>(null)
  const prevItemsRef = useRef<readonly ChatListItem[] | null>(null)
  const isLoadingRef = useRef(true)
  const messageItemEmitter = useMessageItemEmitter()
  const messageIdToIndex = useRef<Map<string, number>>(new Map())

  const curScrollLocation = useRef<ListScrollLocation>(null)
  // const [scrollToMessageId, setScrollToMessageId] = useControllableState({
  //   prop: scrollToMessageIdProp,
  //   defaultProp: '',
  //   strategy: 'most-recent-wins',
  // })

  useAsyncLayoutEffect(
    async function mutateListItems(signal) {
      const isInitialLoad = !prevItemsRef.current
      prevItemsRef.current = items
      isLoadingRef.current = false

      // rebuild the index map when items change
      messageIdToIndex.current.clear()
      items.forEach((item, index) => {
        messageIdToIndex.current.set(item.id, index)
      })

      if (isInitialLoad) {
        return
      }
      scrollToBottomIfAtBottom(virtuosoRef, isLoadingRef)
    },
    [scrollToMessageId, context, items]
  )

  const getThreadId = useGetCurrentThreadId()

  // handle focus event to scroll to focused message
  useEmitter(messageItemEmitter, (event) => {
    if (event.type === 'focus' && event.id) {
      const index = messageIdToIndex.current.get(event.id)
      if (index !== undefined && virtuosoRef.current) {
        virtuosoRef.current.scrollToItem({
          index,
          behavior: 'smooth',
          align: 'center',
        })
      }
    }
  })

  const shouldAvoidHighlight = useCallback(() => {
    const linkMeta = getLastLinkMeta()
    if (
      linkMeta.recent &&
      linkMeta.type === 'open-thread' &&
      (linkMeta.threadId === getThreadId() || (linkMeta.threadId && !isInThread))
    ) {
      // starting conservative - we don't want to highlight/scroll to messages every time it changes
      // for now we just avoid on opening a thread directly, there's other cases we'll want to handle
      return true
    }

    return false
  }, [isInThread, getThreadId])

  useAsyncEffect(
    async (signal) => {
      const methods = virtuosoRef.current
      ensure(scrollToMessageId)
      ensure(methods)

      const index = items.findIndex((item) => item.id === scrollToMessageId)

      if (index === -1) {
        console.info('TODO load item first')
        return
      }

      await sleep(200, signal)

      // route takes a sec so put after the sleep
      ensure(!shouldAvoidHighlight())

      console.warn('💬 scroll to', { isInThread, scrollToMessageId, index })
      methods.scrollToItem({
        index,
        behavior: 'smooth',
        align: 'center',
        done() {
          messageItemEmitter.emit({
            type: 'highlight',
            id: scrollToMessageId,
          })
        },
      })
    },
    [scrollToMessageId]
  )

  function isNearTop(location: ListScrollLocation) {
    return !location.isAtBottom && location.listOffset > -500
  }

  const handleScroll = useEvent((location: ListScrollLocation) => {
    if (isResizing?.current) {
      // avoid all scroll events during resize
      return
    }
    // listOffset is influenced by Header somehow - i think if no header then -300 means 300px near top
    // but if header is 600px tall, then 300 is 300px from top or something like that
    if (!isLoadingRef.current && isNearTop(location)) {
      isLoadingRef.current = true
      onScrollToTop?.()
    }
    curScrollLocation.current = location
  })

  const lastScrollHeight = useRef(0)

  useImperativeHandle<any, ChatListHandle>(
    ref,
    () => ({
      scrollToIndex: (index) => {
        virtuosoRef.current?.scrollToItem(index)
      },
      scrollToBottomIfAtBottom: () => {
        scrollToBottomIfAtBottom(virtuosoRef, isLoadingRef)
      },
    }),
    []
  )

  const onScrollEvent = useEvent(onScroll)
  const handleScrollDebounced = useDebounce(
    (location: ListScrollLocation) => {
      onScrollEvent?.(location)
      handleScroll(location)
    },
    100,
    {},
    []
  )

  const mountTime = useRef(Date.now())
  const finishResizing = useDebounce(() => {
    isResizing.current = false
    if (Date.now() - mountTime.current < 1000) {
      return
    }
    scrollToBottomIfAtBottom(virtuosoRef, isLoadingRef)
  }, 150)

  const dragStartAt = useRef(0)
  useEmitter(draggableDividerEmitter, (dragging) => {
    if (dragging) {
      dragStartAt.current = Date.now()
    }
    if (dragStartAt.current === 0) {
      return
    }
    if (Date.now() - dragStartAt.current < 500) {
      // avoid too many, only if dragging happens for more than a small amt
      return
    }
    // only apply if its been
    if (!dragging) {
      scrollToBottomIfAtBottom(virtuosoRef, isLoadingRef)
    }
  })

  const lastItems = useLastValue(items)
  const lastFirstItemId = lastItems?.[0]?.id
  const curFirstItemId = items?.[0]?.id

  const isPrepending = Boolean(
    items && lastFirstItemId && lastFirstItemId !== curFirstItemId
  )
  const isAppending = lastItems && lastItems.length > items.length
  const isRemoving = lastItems && items.length < lastItems.length
  const isRemovingStart = !isAppending && isRemoving && lastFirstItemId !== curFirstItemId
  const isRemovingEnd =
    !isAppending &&
    isRemoving &&
    lastItems[lastItems.length]?.id !== items[items.length - 1]?.id

  const scrollModifier = useMemo<ScrollModifier>(() => {
    if (isPrepending) return 'prepend'
    if (isRemovingStart) return 'remove-from-start'
    if (isRemovingEnd) return 'remove-from-end'
    if (!lastItems) return startScrollModifier

    if (isAppending) {
      // works but only want to do this if atBottom
      return {
        type: 'item-location',
        location: {
          index: 'LAST',
          align: 'start-no-overflow',
          behavior: 'smooth',
        },
      }
    }

    return defaultScrollModifier
  }, [isAppending, isPrepending, isRemovingStart, isRemovingEnd, lastItems])

  if (process.env.NODE_ENV === 'development') {
    DebugInfo.set(isResizing, {
      items,
      lastItems,
      scrollModifier,
      isPrepending,
      isRemovingStart,
      isRemoving,
      isAppending,
      curFirstItemId,
      lastFirstItemId,
    })
  }

  const data = useMemo(() => {
    return {
      data: items as MessageWithRelations[],
      ...(scrollModifier && {
        scrollModifier,
      }),
    }
  }, [items, scrollModifier])

  const content = useMemo(() => {
    if (!isInThread) {
      console.groupCollapsed(`💬 ChatList (${data.data.length} items)`, scrollModifier)
      console.info(DebugInfo.get(isResizing))
      console.groupEnd()
    }

    return (
      <VirtuosoMessageListLicense licenseKey="3d09a459ca3e0577e6e0d6f0025c4e4dTzo4MjtFOjE3ODMwNDEyMjU2NDI=">
        <VirtuosoMessageList
          className="virtuoso-scroller"
          data={data}
          computeItemKey={({ data }) => data?.id}
          increaseViewportBy={600}
          ref={virtuosoRef as any}
          style={{ flex: 1 }}
          context={context}
          shortSizeAlign="bottom"
          ItemContent={MessageItemComponent}
          Header={Header as any}
          StickyFooter={Footer as any}
          onScroll={(location) => {
            const changedScrollHeight = lastScrollHeight.current !== location.scrollHeight
            lastScrollHeight.current = location.scrollHeight
            if (changedScrollHeight) {
              handleScrollDebounced(location)
            } else {
              onScrollEvent(location)
              handleScroll(location)
            }
          }}
        />
      </VirtuosoMessageListLicense>
    )
  }, [
    data,
    isInThread,
    Footer,
    Header,
    MessageItemComponent,
    context,
    handleScroll,
    handleScrollDebounced,
    scrollModifier,
    onScrollEvent,
  ])

  return (
    <YStack
      data-tauri-drag-region
      contain="strict"
      flex={1}
      // className={isLoading ? 'disable-scrollbar' : 'enable-scrollbar'}
      onLayout={() => {
        isResizing.current = true
        finishResizing()
      }}
    >
      {content}
    </YStack>
  )
})
