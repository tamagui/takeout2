import { setStorageDriver } from '@o/helpers'
import { MMKV } from 'react-native-mmkv'

// only setupNative.ts loads this, so it runs on native alone: it installs mmkv
// behind the same helper storage API that web backs with localStorage.
const mmkv = new MMKV({ id: 'feed-template-storage' })

setStorageDriver({
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.delete(key),
  getAllKeys: () => mmkv.getAllKeys(),
})
