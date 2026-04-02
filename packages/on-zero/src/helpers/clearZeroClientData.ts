const ZERO_DB_PATTERNS = ['zero', 'replicache', 'roc']
const ZERO_DB_PREFIXES = ['rep:']

function matchesZeroDB(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    ZERO_DB_PATTERNS.some((p) => lower.includes(p)) ||
    ZERO_DB_PREFIXES.some((p) => lower.startsWith(p))
  )
}

function deleteIndexedDB(name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('failed to delete database'))
    req.onblocked = () => reject(new Error('database deletion blocked'))
  })
}

export type ClearZeroClientDataOptions = {
  /** close the zero instance before clearing */
  closeZero?: () => Promise<void>
  /** called with info about what was cleared */
  onCleared?: (info: { count: number; names: string[] }) => void
  /** called on error */
  onError?: (error: unknown) => void
  /** reload the page after clearing (default: true) */
  reload?: boolean
  /** delay before reload in ms (default: 1000) */
  reloadDelay?: number
}

export async function clearZeroClientData(options: ClearZeroClientDataOptions = {}) {
  const { closeZero, onCleared, onError, reload = true, reloadDelay = 1000 } = options

  try {
    if (closeZero) {
      await closeZero().catch(() => {})
    }

    const databases = await indexedDB.databases()

    const zeroDbs = databases.filter((db) => db.name && matchesZeroDB(db.name))

    if (zeroDbs.length > 0) {
      await Promise.all(zeroDbs.map((db) => deleteIndexedDB(db.name!)))
      const names = zeroDbs.map((db) => db.name!)
      onCleared?.({ count: zeroDbs.length, names })
    } else {
      // fallback: clear all IndexedDB
      const allWithNames = databases.filter((db) => db.name)
      await Promise.all(allWithNames.map((db) => deleteIndexedDB(db.name!)))
      const names = allWithNames.map((db) => db.name!)
      onCleared?.({ count: allWithNames.length, names })
    }

    if (reload) {
      setTimeout(() => {
        window.location.reload()
      }, reloadDelay)
    }
  } catch (error) {
    console.error('[on-zero] error clearing client data:', error)
    onError?.(error)
  }
}
