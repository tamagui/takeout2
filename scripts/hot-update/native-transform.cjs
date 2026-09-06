// native (no-babel) replacement for `hot-updater/babel-plugin`.
//
// One's metro native transform path (ONE_METRO_NATIVE_TRANSFORMS=1) runs no
// babel, so hot-updater's plugin cannot run there. Its only transform this app
// actually hits is replacing the `__HOT_UPDATER_BUNDLE_ID` identifier in
// @hot-updater/react-native, which is otherwise undeclared and throws a
// ReferenceError at module load.
//
// The DOM-component `filePath` -> `overrideUri` rewrite the babel plugin also
// does is not ported: this app has no `use dom` components, so it never fires.
// Adding one means porting that half too.

const fs = require('node:fs')
const path = require('node:path')

const NIL_UUID = '00000000-0000-0000-0000-000000000000'
const IDENT = '__HOT_UPDATER_BUNDLE_ID'

let bundleId

// same contract as hot-updater's plugin: BUILD_OUT_DIR/BUNDLE_ID holds the id
// for a release build, and dev builds get the nil uuid.
function getBundleId() {
  if (bundleId) return bundleId
  const buildOutDir = process.env.BUILD_OUT_DIR
  if (!buildOutDir) {
    bundleId = NIL_UUID
    return bundleId
  }
  const bundleIdPath = path.join(buildOutDir, 'BUNDLE_ID')
  if (!fs.existsSync(bundleIdPath)) {
    throw new Error(
      `[hot-update] BUILD_OUT_DIR is set but ${bundleIdPath} does not exist. ` +
        `hot-updater's CLI writes it; run the transform under the hot-updater build.`
    )
  }
  bundleId = fs.readFileSync(bundleIdPath, 'utf-8').trim()
  return bundleId
}

module.exports = function hotUpdaterNativeTransform(code, { filename }) {
  // the substring check keeps the parse off every other file in the bundle.
  if (!code.includes(IDENT)) return null

  const { parseSync } = require('oxc-parser')
  const lang = filename.endsWith('.tsx')
    ? 'tsx'
    : filename.endsWith('.ts')
      ? 'ts'
      : 'jsx'
  const { program, errors } = parseSync(filename, code, { lang })
  if (errors.length) {
    throw new Error(`[hot-update] failed to parse ${filename}: ${errors[0].message}`)
  }

  // identifier reads only, exactly like the babel plugin's Identifier visitor.
  // a string or property with the same text is left alone.
  const spans = []
  const walk = (node, parent, key) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const child of node) walk(child, parent, key)
      return
    }
    if (node.type === 'Identifier' && node.name === IDENT) {
      const isPropertyName =
        (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
        (parent?.type === 'Property' && parent.key === node && !parent.computed)
      if (!isPropertyName) spans.push([node.start, node.end])
    }
    for (const k of Object.keys(node)) {
      if (k === 'start' || k === 'end' || k === 'loc' || k === 'range' || k === 'parent') continue
      walk(node[k], node, k)
    }
  }
  walk(program, null, null)
  if (!spans.length) return null

  const literal = JSON.stringify(getBundleId())
  let out = ''
  let last = 0
  for (const [start, end] of spans.sort((a, b) => a[0] - b[0])) {
    out += code.slice(last, start) + literal
    last = end
  }
  return out + code.slice(last)
}
