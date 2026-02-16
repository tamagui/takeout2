import { mapObject, time } from '@take-out/helpers'

import { isBrowser, isServer } from '../constants'
import { getAuthData } from '../state'
import { runWithContext } from './mutatorContext'

import type {
  AuthData,
  Can,
  GenericModels,
  GetZeroMutators,
  MutatorContext,
  Transaction,
} from '../types'

export type ValidateMutationFn = (args: {
  authData: AuthData | null
  mutatorName: string
  tableName: string
  args: unknown
}) => void | Promise<void>

export type { ValidateMutationFn as CreateMutatorsValidateFn }

export function createMutators<Models extends GenericModels>({
  environment,
  authData,
  createServerActions,
  asyncTasks = [],
  can,
  models,
  validateMutation,
}: {
  environment: 'server' | 'client'
  authData: AuthData | null
  can: Can
  models: Models
  asyncTasks?: Array<() => Promise<void>>
  createServerActions?: () => Record<string, any>
  validateMutation?: ValidateMutationFn
}): GetZeroMutators<Models> {
  const serverActions = createServerActions?.()

  const modelMutators = mapObject(models, (val) => val.mutate) as {
    [K in keyof typeof models]: (typeof models)[K]['mutate']
  }

  function withContext<Args extends any[]>(fn: (...args: Args) => Promise<void>) {
    return async (tx: Transaction, ...args: Args): Promise<void> => {
      const mutationContext: MutatorContext = {
        tx,
        // on client, read authData dynamically to avoid stale closure during auth transitions
        // (ZeroProvider recreates Zero instance in useEffect, but mutations can run before that)
        authData: isBrowser ? getAuthData() : authData,
        environment,
        can,
        server:
          environment === 'server'
            ? ({
                actions: serverActions || {},
                asyncTasks: asyncTasks || {},
              } as MutatorContext['server'])
            : undefined,
      }

      return await runWithContext(mutationContext, () => {
        // @ts-expect-error type shenanigan
        // map to our mutations() helper
        return fn(mutationContext, ...args)
      })
    }
  }

  function withDevelopmentLogging<Args extends any[]>(
    name: string,
    fn: (...args: Args) => Promise<void>
  ) {
    if (process.env.NODE_ENV !== 'development' && !process.env.IS_TESTING) {
      return fn
    }

    const debug = process.env.DEBUG

    return async (...args: Args): Promise<void> => {
      const startTime = performance.now()

      try {
        if (debug && isServer) {
          console.info(`[mutator] ${name} start`)
        }
        const result = await fn(...args)
        const duration = (performance.now() - startTime).toFixed(2)
        if (debug) {
          if (isBrowser) {
            console.groupCollapsed(`[mutator] ${name} completed in ${duration}ms`)
            console.info('→', args[1])
            console.info('←', result)
            console.trace()
            console.groupEnd()
          } else {
            console.info(`[mutator] ${name} completed in ${duration}ms`)
          }
        }
        return result
      } catch (error) {
        // always log errors
        const duration = (performance.now() - startTime).toFixed(2)
        console.groupCollapsed(`[mutator] ${name} failed after ${duration}ms`)
        console.error('error:', error)
        console.info('arguments:', JSON.stringify(args[1], null, 2))
        console.info('stack trace:', new Error().stack)
        console.groupEnd()
        throw error
      }
    }
  }

  function withTimeoutGuard<Args extends any[]>(
    name: string,
    fn: (...args: Args) => Promise<void>,
    // don't want this too high - zero runs mutations in order and waits for the last to finish it seems
    // so if one mutation gets stuck it will just sit there
    timeoutMs: number = time.ms.minutes(1)
  ) {
    return async (...args: Args): Promise<void> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`[mutator] ${name} timeout after ${timeoutMs}ms`))
        }, timeoutMs)
      })

      return Promise.race([fn(...args), timeoutPromise])
    }
  }

  function withValidation<Args extends any[]>(
    tableName: string,
    mutatorName: string,
    fn: (...args: Args) => Promise<void>
  ) {
    if (!validateMutation) {
      return fn
    }

    return async (...args: Args): Promise<void> => {
      // args[0] is tx, args[1] is the mutation args
      await validateMutation({
        authData: isBrowser ? getAuthData() : authData,
        tableName,
        mutatorName,
        args: args[1],
      })
      return fn(...args)
    }
  }

  function decorateMutators<T extends Record<string, Record<string, any>>>(modules: T) {
    const result: any = {}

    for (const [moduleName, moduleExports] of Object.entries(modules)) {
      result[moduleName] = {}
      for (const [name] of Object.entries(moduleExports)) {
        const fullName = `${moduleName}.${name}`
        // look up function dynamically to support HMR
        // modules[moduleName] is a proxy that returns updated implementations
        const getDynamicFn = () => modules[moduleName][name]

        result[moduleName][name] = withDevelopmentLogging(
          fullName,
          withTimeoutGuard(
            fullName,
            withValidation(
              moduleName,
              name,
              withContext((...args: any[]) => getDynamicFn()(...args))
            )
          )
        )
      }
    }

    return result
  }

  return decorateMutators(modelMutators)
}
