import { IS_CLIENT } from '~/constants/platform'

export function createKVStore(userId: string | null): 'idb' | 'mem' {
  // use idb for logged in users on web client
  if (IS_CLIENT && userId && userId !== 'anon') {
    return 'idb'
  }

  // fallback to memory for anonymous users or server
  return 'mem'
}
