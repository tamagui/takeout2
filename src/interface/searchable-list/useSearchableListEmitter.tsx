import { useSearchableListContext } from './Context'

export function useSearchableListEmitter() {
  const context = useSearchableListContext()
  return context.indexEmitter
}
