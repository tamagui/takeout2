import { getStorageDriver } from './driver'

// hmr-safe: store caches on globalThis so they survive module reloads
const globalKey = '__takeout_storage__'
const globalCache = ((globalThis as any)[globalKey] ??= {
  namespaces: new Set<string>(),
  instances: new Map<string, Storage<any, any>>(),
}) as {
  namespaces: Set<string>
  instances: Map<string, Storage<any, any>>
}

/**
 * namespaced storage interface with JSON serialization
 * @template K - key type (string literal union for type-safe keys)
 * @template V - value type (automatically JSON serialized/deserialized)
 */
export interface Storage<K extends string = string, V = unknown> {
  /** get a JSON-parsed value by key */
  get(key: K): V | undefined
  /** set a value (JSON serialized) */
  set(key: K, value: V): void
  /** remove a key */
  remove(key: K): void
  /** check if key exists */
  has(key: K): boolean
  /** get all keys in this namespace */
  keys(): K[]
  /** remove all keys in this namespace */
  clear(): void
  /** get raw string value (no JSON parsing) - localStorage compatible */
  getItem(key: K): string | null
  /** set raw string value (no JSON serialization) - localStorage compatible */
  setItem(key: K, value: string): void
}

/**
 * create a namespaced storage instance (hmr-safe, returns existing instance if already created)
 * @param namespace - unique prefix for all keys
 * @returns storage instance with get/set (JSON) and getItem/setItem (raw) methods
 * @example
 * const store = createStorage<'token' | 'user', string>('auth')
 * store.set('token', 'abc123')
 * store.get('token') // 'abc123'
 */
export function createStorage<K extends string, V>(namespace: string): Storage<K, V> {
  // return existing instance for hmr safety
  const existing = globalCache.instances.get(namespace)
  if (existing) {
    return existing as Storage<K, V>
  }

  globalCache.namespaces.add(namespace)

  const prefix = `${namespace}:`
  const prefixKey = (key: string) => `${prefix}${key}`

  const storage: Storage<K, V> = {
    get(key: K): V | undefined {
      const driver = getStorageDriver()
      if (!driver) return undefined
      const raw = driver.getItem(prefixKey(key))
      if (raw == null) return undefined
      try {
        return JSON.parse(raw)
      } catch {
        return undefined
      }
    },

    set(key: K, value: V): void {
      const driver = getStorageDriver()
      if (!driver) return
      driver.setItem(prefixKey(key), JSON.stringify(value))
    },

    remove(key: K): void {
      const driver = getStorageDriver()
      if (!driver) return
      driver.removeItem(prefixKey(key))
    },

    has(key: K): boolean {
      const driver = getStorageDriver()
      if (!driver) return false
      return driver.getItem(prefixKey(key)) != null
    },

    keys(): K[] {
      const driver = getStorageDriver()
      if (!driver) return []
      return driver
        .getAllKeys()
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length) as K)
    },

    clear(): void {
      const driver = getStorageDriver()
      if (!driver) return
      for (const key of this.keys()) {
        driver.removeItem(prefixKey(key))
      }
    },

    getItem(key: K): string | null {
      const driver = getStorageDriver()
      if (!driver) return null
      return driver.getItem(prefixKey(key)) ?? null
    },

    setItem(key: K, value: string): void {
      const driver = getStorageDriver()
      if (!driver) return
      driver.setItem(prefixKey(key), value)
    },
  }

  globalCache.instances.set(namespace, storage)
  return storage
}

/**
 * single-value storage interface
 * @template T - value type (automatically JSON serialized/deserialized)
 */
export interface StorageValue<T> {
  /** get the stored value */
  get(): T | undefined
  /** set the value */
  set(value: T): void
  /** remove the value */
  remove(): void
  /** check if value exists */
  has(): boolean
}

/**
 * create a single-value storage (wrapper around createStorage)
 * @param key - unique storage key
 * @returns storage value instance
 * @example
 * const token = createStorageValue<string>('auth-token')
 * token.set('abc123')
 * token.get() // 'abc123'
 */
export function createStorageValue<T>(key: string): StorageValue<T> {
  const storage = createStorage<'value', T>(`_v:${key}`)
  return {
    get: (): T | undefined => storage.get('value'),
    set: (value: T): void => storage.set('value', value),
    remove: (): void => storage.remove('value'),
    has: (): boolean => storage.has('value'),
  }
}
