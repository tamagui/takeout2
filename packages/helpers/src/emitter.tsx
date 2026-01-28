import { dequal } from 'dequal'
import * as React from 'react'
import { use, useLayoutEffect, useState } from 'react'

import { handleAbortError } from './async/abortable'
import { DEBUG_LEVEL, EMPTY_ARRAY } from './constants'
import { AbortError } from './error/errors'
import { globalValue } from './global/globalValue'
import { createGlobalContext } from './react/createGlobalContext'

import type { JSX, PropsWithChildren } from 'react'

// keeps a reference to the current value easily

// TODO can replace with useEffectEvent
function useGet<A>(
  currentValue: A,
  initialValue?: any,
  forwardToFunction?: boolean
): () => A {
  const curRef = React.useRef<any>(initialValue ?? currentValue)

  useLayoutEffect(() => {
    curRef.current = currentValue
  })

  // oxlint-disable-next-line exhaustive-deps
  return React.useCallback(
    forwardToFunction
      ? (...args) => curRef.current?.apply(null, args)
      : () => curRef.current,
    [curRef, forwardToFunction]
  )
}

type EmitterOptions<T> = CreateEmitterOpts<T> & {
  name: string
}

type CreateEmitterOpts<T> = {
  silent?: boolean
  comparator?: (a: T, b: T) => boolean
}

export class Emitter<const T> {
  private disposables = new Set<(cb: any) => void>()
  value: T
  options?: EmitterOptions<T>

  constructor(value: T, options?: EmitterOptions<T>) {
    this.value = value
    this.options = options
  }

  listen = (disposable: (cb: T) => void): (() => void) => {
    this.disposables.add(disposable)
    return (): void => {
      this.disposables.delete(disposable)
    }
  }

