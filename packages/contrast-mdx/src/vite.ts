const RUNTIME_WASM_SPECIFIER = 'contrast-mdx/runtime.wasm'

export type ContrastMDXVitePlugin = {
  name: string
  enforce: 'pre'
  resolveId(source: string): { id: string; external: true } | null
}

export function contrastMDX(): ContrastMDXVitePlugin {
  return {
    name: 'contrast-mdx-worker-wasm',
    enforce: 'pre',
    resolveId(source) {
      return source === RUNTIME_WASM_SPECIFIER
        ? { id: RUNTIME_WASM_SPECIFIER, external: true }
        : null
    },
  }
}
