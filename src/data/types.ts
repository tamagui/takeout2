import type {
  Block,
  Post,
  Report,
  User,
  UserState,
  UserStats,
} from '~/data/models'

export type * from './models'

export type PostWithUser = Post & {
  user?: User
}

export type PostWithRelations = Post & {
  user?: User
}

export type UserWithStats = User & {
  stats?: UserStats
  state?: UserState
}

export type UserWithRelations = User & {
  stats?: UserStats
  state?: UserState
  posts?: readonly Post[]
  blocking?: readonly Block[]
  blockedBy?: readonly Block[]
}

export type ReportWithRelations = Report & {
  reporter?: User
  reportedUser?: User
  reportedPost?: Post
  reviewer?: User
}
