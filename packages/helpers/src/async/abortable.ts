import { AbortError, EnsureError } from '../error/errors'

type AbortableOptions = { message?: string }

export function abortable<T>(cb: () => T, options?: AbortableOptions): T | undefined
export function abortable<T>(
  cb: () => Promise<T>,
  options?: AbortableOptions
): Promise<T | undefined>
export function abortable<T>(
  cb: () => T | Promise<T>,
  options?: AbortableOptions
): T | undefined | Promise<T | undefined> {
  try {
    const value = cb()

    if (value instanceof Promise) {
      return value.catch((err) => {
        if (didAbort(err, options)) {
          return undefined
        }
        throw err
      })
    }

    return value
  } catch (err) {
    if (didAbort(err, options)) {
      return undefined
    }
    throw err
  }
}

export function didAbort(err: unknown, options?: AbortableOptions): boolean {
  if (err instanceof AbortError || err instanceof EnsureError) {
    if (options?.message) {
      console.warn(`Aborted: ${options.message}`)
    }
    return true
  }
  return false
}

export function handleAbortError(error: any, debug?: boolean): void {
  if (error instanceof AbortError || error instanceof EnsureError) {
    if (debug || process.env.DEBUG) {
      console.info(`🐛 useAsyncEffect aborted: ${error.message}`)
    }
    return
  }

  // js handles aborting a promise as an error. ignore them since they're
  // a normal part of the expected async workflow
  if (typeof error === 'object' && error.name === 'AbortError') {
    return
  }

  throw error
}
