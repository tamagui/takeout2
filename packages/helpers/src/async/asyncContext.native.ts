interface AsyncContext<T> {
  get(): T | undefined
  run<R>(value: T, fn: () => R | Promise<R>): Promise<R>
}

// react native implementation - no node:async_hooks available
export function createAsyncContext<T>(): AsyncContext<T> {
  let currentContext: T | undefined
  const contextStack: (T | undefined)[] = []

  return {
    get(): T | undefined {
      return currentContext
    },
    async run<R>(value: T, fn: () => R | Promise<R>): Promise<R> {
      const prevContext = currentContext
      currentContext = value
      contextStack.push(prevContext)

      // store original Promise methods
      const OriginalPromise = Promise
      const OriginalThen = OriginalPromise.prototype.then
      const OriginalCatch = OriginalPromise.prototype.catch
      const OriginalFinally = OriginalPromise.prototype.finally

      function wrapCallback(
        callback: Function | undefined | null,
        context: T | undefined
      ): Function | undefined | null {
        if (!callback) return callback
        return (...args: any[]) => {
          const prevContext = currentContext
          currentContext = context
          try {
            return callback(...args)
          } finally {
            currentContext = prevContext
          }
        }
      }

      // patch Promise methods to capture and restore context
      // eslint-disable-next-line no-then-property -- intentional patching for context propagation
      OriginalPromise.prototype.then = function (
        this: Promise<any>,
        onFulfilled?: any,
        onRejected?: any
      ): Promise<any> {
        const context = currentContext
        return OriginalThen.call(
          this,
          wrapCallback(onFulfilled, context) as any,
          wrapCallback(onRejected, context) as any
        )
      }

      OriginalPromise.prototype.catch = function (
        this: Promise<any>,
        onRejected?: any
      ): Promise<any> {
        const context = currentContext
        return OriginalCatch.call(this, wrapCallback(onRejected, context) as any)
      }

      OriginalPromise.prototype.finally = function (
        this: Promise<any>,
        onFinally?: any
      ): Promise<any> {
        const context = currentContext
        return OriginalFinally.call(this, wrapCallback(onFinally, context) as any)
      }

      try {
        const result = await fn()
        return result
      } finally {
        // restore original Promise methods
        // eslint-disable-next-line no-then-property -- restoring original methods
        OriginalPromise.prototype.then = OriginalThen
        OriginalPromise.prototype.catch = OriginalCatch
        OriginalPromise.prototype.finally = OriginalFinally

        contextStack.pop()
        currentContext = prevContext
      }
    },
  }
}
