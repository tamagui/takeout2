import { useRef } from 'react'

export type ImmutableToNestedChanges = Record<string, boolean>

export interface Options {
  immutableToNestedChanges?: ImmutableToNestedChanges
}

export function shouldBeImmutable(
  path: string[],
  immutableToNestedChanges?: ImmutableToNestedChanges
): boolean {
  if (!immutableToNestedChanges) return false

  const currentPath = path.join('.')
  for (const pattern in immutableToNestedChanges) {
    if (immutableToNestedChanges[pattern] && currentPath === pattern) {
      return true
    }
  }
  return false
}

interface MemoResult<T> {
  value: T
  hasChanges: boolean
  hasImmutableMutation: boolean
}

function deepMutateInPlace<T>(target: T, source: T): void {
  if (
    typeof target !== 'object' ||
    target === null ||
    typeof source !== 'object' ||
    source === null
  ) {
    return
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    // For arrays, replace contents
    ;(target as any[]).length = 0
    ;(target as any[]).push(...(source as any[]))
    return
  }

  // For objects, recursively mutate
  for (const key in source as any) {
    const targetValue = (target as any)[key]
    const sourceValue = (source as any)[key]

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null
    ) {
      // Recursively mutate nested objects/arrays
      deepMutateInPlace(targetValue, sourceValue)
    } else {
      // Replace primitive values or null/undefined
      ;(target as any)[key] = sourceValue
    }
  }
}

function deepMemoizeWithTracking<T>(
  current: T,
  previous: T,
  path: string[],
  immutableToNestedChanges?: ImmutableToNestedChanges,
  parentIsImmutable: boolean = false
): MemoResult<T> {
  if (current === previous) {
    return { value: previous, hasChanges: false, hasImmutableMutation: false }
  }

  if (typeof current !== 'object' || current === null) {
    return { value: current, hasChanges: true, hasImmutableMutation: false }
  }

  if (typeof previous !== 'object' || previous === null) {
    return { value: current, hasChanges: true, hasImmutableMutation: false }
  }

  const isCurrentImmutable = shouldBeImmutable(path, immutableToNestedChanges)
  const shouldMutateInPlace = isCurrentImmutable || parentIsImmutable

  if (Array.isArray(current)) {
    if (!Array.isArray(previous)) {
      return { value: current, hasChanges: true, hasImmutableMutation: false }
    }
    if (current.length !== previous.length) {
      return { value: current, hasChanges: true, hasImmutableMutation: false }
    }

    let hasChanges = false
    let hasImmutableMutation = false
    const memoizedArray: any[] = []

    for (let i = 0; i < current.length; i++) {
      const itemPath = [...path, String(i)]
      // Pass down whether the parent is immutable BUT arrays are special
      // Items in arrays can be immutable themselves, but arrays should never be mutated in place
      const result = deepMemoizeWithTracking(
        current[i],
        previous[i],
        itemPath,
        immutableToNestedChanges,
        false
      )
      memoizedArray[i] = result.value
      if (result.hasChanges) {
        hasChanges = true
      }
      if (result.hasImmutableMutation) {
        hasImmutableMutation = true
      }
    }

    // Arrays are NEVER immutable themselves, always create new array if contents changed OR if there were immutable mutations
    if (hasChanges || hasImmutableMutation) {
      return { value: memoizedArray as T, hasChanges: true, hasImmutableMutation: false }
    }
    return { value: previous, hasChanges: false, hasImmutableMutation: false }
  }

  const currentKeys = Object.keys(current)
  const previousKeys = Object.keys(previous)

  if (currentKeys.length !== previousKeys.length) {
    return { value: current, hasChanges: true, hasImmutableMutation: false }
  }

  const keysMatch = currentKeys.every((key) => key in previous)
  if (!keysMatch) {
    return { value: current, hasChanges: true, hasImmutableMutation: false }
  }

  let hasChanges = false
  let hasImmutableMutation = false
  const memoizedObject: any = {}

  for (const key of currentKeys) {
    const propPath = [...path, key]
    const currentValue = (current as any)[key]
    const previousValue = (previous as any)[key]

    // Pass down whether this object is immutable
    const result = deepMemoizeWithTracking(
      currentValue,
      previousValue,
      propPath,
      immutableToNestedChanges,
      shouldMutateInPlace
    )

    memoizedObject[key] = result.value
    if (result.hasChanges) {
      hasChanges = true
    }
    if (result.hasImmutableMutation) {
      hasImmutableMutation = true
    }
  }

  if (shouldMutateInPlace && (hasChanges || hasImmutableMutation)) {
    // This object is immutable - keep the same reference but update properties
    // Deep mutate the previous object in place
    if (parentIsImmutable) {
      // If parent is already immutable, we're nested and need to mutate everything in place
      deepMutateInPlace(previous, current)
    } else {
      // Just mutate the direct properties
      for (const key of currentKeys) {
        ;(previous as any)[key] = memoizedObject[key]
      }
    }
    // Return that this was an immutable mutation
    return { value: previous, hasChanges: false, hasImmutableMutation: true }
  }

  if (hasChanges || hasImmutableMutation) {
    return { value: memoizedObject, hasChanges: true, hasImmutableMutation: false }
  }

  return { value: previous, hasChanges: false, hasImmutableMutation: false }
}

export function deepMemoize<T>(
  current: T,
  previous: T,
  path: string[] = [],
  immutableToNestedChanges?: ImmutableToNestedChanges
): T {
  const result = deepMemoizeWithTracking(
    current,
    previous,
    path,
    immutableToNestedChanges,
    false
  )

  // If root has immutable mutation but no changes, we need to force a new reference
  if (path.length === 0 && result.hasImmutableMutation && !result.hasChanges) {
    // The root itself was immutable and mutated, or contains immutable mutations
    // We need to ensure the root reference changes
    if (Array.isArray(result.value)) {
      return [...result.value] as T
    } else if (typeof result.value === 'object' && result.value !== null) {
      return { ...result.value }
    }
  }

  return result.value
}

export function useDeepMemoizedObject<T>(value: T, options?: Options): T {
  const previousValueRef = useRef<T>(value)

  const memoizedValue = deepMemoize(
    value,
    previousValueRef.current,
    [],
    options?.immutableToNestedChanges
  )

  previousValueRef.current = memoizedValue

  return memoizedValue
}
