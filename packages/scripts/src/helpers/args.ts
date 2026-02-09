/**
 * ultra simple typed arg parsing
 *
 * @example
 * const { port, verbose, rest } = args`--port number --verbose boolean`
 * // port: number | undefined
 * // verbose: boolean
 * // rest: string[] - positional args that don't match any flag
 */

type ParseType<T extends string> = T extends 'number'
  ? number | undefined
  : T extends 'boolean'
    ? boolean
    : T extends 'string'
      ? string | undefined
      : never

type ParseFlag<S extends string> = S extends `--${infer Name} ${infer Type}`
  ? { [K in Name as KebabToCamel<K>]: ParseType<Type> }
  : S extends `-${infer Name} ${infer Type}`
    ? { [K in Name as KebabToCamel<K>]: ParseType<Type> }
    : object

type KebabToCamel<S extends string> = S extends `${infer A}-${infer B}`
  ? `${A}${Capitalize<KebabToCamel<B>>}`
  : S

// trim leading/trailing whitespace from string type
type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer R} `
    ? Trim<R>
    : S extends `\n${infer R}`
      ? Trim<R>
      : S extends `${infer R}\n`
        ? Trim<R>
        : S

// split on -- allowing any whitespace between flags
type ParseFlags<S extends string> =
  Trim<S> extends `${infer Flag} --${infer Rest}`
    ? ParseFlag<Trim<Flag>> & ParseFlags<`--${Rest}`>
    : Trim<S> extends `${infer Flag}\n--${infer Rest}`
      ? ParseFlag<Trim<Flag>> & ParseFlags<`--${Rest}`>
      : Trim<S> extends `${infer Flag} -${infer Rest}`
        ? ParseFlag<Trim<Flag>> & ParseFlags<`-${Rest}`>
        : Trim<S> extends `${infer Flag}\n-${infer Rest}`
          ? ParseFlag<Trim<Flag>> & ParseFlags<`-${Rest}`>
          : ParseFlag<Trim<S>>

// flatten intersection into single object for nice hover display
type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type Args<S extends string> = Prettify<ParseFlags<S> & { rest: string[] }>

export function args<const S extends string>(spec: S): Args<S>
export function args<const S extends string>(strings: TemplateStringsArray | S): Args<S> {
  const spec = typeof strings === 'string' ? strings : strings[0] || ''
  const argv = process.argv.slice(2)

  // parse spec: "--port number --verbose boolean"
  const schema: Record<string, 'string' | 'number' | 'boolean'> = {}
  const matches = spec.matchAll(/--?([a-z0-9-]+)\s+(string|number|boolean)/gi)

  for (const [, flag, type] of matches) {
    const camel = flag!.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
    schema[camel] = type as 'string' | 'number' | 'boolean'
  }

  const result: Record<string, string | number | boolean | undefined> = {}
  const rest: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!

    if (arg.startsWith('-')) {
      const key = arg
        .replace(/^--?/, '')
        .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
      const type = schema[key]

      if (type === 'boolean') {
        result[key] = true
      } else if (type === 'string' || type === 'number') {
        const val = argv[++i]
        result[key] = type === 'number' ? Number(val) : val
      } else {
        rest.push(arg)
      }
    } else {
      rest.push(arg)
    }
  }

  return { ...result, rest } as Args<S>
}
