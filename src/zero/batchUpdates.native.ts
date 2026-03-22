// react 19 auto-batches all state updates — passing react-native's
// unstable_batchedUpdates to zero causes "Should not already be working"
// because its finally{} block calls flushSyncWorkAcrossRoots_impl which
// can re-enter react's work loop during an active render/commit
export const unstable_batchedUpdates = undefined
