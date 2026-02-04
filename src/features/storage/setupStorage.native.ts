import { setStorageDriver } from '@take-out/helpers'
import { MMKV } from 'react-native-mmkv'

const mmkv = new MMKV({ id: 'app-storage-2' })

setStorageDriver({
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.delete(key),
  getAllKeys: () => mmkv.getAllKeys(),
})
