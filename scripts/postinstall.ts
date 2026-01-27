#!/usr/bin/env bun

/**
 * @description npm postinstall tasks
 */

import { $ } from 'bun'

// "tko" wont work until this runs so referencing it directly:
const buildInitialLocation = require.resolve('@take-out/scripts/build-initial')
await $`bun run ${buildInitialLocation}`

await Promise.all([
  //
  $`bun tko run update-local-env`,
  $`bun run one patch`,
])

// fix RNGH crash on RN 0.81+ new architecture
// getShadowNodeFromRef crashes when findHostInstance_DEPRECATED returns null
const rnghPatchPath =
  'node_modules/react-native-gesture-handler/lib/module/getShadowNodeFromRef.js'
const rnghFile = await Bun.file(rnghPatchPath)
  .text()
  .catch(() => null)
if (
  rnghFile?.includes(
    'return getInternalInstanceHandleFromPublicInstance(findHostInstance_DEPRECATED(ref)).stateNode.node;'
  )
) {
  const patched = rnghFile.replace(
    'return getInternalInstanceHandleFromPublicInstance(findHostInstance_DEPRECATED(ref)).stateNode.node;',
    `const hostInstance = findHostInstance_DEPRECATED(ref);
  if (hostInstance === null || hostInstance === undefined) {
    return null;
  }
  const internalHandle = getInternalInstanceHandleFromPublicInstance(hostInstance);
  if (internalHandle === null || internalHandle === undefined) {
    return null;
  }
  return internalHandle.stateNode?.node ?? null;`
  )
  await Bun.write(rnghPatchPath, patched)
  console.info('[postinstall] patched react-native-gesture-handler getShadowNodeFromRef')
} else {
  console.info(
    '[postinstall] react-native-gesture-handler getShadowNodeFromRef already patched or not found'
  )
}
