/**
 * oxlint plugin: scripts/*\/*.ts should only import { cmd } from '@take-out/cli' at top level.
 */
export default {
  meta: { name: 'script-imports' },
  rules: {
    'no-top-level': {
      meta: {
        type: 'problem',
        messages: {
          invalidImport:
            "Only `import { cmd } from '@take-out/cli'` is allowed at top level in scripts. Use dynamic import() inside cmd.run() instead.",
        },
      },
      create(context) {
        const filename = context.filename || context.getFilename()
        if (!/scripts\/[^/]+\/[^/]+\.ts$/.test(filename)) return {}
        if (filename.includes('.test.')) return {}

        let hasCmdImport = false
        const imports = []

        return {
          ImportDeclaration(node) {
            if (node.source.value === '@take-out/cli') {
              hasCmdImport = true
              return
            }
            if (node.importKind === 'type') return
            imports.push(node)
          },
          'Program:exit'() {
            if (!hasCmdImport) return
            for (const node of imports) {
              context.report({ node, messageId: 'invalidImport' })
            }
          },
        }
      },
    },
  },
}
