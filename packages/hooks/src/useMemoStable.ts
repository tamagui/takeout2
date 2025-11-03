import { useMemo } from 'react'
import { useWarnIfDepsChange } from './useWarnIfDepsChange'

// create a useMemo that can log when it changes too often
// useful for development

export interface UseMemoStableOptions {
  maxChanges?: number
  ignoreIndexBefore?: number
  name: string
}

export function useMemoStable<Value, T extends readonly unknown[]>(
  getValue: () => Value,
  deps: T,
  options: UseMemoStableOptions = {
    name: `(untitled)`,
  }
): Value {
  useWarnIfDepsChange(deps, options)

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  return useMemo(getValue, deps)
}
