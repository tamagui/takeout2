// adopted from https://github.com/franciscop/use-async/blob/master/src/index.js

import { useEffect, useId, useLayoutEffect } from 'react'

import { EMPTY_OBJECT } from '../constants'
import { handleAbortError } from './abortable'

type Cleanup = () => void

type AsyncEffectCallback = (
  signal: AbortSignal,
  ...deps: any[]
) => Promise<Cleanup | void> | void

type AsyncEffectOptions = {
  circuitBreakAfter?: number
  circuitBreakPeriod?: number
  debug?: boolean
}

export function useAsyncEffect(
  cb: AsyncEffectCallback,
  deps: any[] = [],
  options?: AsyncEffectOptions
): void {
  useAsyncEffectImpl(false, cb, deps, options)
}

export function useAsyncLayoutEffect(
  cb: AsyncEffectCallback,
  deps: any[] = [],
  options?: AsyncEffectOptions
): void {
  useAsyncEffectImpl(true, cb, deps, options)
}

function useAsyncEffectImpl(
  isLayoutEffect: boolean,
  cb: AsyncEffectCallback,
  deps: any[] = [],
  options: AsyncEffectOptions = EMPTY_OBJECT
): void {
  const effectHook = isLayoutEffect ? useLayoutEffect : useEffect
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const effectId = process.env.NODE_ENV === 'development' ? useId() : ''

  effectHook(() => {
    // Generate a unique ID for this effect instance for loop detection
    checkEffectLoop(effectId, options.circuitBreakAfter, options.circuitBreakPeriod)
    const controller = new AbortController()
    const signal = controller.signal

    // wrap in try in case its not async (for simple use cases)
    try {
      const value = cb(signal, ...deps)

      Promise.resolve(value)
        .then(async (res) => {
          if (res && typeof res === 'function') {
            if (signal.aborted) return res()
            signal.addEventListener('abort', res)
          }
        })
        .catch(handleAbortError)
    } catch (error) {
      handleAbortError(error, options.debug)
    }

    return () => {
      if (signal.aborted) return
      controller.abort()
    }
  }, deps)
}

// loop detection in dev mode
let effectRunCounts: Map<string, number[]>
let checkEffectLoop: (
  effectId: string,
  circuitBreakAfter?: number,
  circuitBreakPeriod?: number
) => void

if (process.env.NODE_ENV === 'development') {
  effectRunCounts = new Map<string, number[]>()

  checkEffectLoop = (
    effectId: string,
    circuitBreakAfter: number = 20,
    circuitBreakPeriod: number = 1000
  ) => {
    const now = Date.now()
    const runs = effectRunCounts.get(effectId) || []

    runs.push(now)

    // keep only runs from the specified period
    const recentRuns = runs.filter((time) => now - time < circuitBreakPeriod)
    effectRunCounts.set(effectId, recentRuns)

    const runCount = recentRuns.length

    if (runCount > circuitBreakAfter) {
      const message = `🚨 useAsyncEffect infinite loop detected! Effect ran ${runCount} times in <${circuitBreakPeriod}ms`
      if (process.env.NODE_ENV === 'development') {
        console.error(message)
        // eslint-disable-next-line no-debugger
        debugger
      } else {
        alert(message)
        throw new Error(message)
      }
    } else if (runCount > circuitBreakAfter / 2) {
      console.warn(
        `⚠️ useAsyncEffect potential loop: Effect ran ${runCount} times in <${circuitBreakPeriod}ms`
      )
    }
  }
} else {
  checkEffectLoop = () => {}
}
