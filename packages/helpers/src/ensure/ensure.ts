import { EnsureError } from '../error/errors'

export function ensureExists<T>(
  value: T | undefined | null,
  msg = ''
): asserts value is T {
  if (value === undefined || value === null) {
    throw new EnsureError(`Invalid nullish value (${value}): ${msg}`)
  }
}

export function ensure<T>(
  value: T,
  msg = ''
): asserts value is Exclude<T, null | undefined | false> {
  if (!value) {
    throw new EnsureError(`ensure() invalid: (${value}): ${msg} ${new Error().stack}`)
  }
}

export function ensureError(val: unknown): asserts val is Error {
  if (!(val instanceof Error)) {
    throw val
  }
}

export function ensureString(val: unknown, name = '(unnamed)'): asserts val is string {
  if (typeof val !== 'string') {
    throw new EnsureError(`No string ${name}`)
  }
}
