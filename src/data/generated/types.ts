import type * as schema from './tables'
import type { TableInsertRow, TableUpdateRow } from 'on-zero'

export type Block = TableInsertRow<typeof schema.block>
export type BlockUpdate = TableUpdateRow<typeof schema.block>

export type Comment = TableInsertRow<typeof schema.comment>
export type CommentUpdate = TableUpdateRow<typeof schema.comment>

export type Device = TableInsertRow<typeof schema.device>
export type DeviceUpdate = TableUpdateRow<typeof schema.device>

export type Notification = TableInsertRow<typeof schema.notification>
export type NotificationUpdate = TableUpdateRow<typeof schema.notification>

export type Post = TableInsertRow<typeof schema.post>
export type PostUpdate = TableUpdateRow<typeof schema.post>

export type Report = TableInsertRow<typeof schema.report>
export type ReportUpdate = TableUpdateRow<typeof schema.report>

export type User = TableInsertRow<typeof schema.userPublic>
export type UserUpdate = TableUpdateRow<typeof schema.userPublic>

export type UserState = TableInsertRow<typeof schema.userState>
export type UserStateUpdate = TableUpdateRow<typeof schema.userState>
