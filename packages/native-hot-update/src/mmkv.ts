import type { HotUpdateStorage } from './types'
import type { MMKV } from 'react-native-mmkv'

/**
 * Create a storage adapter for MMKV.
 *
 * @example
 * import { MMKV } from 'react-native-mmkv'
 * import { createMMKVStorage } from '@take-out/native-hot-update/mmkv'
 *
 * const mmkv = new MMKV({ id: 'hot-updater' })
 * const storage = createMMKVStorage(mmkv)
 */
export function createMMKVStorage(mmkv: MMKV): HotUpdateStorage {
  return {
    get: (key: string) => mmkv.getString(key),
    set: (key: string, value: string) => mmkv.set(key, value),
    delete: (key: string) => mmkv.delete(key),
  }
}
