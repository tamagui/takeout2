import { getDidRunPermissionCheck } from './helpers/didRunPermissionCheck'
import { setMutationsPermissions } from './modelRegistry'

import type {
  MutatorContext,
  TableInsertRow,
  TableName,
  TableUpdateRow,
  Where,
} from './types'
import type { TableBuilderWithColumns } from '@rocicorp/zero'

// two ways to use it:
//  - mutations({}) which doesn't add the "allowed" helper or add CRUD
//  - mutation('tableName', permissions) adds CRUD with permissions, adds allowed

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
  mutations: Mutations
): Mutations
export function mutations<Table extends GenericTable, Permissions extends Where>(
  table: Table,
  permissions: Permissions
): MutationsWithCRUD<Table, {}>
export function mutations<
  Table extends GenericTable,
  Permissions extends Where,
  Mutations extends MutationBuilders,
>(
  table: Table,
  permissions: Permissions,
  mutations: Mutations
): MutationsWithCRUD<Table, Mutations>
// TODO we should enforece the CRUD mutations obj to the callier so they get it auto-typed
export function mutations<
  Table extends GenericTable,
  Mutations extends Record<string, MutationBuilder>,
>(table: Table | Mutations, permissions?: Where, mutations?: Mutations): Mutations {
  if (permissions) {
    const tableName = (table as Table).schema.name as TableName

    const createCRUDMutation = (action: CRUDNames) => {
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
          if (getDidRunPermissionCheck(ctx)) {
            // if the user-defined CRUD mutation runs their own "can", we avoid running ours
            return
          }

          // only validate on the server
          if (process.env.VITE_ENVIRONMENT === 'ssr') {
            await ctx.can(permissions, obj)
          }
        }

        if (action !== 'insert') {
          await runServerPermissionCheck()
        }

        // if user defines insert run theirs, if not run plain zero:
        const existing = mutations?.[action]

        if (existing) {
          await existing(ctx, obj)
        } else {
          type TableName = keyof typeof ctx.tx.mutate // weird type foo because we declare this module and then type check
          await ctx.tx.mutate[tableName as TableName]![action](obj)
        }

        if (action === 'insert') {
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

    const finalMutations = Object.freeze({
      ...mutations,
      // overwrite regular mutations but call them if they are defined by user
      ...crudMutations,
      // expose permissions for usePermission hook
    }) as any as Mutations

    setMutationsPermissions(tableName, permissions)

    return finalMutations
  }

  // no schema/permissions don't add CRUD
  return table as any
}
