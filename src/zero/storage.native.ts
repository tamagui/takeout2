import { expoSQLiteStoreProvider } from '@rocicorp/zero/expo-sqlite'

type StoreProvider = ReturnType<typeof expoSQLiteStoreProvider>

export function createKVStore(userId: string | null): StoreProvider | 'mem' {
  if (!userId || userId === 'anon') {
    return 'mem'
  }
  return expoSQLiteStoreProvider()
}
