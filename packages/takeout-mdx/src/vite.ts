const RUNTIME_WASM_SPECIFIER = 'takeout-mdx/runtime.wasm'

export type MDXVitePlugin = {
  name: string
  enforce: 'pre'
  resolveId(source: string): { id: string; external: true } | null
}

export function mdxPlugin(): MDXVitePlugin {
  return {
    name: 'takeout-mdx-worker-wasm',
    enforce: 'pre',
    resolveId(source) {
      return source === RUNTIME_WASM_SPECIFIER
        ? { id: RUNTIME_WASM_SPECIFIER, external: true }
        : null
    },
  }
}
