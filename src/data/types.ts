import type {
  Block,
  Follows,
  Like,
  Post,
  Report,
  User,
  UserState,
  UserStats,
} from '~/data/models'

export type * from './models'

export type AuthData = {
  id: string
  email?: string
  role?: 'admin'
}

export type PostWithUser = Post & {
  user?: User
}

export type PostWithStats = Post & {
  likes?: readonly Like[]
  likeCount?: number
  isLiked?: boolean
}

export type PostWithRelations = Post & {
  user?: User
  likes?: readonly Like[]
  likeCount?: number
  isLiked?: boolean
}

export type UserWithStats = User & {
  stats?: UserStats
  state?: UserState
}

export type UserWithRelations = User & {
  stats?: UserStats
  state?: UserState
  posts?: readonly Post[]
  followers?: readonly Follows[]
  following?: readonly Follows[]
  blocking?: readonly Block[]
  blockedBy?: readonly Block[]
}

export type NotificationWithRelations = {
  id: string
  userId: string
  type: 'like' | 'follow' | 'mention' | 'report'
  actorId?: string
  actor?: User
  postId?: string
  post?: Post
  message?: string
  read: boolean
  createdAt: number
}

export type ReportWithRelations = Report & {
  reporter?: User
  reportedUser?: User
  reportedPost?: Post
  reviewer?: User
}

export type FollowWithUsers = Follows & {
  follower?: User
  following?: User
}

export type LikeWithUser = Like & {
  user?: User
  post?: Post
}
