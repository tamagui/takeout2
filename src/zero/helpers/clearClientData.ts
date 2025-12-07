import { showToast } from '~/interface/toast/Toast'

import { zero } from '../client'

export const clearClientData = async () => {
  try {
    // Get all IndexedDB databases
    const databases = await indexedDB.databases()

    // Find Zero/Replicache databases
    const zeroAndReplicacheDatabases = databases.filter((db) => {
      if (!db.name) return false
      const name = db.name.toLowerCase()
      return (
        name.includes('zero') ||
        name.includes('replicache') ||
        name.includes('roc') || // rocicorp prefix
        name.startsWith('rep:') // replicache prefix
      )
    })

    if (zeroAndReplicacheDatabases.length > 0) {
      // Delete all Zero/Replicache databases
      await Promise.all(
        zeroAndReplicacheDatabases.map((db) => {
          return new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name!)
            deleteReq.onsuccess = () => resolve()
            deleteReq.onerror = () => reject(deleteReq.error)
            deleteReq.onblocked = () => reject(new Error('database deletion blocked'))
          })
        })
      )

      const dbNames = zeroAndReplicacheDatabases.map((db) => db.name).join(', ')
      showToast(
        `Cleared ${zeroAndReplicacheDatabases.length} Zero/Replicache databases: ${dbNames}`
      )
    } else {
      // Fallback: clear all IndexedDB databases
      await Promise.all(
        databases.map((db) => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!)
              deleteReq.onsuccess = () => resolve()
              deleteReq.onerror = () => reject(deleteReq.error)
              deleteReq.onblocked = () => reject(new Error('database deletion blocked'))
            })
          }
        })
      )
      showToast('Cleared all IndexedDB databases')
    }

    // Close the zero connection before reloading
    if (zero && typeof (zero as any).close === 'function') {
      await (zero as any).close()
    }

    // Reload the page to reinitialize Zero
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    console.error('Error clearing Zero database:', error)
    showToast('Error clearing Zero database')
  }
}
