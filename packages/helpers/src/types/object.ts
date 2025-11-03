// note - TS doesn't support higher kinded types, so this doesn't work well

// --- utils ---

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K] // the ‘-readonly’ mapped-type modifier
}

export type EntriesType =
  | [PropertyKey, unknown][]
  | ReadonlyArray<readonly [PropertyKey, unknown]>

type DeepWritable<OBJ_T> = { -readonly [P in keyof OBJ_T]: DeepWritable<OBJ_T[P]> }
type UnionToIntersection<UNION_T> = // From https://stackoverflow.com/a/50375286
  (UNION_T extends any ? (k: UNION_T) => void : never) extends (k: infer I) => void
    ? I
    : never

type UnionObjectFromArrayOfPairs<ARR_T extends EntriesType> =
  DeepWritable<ARR_T> extends (infer R)[]
    ? R extends [infer key, infer val]
      ? { [prop in key & PropertyKey]: val }
      : never
    : never

type MergeIntersectingObjects<ObjT> = { [key in keyof ObjT]: ObjT[key] }

export type EntriesToObject<ARR_T extends EntriesType> = MergeIntersectingObjects<
  UnionToIntersection<UnionObjectFromArrayOfPairs<ARR_T>>
>

export type ObjectType = Record<PropertyKey, unknown>

type PickByValue<OBJ_T, VALUE_T> = // From https://stackoverflow.com/a/55153000
  Pick<OBJ_T, { [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never }[keyof OBJ_T]>

export type ObjectEntries<OBJ_T> = // From https://stackoverflow.com/a/60142095
  { [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]] }[keyof OBJ_T][]
