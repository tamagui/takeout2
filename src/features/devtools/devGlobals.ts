import * as One from 'one'

if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  globalThis.One = One
}
