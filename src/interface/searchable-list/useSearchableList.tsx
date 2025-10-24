import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { composeRefs, useEvent, useGet } from 'tamagui'
import { createFuzzy, type FuzzyOptions } from '@vxrn/helpers'
import { sleep } from '@vxrn/helpers'
import { useAsyncLayoutEffect } from '@vxrn/helpers'
import { createEmitter } from '@vxrn/helpers'
import { isEqualNever } from '@vxrn/helpers'
import { useMemoStable } from '@vxrn/hooks'
import { SearchableListContext } from './Context'
import type { SearchableListHandle } from './types'

export type SearchableItem = Record<string, any> & {
  skipFuzzy?: boolean // never filters this item out
}

export interface UseSearchableListProps<A extends SearchableItem = SearchableItem> {
  threshold?: FuzzyOptions['threshold']
  items: readonly A[] | A[]
  searchKey?: keyof A | (keyof A)[]
  search?: string
  layout?: 'grid' | 'list'
  columns?: number // use with grid
  delay?: number
  onSelectItem?: (item: A) => void
  resetIndexOnSelect?: boolean
  focusItemOnHover?: boolean
  disable?: boolean
  reverse?: boolean
  limit?: number
}

export function useSearchableList<A extends Record<string, any> = Record<string, any>>(
  props: UseSearchableListProps<A>
): {
  handle: SearchableListHandle
  filteredItems: readonly A[] | A[]
  search: string
  setSearch: (search: string) => void
  Provider: React.ComponentType<{
    children: React.ReactNode
    handle: SearchableListHandle
  }>
} {
  const {
    items,
    disable,
    search: searchProp,
    searchKey = 'name',
    onSelectItem,
    columns,
    layout = 'list',
    delay = !searchProp || searchProp?.length < 2 ? 0 : 100,
    resetIndexOnSelect,
    focusItemOnHover = false,
    reverse,
    limit,
    threshold,
  } = props

  const [innerSearch, setInnerSearch] = useState('')

  // either you let it be controlled or not
  const search = innerSearch || searchProp

  // Replace floating-ui refs with our own
  const referenceRef = useRef<HTMLElement | null>(null)
  const floatingRef = useRef<HTMLElement | null>(null)

  // Create stable refs object using useMemo
  const refs = useMemo(
    () => ({
      reference: referenceRef,
      floating: floatingRef,
      setReference: (node: HTMLElement | null) => {
        referenceRef.current = node
      },
      setFloating: (node: HTMLElement | null) => {
        floatingRef.current = node
      },
    }),
    []
  )

  const listRef = useRef<Array<HTMLElement | null>>([])

  const indexEmitter = useMemo(
    () =>
      createEmitter<number | null>('searchableListIndex', 0, {
        silent: true,
        comparator: isEqualNever,
      }),
    []
  )

  const setIndex = useEvent(
    (next: number | null | ((prev: number | null) => number | null)) => {
      if (typeof next === 'function') {
        const newValue = next(indexEmitter.value)
        if (newValue !== indexEmitter.value) {
          indexEmitter.emit(newValue)
        }
      } else {
        if (indexEmitter.value !== next) {
          indexEmitter.emit(next)
        }
      }
    }
  )

  useEffect(() => {
    if (items && indexEmitter.value === null) {
      setIndex(0)
    }
  }, [items, indexEmitter.value, setIndex])

  const [filteredItems, setFilteredItems] = useState<readonly A[]>(items)
  const getFilteredItems = useGet(filteredItems)

  // this could be more lazily done
  const fuzzySearch = useMemo(() => {
    return createFuzzy(items, {
      keys: [].concat(searchKey as any),
      threshold,
    })
  }, [items, searchKey, threshold])

  // fuzzy filtering:
  useAsyncLayoutEffect(
    async (signal) => {
      if (!search) {
        setFilteredItems(limit ? items.slice(0, limit - 1) : items)
        return
      }
      await sleep(delay, signal)
      const next = search
        ? fuzzySearch.search(search, { limit: limit || Infinity })
        : items
      setFilteredItems(next)
      // reset index to 0 when searching
      setIndex(0)
    },
    [search, items]
  )

  const handleKeyNavigation = useEvent((event: React.KeyboardEvent) => {
    if (disable) {
      return
    }

    const itemsCount = getFilteredItems().length
    const activeIndex = indexEmitter.value
    if (!itemsCount || activeIndex === null) return

    const currentIndex = activeIndex

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        if (layout === 'grid' && columns) {
          const nextIndex = currentIndex + columns
          if (nextIndex < itemsCount) {
            setIndex(nextIndex)
          } else {
            const col = currentIndex % columns
            setIndex(col)
          }
        } else {
          setIndex((currentIndex + 1) % itemsCount)
        }
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        if (layout === 'grid' && columns) {
          // Move up in grid
          const prevIndex = currentIndex - columns
          if (prevIndex >= 0) {
            setIndex(prevIndex)
          } else {
            // Loop to bottom column
            const col = currentIndex % columns
            const lastRowStart = Math.floor((itemsCount - 1) / columns) * columns
            setIndex(Math.min(lastRowStart + col, itemsCount - 1))
          }
        } else {
          // Move up in list
          setIndex((currentIndex - 1 + itemsCount) % itemsCount)
        }
        break
      }
      case 'ArrowRight': {
        if (layout === 'grid' && columns) {
          event.preventDefault()
          const row = Math.floor(currentIndex / columns)
          const col = currentIndex % columns
          const nextCol = col + 1
          if (nextCol < columns && row * columns + nextCol < itemsCount) {
            setIndex(row * columns + nextCol)
          } else {
            // Loop to start of row
            setIndex(row * columns)
          }
        }
        break
      }
      case 'ArrowLeft': {
        if (layout === 'grid' && columns) {
          event.preventDefault()
          const row = Math.floor(currentIndex / columns)
          const col = currentIndex % columns
          const prevCol = col - 1
          if (prevCol >= 0) {
            setIndex(row * columns + prevCol)
          } else {
            // Loop to end of row
            const maxCol = Math.min(columns - 1, itemsCount - row * columns - 1)
            setIndex(row * columns + maxCol)
          }
        }
        break
      }
      case 'Home': {
        event.preventDefault()
        setIndex(0)
        break
      }
      case 'End': {
        event.preventDefault()
        setIndex(itemsCount - 1)
        break
      }
      case 'Escape': {
        event.preventDefault()
        break
      }
    }
  })

  const onSelectItemEvent = useEvent(onSelectItem)

  const getActiveItem = useCallback(
    (index: number | null) => {
      if (index === null) return null
      const items = getFilteredItems()
      return items[reverse ? items.length - index : index]
    },
    [reverse, getFilteredItems]
  )

  const getReferenceProps = useCallback(
    (userProps?: React.HTMLProps<Element>) => {
      return {
        ...userProps,
        ref: composeRefs(refs.setReference, userProps?.ref as any),
        role: 'combobox',
        'aria-expanded': true,
        'aria-autocomplete': 'list',
        'aria-controls': floatingRef.current?.id,
        'aria-activedescendant':
          indexEmitter.value != null && listRef.current[indexEmitter.value]
            ? listRef.current[indexEmitter.value]?.id
            : undefined,
        onKeyDown: (event: React.KeyboardEvent) => {
          userProps?.onKeyDown?.(event as any)
          handleKeyNavigation(event)

          const activeIdx = indexEmitter.value
          const item = getActiveItem(activeIdx)
          if (
            (event.key === 'Enter' || event.key === 'Tab') &&
            activeIdx != null &&
            item
          ) {
            event.preventDefault()
            if (resetIndexOnSelect) {
              setIndex(null)
            }
            onSelectItemEvent?.(item)
          }
        },
      }
    },
    [
      getActiveItem,
      refs.setReference,
      indexEmitter,
      handleKeyNavigation,
      resetIndexOnSelect,
      onSelectItemEvent,
      setIndex,
    ]
  )

  // TODO make isActive useEmitterSelector/granular
  const getItemProps = useCallback(
    (index: number) => {
      return {
        id: `searchable-list-item-${index}`,
        role: 'option',
        tabIndex: -1,
        ref: (node: HTMLElement | null) => {
          listRef.current[index] = node
        },
        onClick: () => {
          const item = getActiveItem(index)
          if (item) {
            if (resetIndexOnSelect) {
              setIndex(null)
            }
            onSelectItemEvent?.(item)
          }
        },
        onPointerEnter: focusItemOnHover
          ? () => {
              setIndex(index)
            }
          : undefined,
        onPointerMove: focusItemOnHover
          ? () => {
              if (indexEmitter.value !== index) {
                setIndex(index)
              }
            }
          : undefined,
      }
    },
    [
      indexEmitter,
      getActiveItem,
      focusItemOnHover,
      onSelectItemEvent,
      resetIndexOnSelect,
      setIndex,
    ]
  )

  const handle: SearchableListHandle = useMemoStable(
    () => {
      return {
        refs,
        layout,
        indexEmitter,
        listRef,
        setSearch: setInnerSearch,
        getRealIndex: (index: number) =>
          reverse ? getFilteredItems().length - index : index,
        setIndex,
        down: () =>
          setIndex((prev) => Math.min((prev || 0) + 1, getFilteredItems().length - 1)),
        up: () => setIndex((prev) => Math.max(0, (prev || 0) - 1)),
        getReferenceProps,
        getItemProps,
        reverse,
      }
    },
    [
      // Only include truly stable references
      refs,
      layout,
      indexEmitter,
      listRef,
      setInnerSearch,
      setIndex,
      getFilteredItems,
      getReferenceProps,
      getItemProps,
    ],
    { maxChanges: 2, name: 'SearchableList handle' }
  )

  return {
    Provider: SearchableListProvider,
    handle,
    filteredItems,
    search: innerSearch,
    setSearch: setInnerSearch,
  }
}

const SearchableListProvider = ({
  children,
  handle,
}: {
  children: React.ReactNode
  handle: SearchableListHandle
}) => {
  return (
    <SearchableListContext.Provider value={handle}>
      {children}
    </SearchableListContext.Provider>
  )
}
