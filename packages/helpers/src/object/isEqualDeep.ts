import { dequal } from 'dequal'
import { dequal as dequalLite } from 'dequal/lite'

type EqualityFn = (foo: any, bar: any) => boolean

export const isEqualDeep = dequal as any as EqualityFn
export const isEqualDeepLite = dequalLite as any as EqualityFn
