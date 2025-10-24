import type { ComponentProps, ComponentType, MemoExoticComponent } from 'react'
import { memo } from 'react'

// react memo but it logs when things change

export function devMemo<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (
    prevProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>
  ) => boolean
): MemoExoticComponent<T> {
  if (process.env.NODE_ENV !== 'development') {
    return memo(Component, areEqual)
  }

  // Custom comparison function that logs which props changed
  const debugEqual = (
    prevProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>
  ): boolean => {
    // If custom areEqual is provided, use that first
    if (areEqual) {
      const result = areEqual(prevProps, nextProps)
      if (!result) {
        console.info(
          `[devMemo] ${Component.displayName || Component.name} re-rendering due to custom comparison returning false`
        )
      }
      return result
    }

    // Otherwise do our own comparison with logging
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)])
    let hasChanged = false
    const changedProps: Record<string, { prev: any; next: any }> = {}

    allKeys.forEach((key) => {
      // Skip children since they're often complex and noisy
      if (key === 'children' && prevProps[key] !== nextProps[key]) {
        changedProps[key] = { prev: 'React Node', next: 'React Node' }
        hasChanged = true
        return
      }

      if (prevProps[key] !== nextProps[key]) {
        changedProps[key] = {
          prev: prevProps[key],
          next: nextProps[key],
        }
        hasChanged = true
      }
    })

    if (hasChanged) {
      console.info(
        `[devMemo] ${Component.displayName || Component.name} re-rendering due to props change:`,
        changedProps
      )
      return false
    }

    return true
  }

  // Use React's memo with our debugEqual function
  const memoizedComponent = memo(Component, debugEqual) as MemoExoticComponent<T>

  // Copy over the displayName
  const displayName = Component.displayName || Component.name
  if (displayName) {
    memoizedComponent.displayName = `devMemo(${displayName})`
  }

  return memoizedComponent
}
