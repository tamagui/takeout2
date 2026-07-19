type AsyncTaskEntry = {
  task: () => Promise<void>
  barrier: boolean
}

export type RunAsyncTaskEntriesOptions = {
  /** Receives the background-task promise. Omit this to await all entries. */
  background?: (promise: Promise<void>) => void
}

export async function runAsyncTaskEntries(
  entries: readonly AsyncTaskEntry[],
  { background }: RunAsyncTaskEntriesOptions = {},
): Promise<void> {
  const barriers = entries.filter((entry) => entry.barrier)
  const backgroundEntries = entries.filter((entry) => !entry.barrier)

  await Promise.all(barriers.map(({ task }) => task()))
  if (backgroundEntries.length === 0) return

  const promise = Promise.allSettled(
    backgroundEntries.map(({ task }) => Promise.resolve().then(task)),
  ).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[on-zero] async task failed', result.reason)
      }
    }
  })

  if (background) {
    background(promise)
  } else {
    await promise
  }
}
