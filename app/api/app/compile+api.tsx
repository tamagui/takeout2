import { transform } from 'esbuild'
import type { Endpoint } from 'one'
import { cleanupCompiledSource } from '~/apps/compile'

export const POST: Endpoint = async (req) => {
  const source = await req.text()
  const isDev = process.env.NODE_ENV === 'development'

  try {
    const { code } = await transform(source, {
      jsx: isDev ? 'automatic' : 'transform',
      format: 'esm',
      loader: 'tsx',
      platform: 'browser',
      jsxDev: isDev,
      jsxImportSource: 'react',
    })

    return new Response(cleanupCompiledSource(code))
  } catch (err) {
    console.error(`[compile+api] error compiling source`, source, err)

    return new Response('')
  }
}
