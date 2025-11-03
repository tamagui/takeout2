import { useLastValueIf } from './useLastValueIf'

export function useLastValue<T>(value: T): T | undefined {
  return useLastValueIf(value, true)
}
