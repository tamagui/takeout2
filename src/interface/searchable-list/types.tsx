import type { Emitter } from '@vxrn/helpers'
import type React from 'react'
import type { RefObject } from 'react'

export type SearchableListHandle = {
  layout?: 'grid' | 'list'
  reverse?: boolean
  indexEmitter: Emitter<number | null>
  listRef: React.RefObject<(HTMLElement | null)[]>
  setSearch: (next: string) => void
  // if reverse reverses the index
  getRealIndex: (index: number) => number
  setIndex: (next: number) => void
  down: () => void
  up: () => void
  getItemProps: (index: number) => any
  getReferenceProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>
  refs: {
    reference: React.MutableRefObject<HTMLElement | null>
    floating: React.MutableRefObject<HTMLElement | null>
    setReference: (node: HTMLElement | null) => void
    setFloating: (node: HTMLElement | null) => void
  }
}

export type SearchableListProps<A extends Record<string, any> = Record<string, any>> = {
  layout?: 'grid' | 'list'
  items: readonly A[] | A[]
  searchKey?: keyof A
  search?: string
  onSearch?: (items: readonly A[] | A[]) => void
  onSelectItem: (item: A) => void
  ref?: RefObject<SearchableListHandle | null>
  resetIndexOnSelect?: boolean
}

export type SearchableListItemProps = {
  children: (
    active: boolean,
    itemProps: Record<string, any>,
    key: string
  ) => React.JSX.Element
  index: number
}
