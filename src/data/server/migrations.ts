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
      // we built a simple zero-based migration system. this is sort of
      // temporary - mostly because we found the pattern of writing a change to
      // some mutator.insert and then wanting to also apply that change to every
      // existing row since we already wrote it in zero, wanted to share them.
      // but ideally we'd integrate this with the existing migrate system, only
      // problem there is we ran our migrations in a lambda on SST which
      // couldn't run zero. plan going forward is to get off lambda for
      // migrations and instead just have the server run migrations on start
    },
  },
]
