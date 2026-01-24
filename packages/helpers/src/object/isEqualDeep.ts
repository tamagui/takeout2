import { dequal } from 'dequal'
import { dequal as dequalLite } from 'dequal/lite'

type EqualityFn = (foo: any, bar: any) => boolean

export const isEqualDeep: EqualityFn = dequal
export const isEqualDeepLite: EqualityFn = dequalLite
