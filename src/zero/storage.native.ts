import { opSQLiteStoreProvider } from '@rocicorp/zero/op-sqlite'

type StoreProvider = ReturnType<typeof opSQLiteStoreProvider>

export function createKVStore(userId: string | null): StoreProvider | 'mem' {
  return opSQLiteStoreProvider()
}
