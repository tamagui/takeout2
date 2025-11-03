export type NullToOptional<T> = {
  [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null> | undefined | null
} & {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
}
