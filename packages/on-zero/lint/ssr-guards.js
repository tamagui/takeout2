/**
 * canonical oxlint plugin for zero model SSR guards — shipped WITH on-zero so
 * every consumer references ONE source instead of copying it. add it as a
 * jsPlugins entry in the consumer's .oxlintrc.json.
 *
 * it enforces on-zero's own footgun contract: run() and
 * server.enqueueTask() must appear only inside a tree-shakeable
 * `if (process.env.VITE_ENVIRONMENT === 'ssr')` block, never in the
 * non-tree-shakeable `!== 'ssr'` early-return form.
 *
 * valid guards (tree-shakeable):
 * - if (isSSR) { ... }              — `typeof window === 'undefined'` constant
 * - if (process.env.VITE_ENVIRONMENT === 'ssr') { ... }  — legacy
 *
 * `if (server)` is NOT valid because it doesn't tree-shake.
 */

function isEnvSSRCheck(node) {
  if (!node) return false

  // process.env.VITE_ENVIRONMENT === 'ssr'
  if (node.type === 'BinaryExpression' && node.operator === '===') {
    const left = node.left
    const right = node.right
    if (
      left.type === 'MemberExpression' &&
      left.object?.type === 'MemberExpression' &&
      left.object?.object?.name === 'process' &&
      left.object?.property?.name === 'env' &&
      left.property?.name === 'VITE_ENVIRONMENT' &&
      right.type === 'Literal' &&
      right.value === 'ssr'
    ) {
      return true
    }
  }

  // check compound conditions: if (x && isSSR)
  if (node.type === 'LogicalExpression' && node.operator === '&&') {
    return isEnvSSRCheck(node.left) || isEnvSSRCheck(node.right)
  }

  return false
}

function isSSRGuard(node) {
  if (node.type !== 'IfStatement') return false
  return isEnvSSRCheck(node.test)
}

function isModelFile(filename) {
  return (
    filename.includes('/data/mutations/') &&
    !filename.includes('/data/mutations/helpers/')
  )
}

// detect: if (process.env.VITE_ENVIRONMENT !== 'ssr') return
function isSSREarlyReturn(node) {
  if (node.type !== 'IfStatement') return false
  const test = node.test
  if (
    test.type === 'BinaryExpression' &&
    test.operator === '!==' &&
    test.left?.type === 'MemberExpression' &&
    test.left?.object?.type === 'MemberExpression' &&
    test.left?.object?.object?.name === 'process' &&
    test.left?.object?.property?.name === 'env' &&
    test.left?.property?.name === 'VITE_ENVIRONMENT' &&
    test.right?.type === 'Literal' &&
    test.right?.value === 'ssr'
  ) {
    const body =
      node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent]
    return body.some((s) => s.type === 'ReturnStatement')
  }
  return false
}

function createSSRGuardRule(matchCallee, messageId, message) {
  return {
    meta: {
      type: 'problem',
      messages: { [messageId]: message },
    },
    create(context) {
      const filename = context.filename || context.getFilename()
      if (!isModelFile(filename)) return {}

      let isServerOnly = false
      let guardDepth = 0

      return {
        ImportDeclaration(node) {
          if (node.source.value === 'server-only') {
            isServerOnly = true
          }
        },
        IfStatement(node) {
          if (isSSRGuard(node)) guardDepth++
        },
        'IfStatement:exit'(node) {
          if (isSSRGuard(node)) guardDepth--
        },
        CallExpression(node) {
          if (isServerOnly) return
          if (matchCallee(node) && guardDepth === 0) {
            context.report({ node, messageId })
          }
        },
      }
    },
  }
}

const runCallRule = createSSRGuardRule(
  (node) => node.callee.type === 'Identifier' && node.callee.name === 'run',
  'missingGuard',
  'run() is a footgun on client, must be inside `if (process.env.VITE_ENVIRONMENT === "ssr")`',
)

const enqueueTaskRule = createSSRGuardRule(
  (node) => {
    const callee = node.callee
    const object = callee.object
    return (
      callee.type === 'MemberExpression' &&
      callee.property?.name === 'enqueueTask' &&
      ((object.type === 'Identifier' && object.name === 'server') ||
        (object.type === 'MemberExpression' && object.property?.name === 'server'))
    )
  },
  'missingGuard',
  'server.enqueueTask must be inside `if (process.env.VITE_ENVIRONMENT === "ssr")`',
)

const noEarlyReturnRule = {
  meta: {
    type: 'problem',
    messages: {
      noEarlyReturn:
        'Use `if (process.env.VITE_ENVIRONMENT === "ssr") { ... }` block, not `!== "ssr"` early return',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename()
    if (!isModelFile(filename)) return {}
    return {
      IfStatement(node) {
        if (isSSREarlyReturn(node)) {
          context.report({ node, messageId: 'noEarlyReturn' })
        }
      },
    }
  },
}

export default {
  meta: { name: 'ssr-guards' },
  rules: {
    'run-call': runCallRule,
    'async-tasks': enqueueTaskRule,
    'no-early-return': noEarlyReturnRule,
  },
}
