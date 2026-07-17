import type {
  Condition,
  ExpressionBuilder,
  Row,
  SchemaQuery,
  TableBuilderWithColumns,
  Schema as ZeroSchema,
  Transaction as ZeroTransaction,
} from '@rocicorp/zero'
import type { NullToOptional, TupleToUnion } from '@take-out/helpers'

/**
 * ➗0️⃣ START OVERRIDDEN TYPES
 *
 * To get types, put the following in a .ts file that's included by your tsconfig:
 *
 *   export type Schema = typeof schema
 *
 *   declare module 'on-zero' {
 *     interface Config {
 *       schema: Schema
 *       authData: AuthData
 *     }
 *   }
 *
 * on-zero is overridden by consumers of this library to get types which is
 * needed to allow co-locating certain typed helpers like where() and
 * mutations() alongside table() because table is later used to create the Zero
 * schema, which is then needed for where/mutations
 */

export interface Config {}

interface DefaultConfig {
  schema: ZeroSchema
  authData: {}
  serverActions: null
}

interface FinalConfig extends Omit<DefaultConfig, keyof Config>, Config {}

export type Schema = FinalConfig['schema']

export type TableName = keyof Schema['tables'] extends string
  ? keyof Schema['tables']
  : string

// eslint-disable-next-line typescript-eslint/no-unnecessary-type-arguments
export type Transaction = ZeroTransaction<Schema>

export type AuthData =
  FinalConfig['authData'] extends Record<string, unknown>
    ? FinalConfig['authData']
    : Record<string, unknown>

export type ServerActions =
  FinalConfig['serverActions'] extends Record<string, unknown>
    ? FinalConfig['serverActions']
    : Record<string, unknown>

export type QueryBuilder = SchemaQuery<Schema>

export type AsyncTask = () => Promise<void>

export type AsyncTaskOptions = {
  barrier?: boolean
}

export type AsyncTaskEntry = {
  task: AsyncTask
  barrier: boolean
}

/**
 * ➗0️⃣ END OVERRIDDEN TYPES
 */

// the first argument passed to every mutation:
export type MutatorContext = {
  tx: Transaction
  authData: AuthData | null
  environment: 'server' | 'client'
  server?: {
    actions: ServerActions
    /**
     * Schedules work after the mutation transaction commits. Tasks run in the
     * background by default, following Zero's async task model, so they do not
     * block the push response.
     *
     * Set `barrier: true` only when the client's next writes depend on the
     * effect, such as provisioning a namespace before the client writes
     * through a new instance. Barrier tasks finish before the push response.
     */
    enqueueTask(task: AsyncTask, opts?: AsyncTaskOptions): void
  }
  can: Can
}

// turns our mutators with custom context into zero mutators
export type GetZeroMutators<Models extends GenericModels> = {
  [Key in keyof Models]: TransformMutators<GetModelMutators<Models>[Key]>
}

type GetModelMutators<Models extends GenericModels> = {
  [Key in keyof Models]: Models[Key]['mutate']
}

export type GenericModels = {
  [key: string]: {
    mutate?: Record<string, (ctx: MutatorContext, obj?: any) => Promise<any>>
    // eslint-disable-next-line typescript-eslint/no-unnecessary-type-arguments
    permissions?: Where<any, Condition | boolean>
  }
}

export type TransformMutators<T> = {
  [K in keyof T]: T[K] extends (ctx: MutatorContext, ...args: infer Args) => infer Return
    ? (tx: Transaction, ...args: Args) => Return extends unknown ? Promise<any> : Return
    : never
}

export type Where<
  Table extends TableName = TableName,
  ReturnType extends Condition | boolean = Condition | boolean,
> = (
  expressionBuilder: ExpressionBuilder<Table, Schema>,
  auth?: AuthData | null,
) => ReturnType

export type Can = <PWhere extends Where>(
  where: PWhere,
  obj: string | Record<string, unknown>,
) => Promise<void>

type GenericTable = TableBuilderWithColumns<any>

type GetTableSchema<TS extends GenericTable> =
  TS extends TableBuilderWithColumns<infer S> ? S : never

// all non-optional keys required (but optional can be undefined)
export type TableInsertRow<TS extends GenericTable> = NullToOptional<
  Row<GetTableSchema<TS>>
>

// only primary keys required
export type TableUpdateRow<TS extends GenericTable> = Pick<
  Row<GetTableSchema<TS>>,
  TablePrimaryKeys<TS>
> &
  Partial<TableInsertRow<TS>>

export type TablePrimaryKeys<TS extends GenericTable> = TupleToUnion<
  GetTableSchema<TS>['primaryKey']
>

export type ZeroEvent =
  | { type: 'error'; message: string }
  // recovery lifecycle: 'recovering' = dropping local state + reloading;
  // 'fatal' = recovery already attempted (loop guard tripped), not reloading.
  | { type: 'recovering'; reason: string }
  | { type: 'fatal'; reason: string }

/**
 * Admin role bypass for permissions:
 * - 'all': admin bypasses both query and mutation permissions (default)
 * - 'queries': admin bypasses only query permissions
 * - 'mutations': admin bypasses only mutation permissions
 * - 'off': admin has no special bypass
 */
export type AdminRoleMode = 'all' | 'queries' | 'mutations' | 'off'
