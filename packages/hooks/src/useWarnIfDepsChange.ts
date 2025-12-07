import { getCurrentComponentStack } from '@take-out/helpers'
import { useEffect, useId, useRef } from 'react'

export interface UseWarnIfDepsChangeOptions {
  maxChanges?: number
  ignoreIndexBefore?: number
  name: string
}

export function useWarnIfDepsChange<T extends readonly unknown[]>(
  deps: T,
  options: UseWarnIfDepsChangeOptions
): void {
  const { maxChanges = 0, name, ignoreIndexBefore = 0 } = options

  const changeCountRef = useRef(0)
  const prevDepsRef = useRef<T | undefined>(undefined)
  const id = useId()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (prevDepsRef.current !== undefined) {
        const changedDeps: Array<{
          index: number
          prev: unknown
          next: unknown
        }> = []

        const compareDeps = ignoreIndexBefore ? deps.slice(ignoreIndexBefore) : deps

        compareDeps.forEach((dep, indexIn) => {
          const index = indexIn + ignoreIndexBefore

          if (prevDepsRef.current && prevDepsRef.current[index] !== dep) {
            changedDeps.push({
              index,
              prev: prevDepsRef.current[index],
              next: dep,
            })
          }
        })

        if (changedDeps.length > 0) {
          changeCountRef.current++

          if (changeCountRef.current > maxChanges) {
            // don't use warn because it adds a huge stack
            console.info(
              `🔄 useWarnIfDepsChange "${name}" is changing too often! Changed ${changeCountRef.current} times (max: ${maxChanges})`,
              changedDeps,
              `\n id (${id}) at:`,
              getCurrentComponentStack('short')
            )
          }
        }
      }

      prevDepsRef.current = deps
    }
  })
}
