const created = new Set<string>()

const STORAGE_TRACKING_KEY = '__localStorage_tracking__'
const STORAGE_ORDER_KEY = '__localStorage_order__'

interface StorageTracking {
  [key: string]: number // key -> size in bytes
}

interface LocalStorageOptions {
  synced?: boolean
  disableSetOnBlur?: boolean

  /**
   * Limit in kB
   */
  storageLimit?: number
}

export function createLocalStorage<K extends string, V>(
  name: string,
  { synced = false, disableSetOnBlur = false, storageLimit }: LocalStorageOptions = {}
) {
  if (created.has(name)) {
    throw new Error(`Already defined this localStorage namespace: ${name}`)
  }
  created.add(name)

  let isWindowActive = true
  if (typeof window !== 'undefined' && disableSetOnBlur) {
    const handleFocus = () => {
      isWindowActive = true
    }
    const handleBlur = () => {
      isWindowActive = false
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    isWindowActive = document.hasFocus()
  }

  const listeners = new Map<string, Set<(value: any) => void>>()

  if (synced && typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith(`${name}:`) && event.storageArea === localStorage) {
        const key = event.key.slice(name.length + 1)
        const newValue = event.newValue ? JSON.parse(event.newValue) : undefined
        const keyListeners = listeners.get(key)
        if (keyListeners) {
          keyListeners.forEach((listener) => listener(newValue))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
  }

  const getFullKey = (key: string) => `${name}:${key}`

  return {
    get: (key: K): V | undefined => {
      if (typeof localStorage === 'undefined') {
        console.warn(`No localStorage`)
        return
      }

      const fullKey = getFullKey(key)
      const item = localStorage.getItem(fullKey)
      if (item && storageLimit) {
        updateKeyAccess(fullKey)
      }
      return item ? JSON.parse(item) : undefined
    },

    set: (key: K, value: V): void => {
      if (typeof localStorage === 'undefined') {
        console.warn(`No localStorage`)
        return
      }

      if (disableSetOnBlur && !isWindowActive) {
        return
      }

      const fullKey = getFullKey(key)
      const serializedValue = JSON.stringify(value)

      if (storageLimit) {
        const newSize = getStringSizeInBytes(serializedValue)
        enforceStorageLimit(fullKey, newSize, storageLimit)
        const tracking = getStorageTracking()
        tracking[fullKey] = newSize
        setStorageTracking(tracking)
        updateKeyAccess(fullKey)
      }

      localStorage.setItem(fullKey, serializedValue)
    },

    remove: (key: K): void => {
      if (typeof localStorage === 'undefined') {
        console.warn(`No localStorage`)
        return
      }

      // don't remove if window is not active and disablesetonblur is true
      if (disableSetOnBlur && !isWindowActive) {
        return
      }

      const fullKey = getFullKey(key)
      localStorage.removeItem(fullKey)

      // clean up tracking data if storage limit is enabled
      if (storageLimit) {
        const tracking = getStorageTracking()
        delete tracking[fullKey]
        setStorageTracking(tracking)

        const order = getStorageOrder()
        const index = order.indexOf(fullKey)
        if (index > -1) {
          order.splice(index, 1)
          setStorageOrder(order)
        }
      }
    },

    exists: (key: K): boolean => {
      const fullKey = getFullKey(key)
      return localStorage.getItem(fullKey) != null
    },

    clear: (): void => {
      if (typeof localStorage === 'undefined') {
        console.warn(`No localStorage`)
        return
      }

      // Remove all keys with this namespace
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${name}:`)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // Clean up tracking data
      if (storageLimit) {
        const tracking = getStorageTracking()
        const order = getStorageOrder()

        keysToRemove.forEach((key) => {
          delete tracking[key]
          const index = order.indexOf(key)
          if (index > -1) {
            order.splice(index, 1)
          }
        })

        setStorageTracking(tracking)
        setStorageOrder(order)
      }
    },

    subscribe: (key: string, listener: (value: V | undefined) => void): (() => void) => {
      if (!synced) {
        console.warn(`Subscribe only works when synced option is enabled`)
        return () => {}
      }

      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      const keyListeners = listeners.get(key)!
      keyListeners.add(listener)

      return () => {
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          listeners.delete(key)
        }
      }
    },

    keys: (): string[] => {
      if (typeof localStorage === 'undefined') {
        return []
      }

      const keys: string[] = []
      const prefix = `${name}:`

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          keys.push(key.slice(prefix.length))
        }
      }

      return keys
    },
  }
}

export function createLocalStorageValue<T>(
  key: string,
  options: LocalStorageOptions = {}
) {
  const storage = createLocalStorage<string, T>(`single:${key}`, options)
  const storageKey = 'value'

  return {
    get: (): T | undefined => {
      return storage.get(storageKey)
    },

    set: (value: T): void => {
      storage.set(storageKey, value)
    },

    remove: (): void => {
      storage.remove(storageKey)
    },

    exists: (): boolean => {
      return storage.exists(storageKey)
    },

    clear: (): void => {
      storage.clear()
    },

    subscribe: (listener: (value: T | undefined) => void): (() => void) => {
      return storage.subscribe(storageKey, listener)
    },
  }
}

function getStorageTracking(): StorageTracking {
  if (typeof localStorage === 'undefined') return {}
  const tracking = localStorage.getItem(STORAGE_TRACKING_KEY)
  return tracking ? JSON.parse(tracking) : {}
}

function setStorageTracking(tracking: StorageTracking): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_TRACKING_KEY, JSON.stringify(tracking))
}

function getStorageOrder(): string[] {
  if (typeof localStorage === 'undefined') return []
  const order = localStorage.getItem(STORAGE_ORDER_KEY)
  return order ? JSON.parse(order) : []
}

function setStorageOrder(order: string[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(order))
}

function getStringSizeInBytes(str: string): number {
  return new Blob([str]).size
}

function updateKeyAccess(key: string): void {
  const order = getStorageOrder()
  const index = order.indexOf(key)
  if (index > -1) {
    order.splice(index, 1)
  }
  order.push(key) // move to end (most recent)
  setStorageOrder(order)
}

function enforceStorageLimit(newKey: string, newSize: number, limitKB: number): void {
  const tracking = getStorageTracking()
  const order = getStorageOrder()

  let totalSize = Object.values(tracking).reduce((sum, size) => sum + size, 0)
  totalSize += newSize // add the new item size

  const limitBytes = limitKB * 1024

  while (totalSize > limitBytes && order.length > 0) {
    const oldestKey = order.shift()!

    if (
      oldestKey === newKey ||
      oldestKey === STORAGE_TRACKING_KEY ||
      oldestKey === STORAGE_ORDER_KEY
    ) {
      continue
    }

    const oldSize = tracking[oldestKey] || 0
    totalSize -= oldSize

    localStorage.removeItem(oldestKey)
    delete tracking[oldestKey]
  }

  setStorageTracking(tracking)
  setStorageOrder(order)
}
