export async function clearIndexedDB(): Promise<void> {
  if ('indexedDB' in window) {
    const databases = await indexedDB.databases()
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
        return Promise.resolve()
      })
    )
  }
}