  emit = (next: T): void => {
    if (process.env.NODE_ENV === 'development') {
      setCache(this, next)
    }
    const compare = this.options?.comparator
    if (compare) {
      if (this.value && compare(this.value, next)) {
        return
      }
    } else {
      if (this.value === next) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[emitter] ${this.options?.name} no comparator option but received same value!
            
this will emit the same value again, which can be desirable, but we warn to ensure it's not unintended:

- if you want this behavior, add { comparator: isEqualNever }
- if you want only non-equal values: { comparator: isEqualIdentity }
- if you want only deeply non-equal values: { comparator: isEqualDeep }`
          )
        }
      }
    }
    this.value = next
    if (DEBUG_LEVEL > 1) {
      if (!this.options?.silent) {
        const name = this.options?.name
        console.groupCollapsed(`📣 ${name}`)
        console.info(next)
        console.trace(`trace >`)
        console.groupEnd()
      }
    }
    this.disposables.forEach((cb) => cb(next))
  }

  nextValue = (): Promise<T> => {
    return new Promise<T>((res) => {
      const dispose = this.listen((val) => {
        dispose()
        res(val)
      })
    })
  }
}

// just createEmitter but ensures it doesn't mess up on HMR
export function createGlobalEmitter<T>(
  name: string,
  defaultValue: T,
  options?: CreateEmitterOpts<T>
): Emitter<T> {
  return globalValue(name, () => createEmitter(name, defaultValue, options))
}

export function createEmitter<T>(
  name: string,
  defaultValue: T,
  options?: CreateEmitterOpts<T>
): Emitter<T> {
  const existing = createOrUpdateCache(name, defaultValue) as T
  return new Emitter<T>(existing || defaultValue, { name, ...options })
}

export type EmitterType<E extends Emitter<any>> =
  E extends Emitter<infer Val> ? Val : never

export const useEmitter = <E extends Emitter<any>>(
  emitter: E,
  cb: (cb: EmitterType<E>) => void,
  args?: any[]
): void => {
  const getCallback = useGet(cb)

  useLayoutEffect(() => {
    return emitter.listen((val) => {
      try {
        getCallback()(val)
      } catch (err) {
        handleAbortError(err)
      }
    })
  }, [emitter, getCallback])
}

// i think this was useSyncExternalStore but removed for concurrent rendering improvements
// wondering if we could just always return a deferred value? or default to it?

export const useEmitterValue = <E extends Emitter<any>>(
  emitter: E,
  options?: { disable?: boolean }
): EmitterType<E> => {
  const disabled = options?.disable

  // use a function initializer to get current emitter value
  const [state, setState] = useState<EmitterType<E>>(() => emitter.value)

  useLayoutEffect(() => {
    if (disabled) return

    // sync immediately in case emitter changed between render and effect
    if (emitter.value !== state) {
      setState(emitter.value)
    }

    return emitter.listen(setState)
  }, [state, disabled, emitter])

  return state
}

/**
 * By default selectors run every render, as well as when emitters update. This is a change
 * from the previous behavior where they only ran when emitters changed value.
 *
 * The reason for this is because emitters capture the variables in scope of the component
 * each render already by using "useGet" by default, which makes them easier to use - you
 * don't need to pass an args[] array except for edge cases.
 *
 * Before explaining why we switched to the default, understand the different uses:
 *
 * - Default behavior - selector is updated every render, and ran every render, as well as
 *   when emitter value changes, so you basically are always up to date.
 *
 * - Set an args[] array as the fourth argument - this will stop the automatic capturing
 *   and instead update selector only when you change args[] yourself. This is good for when you
 *   want explicit control over re-selection and rendering.
 *
 * - With { lazy: true }, the selector only runs when the emitter value changes. If used with
 *   args[], you capture the context of the selector based on args[], if not, it's based on the
 *   current render.
 *
 * I made this change when we had 16 usages of useEmitterSelector and 100% of them are doing very
 * cheap calculations, so this feels like the right pattern. For the rare case of a heavy selector,
 * you have the option to control it.
 *
 */
export const useEmitterSelector = <E extends Emitter<any>, T extends EmitterType<E>, R>(
  emitter: E,
  selector: (value: T) => R,
  options?: {
    disable?: boolean
    lazy?: boolean
  },
  args: any[] = EMPTY_ARRAY
): R => {
  const [state, setState] = useState<R>(() => selector(emitter.value))
  const disabled = options?.disable
  const getSelector = useGet(selector)

  if (options?.lazy !== true) {
    const next = selector(emitter.value)
    if (next !== state) {
      setState(next)
    }
  }

  useLayoutEffect(() => {
    if (disabled) return
    return emitter.listen((val) => {
      try {
        const selectorFn = args !== EMPTY_ARRAY ? selector : getSelector()
        const next = selectorFn(val)
        setState(next)
      } catch (error) {
        if (error instanceof AbortError) {
          return
        }
        throw error
      }
    })
    // oxlint-disable-next-line exhaustive-deps
  }, [disabled, emitter, getSelector, ...args])

  return state
}

export const useEmittersSelector = <const E extends readonly Emitter<any>[], R>(
  emitters: E,
  selector: (values: { [K in keyof E]: EmitterType<E[K]> }) => R,
  options?: { disable?: boolean; isEqual?: (a: R, b: R) => boolean }
): R => {
  const getSelector = useGet(selector)
  const disabled = options?.disable

  const [state, setState] = useState<R>(() => {
    const values = emitters.map((e) => e.value) as { [K in keyof E]: EmitterType<E[K]> }
    return getSelector()(values)
  })

  useLayoutEffect(() => {
    if (disabled) {
      return
    }

    const handler = () => {
      const values = emitters.map((e) => e.value) as {
        [K in keyof E]: EmitterType<E[K]>
      }
      try {
        const next = getSelector()(values)
        setState((prev) => {
          if (options?.isEqual?.(prev, next)) {
            return prev
          }
          if (dequal(prev, next)) {
            return prev
          }
          return next
        })
      } catch (error) {
        if (error instanceof AbortError) {
          return
        }
        throw error
      }
    }

    const disposals = emitters.map((emitter) => emitter.listen(handler))

    return () => {
      disposals.forEach((d) => d())
    }
    // oxlint-disable-next-line exhaustive-deps
  }, [disabled, getSelector, ...emitters])

  return state
}

export const createUseEmitter = <E extends Emitter<any>>(
  emitter: E
): ((cb: (val: EmitterType<E>) => void, args?: any[]) => void) => {
  return (cb: (val: EmitterType<E>) => void, args?: any[]) =>
    useEmitter(emitter, cb, args)
}

export const createUseSelector = <E extends Emitter<any>>(
  emitter: E
): (<R>(
  selector: (value: EmitterType<E>) => R,
  options?: { disable?: boolean; lazy?: boolean },
  args?: any[]
) => R) => {
  return <R,>(
    selector: (value: EmitterType<E>) => R,
    options?: { disable?: boolean; lazy?: boolean },
    args?: any[]
  ): R => {
    return useEmitterSelector(emitter, selector, options, args)
  }
}

export function createContextualEmitter<T>(
  name: string,
  defaultValue: T,
  defaultOptions?: Omit<EmitterOptions<T>, 'name'>
): readonly [
  () => Emitter<T>,
  (props: PropsWithChildren<{ value?: T; silent?: boolean }>) => JSX.Element,
] {
  const id = Math.random().toString(36)
  const EmitterContext = createGlobalContext<Emitter<T> | null>(
    `contextual-emitter/${id}`,
    null
  )

  const useContextEmitter = () => {
    const emitter = use(EmitterContext)
    if (!emitter) {
      throw new Error('useContextEmitter must be used within an EmitterProvider')
    }
    return emitter
  }

  type ProvideEmitterProps = PropsWithChildren<{
    value?: T
    silent?: boolean
  }>

  const ProvideEmitter = (props: ProvideEmitterProps) => {
    const { children, value, silent } = props
    const [emitter] = useState(
      () => new Emitter<T>(value ?? defaultValue, { name, silent, ...defaultOptions })
    )

    useLayoutEffect(() => {
      if (value !== undefined && value !== emitter.value) {
        emitter.emit(value)
      }
    }, [value, emitter])

    return <EmitterContext.Provider value={emitter}>{children}</EmitterContext.Provider>
  }

  return [useContextEmitter, ProvideEmitter] as const
}

const HMRCache =
  process.env.NODE_ENV === 'development'
    ? new Map<string, { originalDefaultValue: unknown; currentValue: unknown }>()
    : null

function setCache(emitter: Emitter<any>, value: unknown) {
  const name = emitter.options?.name
  if (!name) return
  const cache = HMRCache?.get(name)
  if (!cache) return
  cache.currentValue = value
}

function createOrUpdateCache(name: string, defaultValueProp: unknown) {
  const existing = HMRCache?.get(name)
  const defaultValue = dequal(existing?.originalDefaultValue, defaultValueProp)
    ? existing?.currentValue
    : defaultValueProp

  if (!existing) {
    HMRCache?.set(name, {
      originalDefaultValue: defaultValueProp,
      currentValue: defaultValue,
    })
  }

  return defaultValue
}
