import { AbortError } from './error/errors'

export function assertExists<T>(value: T | undefined | null, msg = ''): T {
  if (value === undefined || value === null) {
    throw new AbortError(`Invalid nullish value (${value}): ${msg}`)
  }
  return value
}

export function assert<T>(value: T, msg = ''): Exclude<T, null | undefined | false> {
  if (!value) {
    throw new AbortError(`Invalid falsy value (${value}): ${msg}`)
  }
  return value as Exclude<T, null | undefined | false>
}

export function assertError(val: unknown): Error {
  if (!(val instanceof Error)) {
    throw val
  }
  return val
}

export function assertString(val: unknown, name = '(unnamed)'): string {
  if (typeof val !== 'string') {
    throw new AbortError(`No string ${name}`)
  }
  return val
}
