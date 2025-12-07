import { setDevGlobal } from '~/features/devtools/devGlobal'
import { showNotification } from '~/interface/notification/Notification'

export async function clearLocalStorage() {
  localStorage.clear()
}

export async function clearSessionStorage() {
  sessionStorage.clear()
}

export async function clearIndexedDB() {
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

export async function clearCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
  }
}

export async function clearServiceWorkers() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((reg) => reg.unregister()))
  }
}

export async function clearCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    // eslint-disable-next-line no-document-cookie
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    // eslint-disable-next-line no-document-cookie
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
    // eslint-disable-next-line no-document-cookie
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
  })
}

export async function clearAllDataAndStorages() {
  const results: Array<{ type: string; success: boolean; error?: string }> = []

  try {
    await clearLocalStorage()
    results.push({ type: 'localStorage', success: true })
  } catch (error) {
    results.push({
      type: 'localStorage',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  try {
    await clearSessionStorage()
    results.push({ type: 'sessionStorage', success: true })
  } catch (error) {
    results.push({
      type: 'sessionStorage',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  try {
    await clearIndexedDB()
    results.push({ type: 'indexedDB', success: true })
  } catch (error) {
    results.push({
      type: 'indexedDB',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  try {
    await clearCaches()
    results.push({ type: 'caches', success: true })
  } catch (error) {
    results.push({
      type: 'caches',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  try {
    await clearServiceWorkers()
    results.push({ type: 'serviceWorker', success: true })
  } catch (error) {
    results.push({
      type: 'serviceWorker',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  try {
    await clearCookies()
    results.push({ type: 'cookies', success: true })
  } catch (error) {
    results.push({
      type: 'cookies',
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    })
  }

  const failures = results.filter((r) => !r.success)
  if (failures.length > 0) {
    throw new Error(
      `failed to clear some storage types: ${failures.map((f) => f.type).join(', ')}`
    )
  }

  showNotification(`Cleared all data`, {
    display: 'info',
    description: `Cleared: ${results.map((i) => i.type).join(', ')}`,
    action: {
      label: 'Reload',
      onPress() {
        window.location.reload()
      },
    },
  })
}

setDevGlobal(clearAllDataAndStorages, 'clearAllDataAndStorages')
