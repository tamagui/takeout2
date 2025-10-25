import { batchQuery } from 'over-zero'
import { zeroServer } from '~/zero/server'

export type ZeroMigration = {
  version: number
  name: string
  run: () => Promise<void>
}

export const migrations: ZeroMigration[] = [
  {
    version: 0,
    name: 'initial-social-setup',
    run: async () => {
      // Initial setup for social features
      // User stats will be created automatically when users are created
      console.info('Social media starter kit initialized')
    },
  },
]
