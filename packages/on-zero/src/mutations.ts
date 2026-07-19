import { IS_SERVER_RUNTIME } from '@take-out/helpers'
import { setMutationsPermissions } from './modelRegistry'

import type { TableBuilderWithColumns } from '@rocicorp/zero'
import type {
  MutatorContext,
  Schema,
  TableInsertRow,
  TableName,
  TableUpdateRow,
  Where,
} from './types'

// derive a TableBuilderWithColumns from the global schema by table name
type SchemaTableBuilder<TName extends TableName> = TableBuilderWithColumns<
  Schema['tables'][TName]
>

// HMR registry - stores mutation implementations and proxies by table name
// allows hot-swapping implementations without changing object references
// stored on globalThis to persist across HMR module reloads
function mutationRegistry(): Map<string, Record<string, Function>> {
  const global = globalThis as typeof globalThis & {
    __onZeroMutationRegistry__?: Map<string, Record<string, Function>>
  }
  return (global.__onZeroMutationRegistry__ ||= new Map())
}

function proxyRegistry(): Map<string, any> {
  const global = globalThis as typeof globalThis & {
    __onZeroProxyRegistry__?: Map<string, any>
  }
  return (global.__onZeroProxyRegistry__ ||= new Map())
}

// get or create a proxy that delegates to the registry
// returns the SAME proxy object on subsequent calls so HMR works
function getOrCreateMutationProxy<T extends Record<string, Function>>(
  tableName: string,
  implementations: T,
): T {
  // always update implementations (supports HMR)
  mutationRegistry().set(tableName, implementations)

  // return existing proxy if we have one (HMR case)
  const existing = proxyRegistry().get(tableName)
  if (existing) {
    return existing as T
  }

  // first time - create the proxy
  const proxy = new Proxy({} as T, {
    get(_, key: string) {
      return mutationRegistry().get(tableName)?.[key]
    },
    ownKeys() {
      const current = mutationRegistry().get(tableName)
      return current ? Object.keys(current) : []
    },
    getOwnPropertyDescriptor(_, key: string) {
      const current = mutationRegistry().get(tableName)
      if (current && key in current) {
        return { enumerable: true, configurable: true, value: current[key] }
      }
    },
    has(_, key: string) {
      const current = mutationRegistry().get(tableName)
      return current ? key in current : false
    },
  })

  proxyRegistry().set(tableName, proxy)
  return proxy
}

type MutationBuilder<Obj = any> = (ctx: MutatorContext, obj?: Obj) => Promise<void>
type MutationBuilders = Record<string, MutationBuilder>

// start of adding custom can.write(message) style

// type PermissionedMutationBuilder<Permissions extends PermissionsWhere, Obj = any> = (
//   ctx: MutatorContext & {
//     can: any
//   },
//   obj?: Obj
// ) => Promise<void>
// type PermissionedMutationBuilders<Permissions extends PermissionsWhere> = Record<
//   string,
//   PermissionedMutationBuilder<Permissions>
// >

type GenericTable = TableBuilderWithColumns<any>

type CRUDMutations<Table extends GenericTable> = {
  insert: MutationBuilder<TableInsertRow<Table>>
  upsert: MutationBuilder<TableInsertRow<Table>>
  update: MutationBuilder<TableUpdateRow<Table>>
  delete: MutationBuilder<TableUpdateRow<Table>>
}

type CRUDNames = 'insert' | 'upsert' | 'update' | 'delete'

type MutationsWithCRUD<Table extends GenericTable, Mutations extends MutationBuilders> = {
  [Key in CRUDNames | keyof Mutations]: Key extends keyof Mutations
    ? Mutations[Key]
    : Key extends keyof CRUDMutations<any>
      ? CRUDMutations<Table>[Key]
      : never
}

export function mutations<Mutations extends MutationBuilders>(
  mutations: Mutations,
): Mutations
export function mutations<Table extends GenericTable, Permissions extends Where>(
  table: Table,
  permissions: Permissions,
): MutationsWithCRUD<Table, {}>
export function mutations<
  Table extends GenericTable,
  Permissions extends Where,
  Mutations extends MutationBuilders,
>(
  table: Table,
  permissions: Permissions,
  mutations: Mutations,
): MutationsWithCRUD<Table, Mutations>
// string-based overloads (for drizzle-zero derived schemas where table builders aren't available)
export function mutations<TName extends TableName, Permissions extends Where>(
  tableName: TName,
  permissions: Permissions,
): MutationsWithCRUD<SchemaTableBuilder<TName>, {}>
export function mutations<
  TName extends TableName,
  Permissions extends Where,
  Mutations extends MutationBuilders,
>(
  tableName: TName,
  permissions: Permissions,
  mutations: Mutations,
): MutationsWithCRUD<SchemaTableBuilder<TName>, Mutations>
export function mutations<
  Table extends GenericTable,
  Mutations extends Record<string, MutationBuilder>,
>(
  table: Table | string | Mutations,
  permissions?: Where,
  mutations?: Mutations,
): Mutations {
  if (permissions) {
    const tableName =
      typeof table === 'string'
        ? (table as TableName)
        : ((table as Table).schema.name as TableName)

    const createCRUDMutation = (action: CRUDNames) => {
      const customMutation = mutations?.[action]
      if (customMutation) return customMutation

      return async (ctx: MutatorContext, obj: any) => {
        /**
         * CRUD mutations have permissions handled automatically using `can`:
         *   - `can` throws an error if it fails
         *     - zero catches error and rolls back transaction
         *     - zero returns error to client when you await zero.mutate.x.z().server
         *   - for INSERT: check runs after insert completes
         *   - for the rest: check runs before mutation
         */
        const runServerPermissionCheck = async () => {
          // only validate on the server
          if (IS_SERVER_RUNTIME) {
            await ctx.can(permissions, obj)
          }
        }

        if (action !== 'insert' && action !== 'upsert') {
          await runServerPermissionCheck()
        }

        type TableName = keyof typeof ctx.tx.mutate // weird type foo because we declare this module and then type check
        await ctx.tx.mutate[tableName as TableName]![action](obj)

        if (action === 'insert' || action === 'upsert') {
          await runServerPermissionCheck()
        }
      }
    }

    const crudMutations: CRUDMutations<any> = {
      insert: createCRUDMutation('insert'),
      update: createCRUDMutation('update'),
      delete: createCRUDMutation('delete'),
      upsert: createCRUDMutation('upsert'),
    }

    const finalMutations = {
      ...mutations,
      // generated CRUD fills missing operations; custom CRUD runs as-is
      ...crudMutations,
    } as any as Mutations

    setMutationsPermissions(tableName, permissions)

    // return proxy for HMR support - allows swapping implementations at runtime
    return getOrCreateMutationProxy(tableName, finalMutations)
  }

  // no schema/permissions don't add CRUD
  return table as any
}
