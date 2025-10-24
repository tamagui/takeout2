import nord from 'shiki/themes/nord.mjs'
import oneLight from 'shiki/themes/one-light.mjs'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import wasm from 'shiki/wasm'

// import languages upfront
import javascript from 'shiki/langs/javascript.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import jsx from 'shiki/langs/jsx.mjs'
import json from 'shiki/langs/json.mjs'
import css from 'shiki/langs/css.mjs'
import html from 'shiki/langs/html.mjs'
import sql from 'shiki/langs/sql.mjs'
import python from 'shiki/langs/python.mjs'
import bash from 'shiki/langs/bash.mjs'
import shell from 'shiki/langs/shell.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import rust from 'shiki/langs/rust.mjs'
import go from 'shiki/langs/go.mjs'
import diff from 'shiki/langs/diff.mjs'

const langs = [
  javascript,
  typescript,
  tsx,
  jsx,
  json,
  css,
  html,
  sql,
  python,
  bash,
  shell,
  yaml,
  markdown,
  rust,
  go,
  diff,
]

let highlighter: Awaited<ReturnType<typeof createHighlighterCore>> | null = null

export async function getHighlighter() {
  if (highlighter) return highlighter

  highlighter = await createHighlighterCore({
    themes: [nord, oneLight],
    langs,
    engine: createOnigurumaEngine(wasm),
  })

  return highlighter
}

export async function highlightCode(code: string, language: string) {
  const hl = await getHighlighter()

  // check if language is supported
  const loadedLangs = hl.getLoadedLanguages()
  if (!loadedLangs.includes(language)) {
    console.info(`Language '${language}' not found, using plaintext`)
    language = 'text'
  }

  return hl.codeToHtml(code, {
    lang: language,
    themes: {
      light: 'one-light',
      dark: 'nord',
    },
  })
}
