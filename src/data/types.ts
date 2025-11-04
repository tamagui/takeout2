import type { Block, Post, Report, User, UserState } from './generated/types'

export type * from './generated/types'

export type PostWithUser = Post & {
  user?: User
}

export type PostWithRelations = Post & {
  user?: User
}

export type UserWithProfile = User & {
  state?: UserState
}

export type UserWithRelations = User & {
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
