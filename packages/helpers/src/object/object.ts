import type {
  EntriesToObject,
  EntriesType,
  ObjectEntries,
  ObjectType,
} from '../types/object'

export function postfixObjKeys<A extends { [key: string]: string }, B extends string>(
  obj: A,
  postfix: B
): {
  [Key in `${keyof A extends string ? keyof A : never}${B}`]: string
} {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [`${k}${postfix}`, v])
  ) as any
}

export function objectFromEntries<ARR_T extends EntriesType>(
  arr: ARR_T
): EntriesToObject<ARR_T> {
  return Object.fromEntries(arr) as EntriesToObject<ARR_T>
}

export function objectKeys<O extends object>(obj: O) {
  return Object.keys(obj) as Array<keyof O>
}

export function objectEntries<OBJ_T extends ObjectType>(
  obj: OBJ_T
): ObjectEntries<OBJ_T> {
  return Object.entries(obj) as ObjectEntries<OBJ_T>
}
