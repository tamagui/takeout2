/**
 * oxlint plugin: app/_middleware.ts must not have runtime top-level imports.
 */
export default {
  meta: { name: 'middleware-imports' },
  rules: {
    'no-top-level-runtime-imports': {
      meta: {
        type: 'problem',
        messages: {
          invalidImport:
            'Do not add runtime top-level imports to app/_middleware.ts. Use dynamic import() inside the middleware function instead.',
        },
      },
      create(context) {
        const filename = context.filename || context.getFilename()
        if (!filename.endsWith('/app/_middleware.ts')) return {}

        return {
          ImportDeclaration(node) {
            if (node.importKind === 'type') return
            context.report({ node, messageId: 'invalidImport' })
          },
        }
      },
    },
  },
}
