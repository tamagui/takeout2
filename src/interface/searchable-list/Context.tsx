import { useContext } from 'react'
import { createGlobalContext } from '@vxrn/helpers'
import type { SearchableListHandle } from './types'

export const SearchableListContext = createGlobalContext<null | SearchableListHandle>(
  'searchable-list/context',
  null
)

export function useSearchableListContext(): SearchableListHandle {
  const context = useContext(SearchableListContext)
  if (!context) {
    throw new Error(
      'useSearchableListContext must be used within a SearchableList Provider'
    )
  }
  return context
}
