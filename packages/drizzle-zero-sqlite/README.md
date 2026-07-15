# @take-out/drizzle-zero-sqlite

Generate a Zero schema from a Drizzle SQLite schema while keeping Drizzle as the single schema source.

```ts
import { drizzleZeroConfig } from '@take-out/drizzle-zero-sqlite'
import { generateDrizzleSchemaFile } from 'on-zero/drizzle'

const zeroSchema = drizzleZeroConfig(
  { ...schema, relations },
  {
    tables: {
      user: true,
      message: true,
    },
  },
)

const source = generateDrizzleSchemaFile(zeroSchema)
```

The translator accepts Drizzle `sqliteTable` definitions and beta `defineRelations` exports, including `through(...)` relations. It rejects PostgreSQL tables so a project cannot silently generate the wrong dialect.
