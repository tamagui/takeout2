import { createContext } from 'react'

export type SearchContextValue = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onInput: (e: KeyboardEvent) => void
}

export const SearchContext = createContext<SearchContextValue | null>(null)
