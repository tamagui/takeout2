import {
  memo,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import {
  Adapt,
  AnimatePresence,
  Portal,
  Sheet,
  useComposedRefs,
  useDebounce,
  useDebounceValue,
  useEvent,
  useGet,
  withStaticProperties,
  XStack,
  YStack,
  type PopoverProps,
  type TamaguiElement,
  type ViewProps,
  type XStackProps,
} from 'tamagui'
import { sleep } from '@vxrn/helpers'
import { useAsyncLayoutEffect } from '@vxrn/helpers'
import {
  createEmitter,
  useEmitter,
  useEmitterSelector,
  useEmitterValue,
} from '@vxrn/helpers'
import { createGlobalContext } from '@vxrn/helpers'
import { isEqualIdentity } from '@vxrn/helpers'
import { useLastValue } from '@vxrn/hooks'
import { useHandleEscapeIf } from '~/features/shortcuts/handleKeyboardEscape'
import { isTauri } from '@vxrn/helpers'
import { isEqualDeepLite } from '@vxrn/helpers'
import { TOP_BAR_HEIGHT } from '../constants'
import { dialogEmitter } from '../dialogs/shared'
import {
  Popover,
  popoverEmitter,
  type PopoverContentProps,
  type PopoverName,
} from '../popover/Popover'

// TODO these are not encapsulated
let isOnMenu = false
const isOnLink = new Set<string>()

export const createSlidingPopover = <ID extends string>({
  name,
  ids,
}: {
  ids: readonly ID[]
  name: PopoverName
}) => {
  type Via = 'hover' | 'press'
  type SetActive = (_id: ID, _layout: LayoutRectangle, via: Via) => void
  type Close = (via: Via) => void

  let closeSlidingPopover: (via?: Via) => void

  const SlidingPopoverActiveContext = createGlobalContext<ID | ''>(
    `sliding-popover/active-${name}`,
    ''
  )

  type SlidingContext = {
    close: Close
    setActive: SetActive
    toggleActive: SetActive
    getActive: () => string
    onActive: (cb: (id: ID) => void) => () => void
    setLayout: (layout: LayoutRectangle) => void
  }

  const SlidingPopoverContext = createGlobalContext<SlidingContext>(
    `sliding-popover/context-${name}`,
    null as any
  )

  // these should be contextual
  const hoveringTargetEmitter = createEmitter<ID | ''>(
    'slidingPopover.hoveringTargetEmitter',
    '',
    {
      silent: true,
      comparator: isEqualIdentity,
    }
  )

  type State = { type: 'open'; id: ID } | { type: 'close' }

  // should only for external things to talk into here
  const controller = createEmitter<State>('slidingPopover', {
    type: 'close',
  })

  const stateEmitter = createEmitter<State>('state', {
    type: 'close',
  })

  const activeListeners = new Set<Function>()

  const borderRadius: number = 22

  const sharedFrameStyle = {
    rounded: borderRadius,
  } satisfies ViewProps

  const sharedFrameInnerStyle = {
    rounded: borderRadius + 1,
  } satisfies ViewProps

  const SlidingPopover = (props: PopoverProps) => {
    const popoverRef = useRef<Popover>(null)
    const [active, setActiveInternal] = useState<ID | ''>('')
    const getActive = useGet(active)
    const openedVia = useRef<Via | undefined>(undefined)

    useLayoutEffect(() => {
      if (!active) {
        openedVia.current = undefined
      }
    })

    const closeForce = useCallback(() => {
      popoverRef.current?.close()
      setActiveInternal('')
      stateEmitter.emit({ type: 'close' })
      if (popoverEmitter.value?.name === name) {
        popoverEmitter.emit({ state: 'closed', name })
      }
      openedVia.current = undefined
    }, [name])

    const close = useCallback(
      (via?: Via) => {
        if (via === 'hover' && openedVia.current === 'press') {
          return
        }
        closeForce()
      },
      [closeForce]
    )

    useEffect(() => {
      closeSlidingPopover = close
    })

    useHandleEscapeIf(!!active, () => {
      closeForce()
    })

    const setActive = useCallback(
      (id: ID, layout: LayoutRectangle, via: Via) => {
        if (id === getActive()) return
        setActiveInternal(id)
        popoverRef.current?.anchorTo(layout)
        // TODO Popover onOpenChange doesnt trigger from anchoring
        popoverEmitter.emit({ state: id ? 'open' : 'closed', name })
        stateEmitter.emit(id ? { type: 'open', id } : { type: 'close' })
        openedVia.current = via
        activeListeners.forEach((cb) => cb(id))
      },
      [name, getActive]
    )

    const val = useMemo(() => {
      return {
        close,
        setActive,
        setLayout: (layout) => {
          popoverRef.current?.anchorTo(layout)
        },
        onActive: (cb) => {
          activeListeners.add(cb)
          return () => {
            activeListeners.delete(cb)
          }
        },
        getActive: () => getActive(),
        toggleActive(id, layout, via) {
          const active = getActive()
          if (active === id) {
            if (
              openedVia.current === 'hover' &&
              via === 'press' &&
              Date.now() - lastHover < 500
            ) {
              // prevent accidental close on hover => click right away
              // some people likely dont realize hover will switch and go to click
              return
            }
            closeSlidingPopover(via)
          } else {
            setActive(id, layout, via)
          }
        },
      } satisfies SlidingContext
    }, [getActive, setActive, close])

    useEmitter(controller, (val) => {
      if (val.type === 'close') {
        closeSlidingPopover('press')
        return
      }
    })

    return (
      <>
        <AnimatePresence>
          {/* overlay to capture click behind to close */}
          {!!active && (
            <Portal>
              <YStack
                // animation="lazy"
                fullscreen
                t={TOP_BAR_HEIGHT}
                opacity={1}
                pointerEvents="auto"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                onPress={() => {
                  closeSlidingPopover()
                }}
              >
                {/* <LinearGradient
                  pointerEvents="none"
                  fullscreen
                  colors={['$background0', '$shadow5']}
                /> */}
              </YStack>
            </Portal>
          )}
        </AnimatePresence>

        <Popover
          name={name}
          disableRTL
          keepChildrenMounted
          // onOpenChange={(open) => {
          //   if (!open) {
          //     if (isOnLink.size || isOnMenu) {
          //       return
          //     }
          //     setActiveInternal('')
          //   }
          // }}
          stayInFrame={{
            padding: 8,
          }}
          open
          ref={popoverRef}
          {...props}
        >
          <SlidingPopoverContext.Provider value={val}>
            <SlidingPopoverActiveContext.Provider value={active}>
              {props.children}
            </SlidingPopoverActiveContext.Provider>
          </SlidingPopoverContext.Provider>

          <SlidingPopoverSheet />
        </Popover>
      </>
    )
  }

  const useIsSlidingPopoverOpen = () =>
    useEmitterSelector(stateEmitter, (val) => val.type === 'open')

  const SlidingPopoverSheet = () => {
    const isOpen = useIsSlidingPopoverOpen()

    return (
      <Adapt platform="touch" when="maxMD">
        <Sheet
          open={isOpen}
          onOpenChange={(val: boolean) => {
            if (!val) {
              controller.emit({ type: 'close' })
            } else {
              controller.emit({ type: 'open', id: ids[0]! })
            }
          }}
          zIndex={100000000}
          modal
          dismissOnSnapToBottom
          animation="medium"
          animationConfig={{
            type: 'spring',
            damping: 25,
            mass: 1.2,
            stiffness: 200,
          }}
        >
          <Sheet.Frame
            borderTopLeftRadius={borderRadius}
            borderTopRightRadius={borderRadius}
          >
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay z={100} bg="$shadow4" />
        </Sheet>
      </Adapt>
    )
  }

  const Targets = (props: XStackProps) => {
    const check = useRef<any>(0)

    const checkForClose = () => {
      check.current = setInterval(() => {
        if (dialogEmitter.value) return
        if (!isOnMenu && !isOnLink.size) {
          hoveringTargetEmitter.emit('')
          closeSlidingPopover('hover')
          clearInterval(check.current)
        }
      }, 400)
    }

    const cancelCheckForClose = () => {
      // hoveringTargetEmitter.emit(true)
      clearInterval(check.current)
    }

    useEmitter(dialogEmitter, (val) => {
      if (val) {
        // once dialog opens we stop checking for close until mouse comes back on
        cancelCheckForClose()
      }
    })

    return (
      <XStack
        display="contents"
        {...props}
        onMouseEnter={cancelCheckForClose}
        onMouseLeave={checkForClose}
        data-tauri-drag-region
      >
        {props.children}
      </XStack>
    )
  }

  let lastHover = 0

  const Target = ({
    id,
    ref,
    ...props
  }: XStackProps & { id: ID; ref?: RefObject<TamaguiElement> }) => {
    const context = use(SlidingPopoverContext)
    const layout = useRef<LayoutRectangle | null>(null)
    const internalRef = useRef<TamaguiElement>(null)
    const combinedRef = useComposedRefs(internalRef, ref)
    const curActive = use(SlidingPopoverActiveContext)
    const isActive = curActive === id

    useEmitter(
      controller,
      (val) => {
        if (layout.current && val.type === 'open' && val.id === id) {
          context.setActive(id, layout.current, 'press')
        }
      },
      [layout, id]
    )

    const setHoveredImmediate = () => {
      if (layout.current) {
        lastHover = Date.now()
        isOnLink.add(id)
        if (!!context.getActive()) {
          context.setActive(id, layout.current, 'hover')
        }
      }
    }

    const setHovered = useDebounce(setHoveredImmediate, 250)

    function updateLayout(e: LayoutChangeEvent) {
      const next = {
        ...e.nativeEvent.layout,
        // @ts-ignore
        x: e.nativeEvent.layout.pageX,
        // @ts-ignore
        y: e.nativeEvent.layout.pageY,
      }
      if (!layout.current || !isEqualDeepLite(next, layout.current)) {
        layout.current = next
        if (context.getActive() === id) {
          context.setLayout(next)
        }
      }
    }

    // useEffect(() => {
    //   // on an interval update it again - this is because you can't really watch css transforms
    //   // so the only way to really account for them is an interval
    //   console.warn('wut', internalRef.current)

    // }, [])

    const updateLayoutDbc = useDebounce(updateLayout, 100)

    return (
      // TODO: i think asChild here was duplicating onMouseEnter event!!!
      <Popover.Trigger m="auto">
        <YStack
          id={`topbar-${id}`}
          data-tauri-drag-region
          className={isActive ? 'path-glow' : ''}
          onMouseEnter={() => {
            hoveringTargetEmitter.emit(id)
            if (layout.current) {
              context.setLayout(layout.current)
            }

            // if (!context.getActive()) return
            // on subsequent hovers go fast
            if (Date.now() - lastHover < 500) {
              setHoveredImmediate()
            } else {
              setHovered()
            }
          }}
          onMouseLeave={() => {
            setHovered.cancel()
            isOnLink.delete(id)
          }}
          onPress={(e) => {
            if (layout.current) {
              context.toggleActive(id, layout.current, 'press')
              e.stopPropagation()
            }
          }}
          onLayout={updateLayoutDbc}
          ref={combinedRef}
          {...props}
        />
      </Popover.Trigger>
    )
  }

  const getMinHeight = (contentHeight: number) => `calc(min(${contentHeight}px, 85vh))`

  const useActiveTarget = (cb: (id: ID) => void) => {
    const context = use(SlidingPopoverContext)
    const cbEvent = useEvent(cb)
    useEffect(() => {
      return context.onActive(cbEvent)
    }, [cbEvent, context])
  }

  const Content = memo(
    ({
      contentHeights,
      contentWidths,
      children,
      popoverProps,
    }: {
      contentHeights: Record<ID, number>
      contentWidths: Record<ID, number>
      popoverProps?: PopoverContentProps
      children: (props: {
        active: ID | ''
        lastActive: ID | ''
        going: number
      }) => React.ReactElement
    }) => {
      const activeCurrent = use(SlidingPopoverActiveContext)
      const hovering = useEmitterValue(hoveringTargetEmitter)
      const last = useLastValue(activeCurrent || hovering)
      const activeCurrentLastOrNext = activeCurrent || hovering || last

      const curI = ids.indexOf(activeCurrentLastOrNext as any)
      const lastI = ids.indexOf(last as any)
      const [isAlreadyOpen, setIsAlreadyOpen] = useState(false)
      const going = !isAlreadyOpen || !activeCurrent ? 0 : curI > lastI ? 1 : -1
      const activeDelayed = useDebounceValue(Boolean(activeCurrent), 500)
      const isFullyHidden = activeCurrent ? false : !activeDelayed

      const width = activeCurrentLastOrNext ? contentWidths[activeCurrentLastOrNext] : 300

      useAsyncLayoutEffect(
        async (signal) => {
          if (!activeCurrent) {
            setIsAlreadyOpen(false)
          } else {
            await sleep(200, signal)
            setIsAlreadyOpen(!!activeCurrent)
          }
        },
        [activeCurrent]
      )

      const minHeight =
        contentHeights && activeCurrentLastOrNext
          ? getMinHeight(contentHeights[activeCurrentLastOrNext])
          : '80vh'

      const memoizedChildren = useMemo(() => {
        return children({
          active: activeCurrentLastOrNext || '',
          lastActive: last || '',
          going,
        })
      }, [activeCurrentLastOrNext, children, last, going])

      return (
        // TODO tamagui - using css driver makes the below Popover.Content not animation `y` correctly
        <Popover.Content
          unstyled
          animation={isFullyHidden ? '0ms' : 'quickLessBouncy'}
          animateOnly={['width', 'transform']}
          opacity={1}
          y={activeCurrent ? 0 : 6}
          disableFocusScope={!activeCurrent}
          pointerEvents={activeCurrent ? 'auto' : 'none'}
          onMouseEnter={() => {
            isOnMenu = true
          }}
          onMouseLeave={() => {
            isOnMenu = false
          }}
          enableAnimationForPositionChange
          $platform-web={{
            visibility: isFullyHidden ? 'hidden' : 'visible',
          }}
          arrow={{
            animation: isFullyHidden ? '0ms' : 'quickLessBouncy',
            animateOnly: ['opacity'],
            bg: activeCurrent ? '$color3' : '$colorTransparent',
            opacity: activeCurrent ? 0.8 : 0,
            borderColor: 'transparent',
            borderWidth: 0,
          }}
          $pointerTouch={{
            width: '100vw',
            maxW: '100vw',
          }}
          width={450}
          maxW={450}
          items="center"
          {...popoverProps}
        >
          {/* transparent inner frame, this lets us change the width smoothly so it can adjust to fit the sides */}
          <YStack
            animation={isFullyHidden ? '0ms' : 'quickLessBouncy'}
            animateOnly={['opacity', 'width', 'transform']}
            opacity={activeCurrent ? 1 : 0}
            backdropFilter="blur(50px)"
            width={width}
            x={
              activeCurrentLastOrNext === 'devtools'
                ? isTauri
                  ? 200
                  : -200
                : activeCurrentLastOrNext === 'search'
                  ? 0
                  : activeCurrentLastOrNext === 'user'
                    ? 0
                    : -5
            }
            shadowColor="$shadow3"
            shadowRadius="$6"
            shadowOffset={{ height: 8, width: 0 }}
            outlineColor="$shadow1"
            outlineWidth={2}
            outlineStyle="solid"
            {...sharedFrameStyle}
          >
            <YStack
              animation={isFullyHidden ? '0ms' : 'quickLessBouncy'}
              animateOnly={['transform', 'opacity']}
              // @ts-ignore
              zIndex={100000}
              // @ts-ignore
              maxHeight="90vh"
              minH={minHeight as any}
              height={minHeight as any}
              className={activeCurrent ? '' : 'disable-all-pointer-events'}
              // scale={activeCurrent ? 1 : 0.99}
              {...sharedFrameInnerStyle}
            >
              {/* background */}
              <YStack
                pointerEvents="none"
                {...sharedFrameInnerStyle}
                fullscreen
                z={0}
                bg="$color02"
                opacity={0.35}
                borderWidth={0.5}
                borderColor="$color3"
                $theme-light={{
                  bg: '$background02',
                }}
                $pointerTouch={{
                  height: '100vh',
                  width: '100vw',
                }}
              />

              {/* extra shadow */}
              <YStack
                fullscreen
                shadowColor="$shadow5"
                shadowRadius={50}
                bg="$color2"
                opacity={0.45}
                shadowOffset={{ height: 25, width: 0 }}
                {...sharedFrameInnerStyle}
              />

              <YStack
                $pointerTouch={{
                  height: '100vh',
                  width: '100vw',
                }}
                // minH={minHeight as any}
                overflow="hidden"
                flex={1}
                contain="strict"
                {...sharedFrameInnerStyle}
              >
                {memoizedChildren}
              </YStack>
            </YStack>
          </YStack>
        </Popover.Content>
      )
    }
  )

  const useContext = () => use(SlidingPopoverContext)

  return withStaticProperties(SlidingPopover, {
    stateEmitter,
    useContext,
    useIsSlidingPopoverOpen,
    Content,
    Targets,
    Target,
    controller,
    useActiveTarget,
    hoveringTargetEmitter,
    SlidingPopoverActiveContext,
  })
}
