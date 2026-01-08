import type { StorageDriver } from './types'

let driver: StorageDriver | null = null

export function setStorageDriver(d: StorageDriver): void {
  driver = d
}

export function getStorageDriver(): StorageDriver | null {
  if (driver) return driver
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
    return {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
      getAllKeys: () => Object.keys(localStorage),
    }
  }
  return null
}
