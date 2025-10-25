// ⚠️
// when adding/removing a model:
// add to here and ./tables.ts!

// Core models
export type { Device } from '~/data/models/device'
export type { PrivateBetaInvite } from '~/data/models/privateBetaInvite'
export type { User } from '~/data/models/user'
export type { UserState } from '~/data/models/userState'
export type { UserStats } from '~/data/models/userStats'

// Social features
export type { Post } from '~/data/models/post'
export type { Like } from '~/data/models/like'
export type { Follows } from '~/data/models/follows'
export type { Block } from '~/data/models/block'
export type { Report } from '~/data/models/report'

// Import modules
import * as admin from '~/data/models/admin'
import * as device from '~/data/models/device'
import * as privateBetaInvite from '~/data/models/privateBetaInvite'
import * as userPublic from '~/data/models/user'
import * as userState from '~/data/models/userState'
import * as userStats from '~/data/models/userStats'
import * as post from '~/data/models/post'
import * as like from '~/data/models/like'
import * as follows from '~/data/models/follows'
import * as block from '~/data/models/block'
import * as report from '~/data/models/report'

export const models = {
  admin,
  device,
  privateBetaInvite,
  userPublic,
  userState,
  userStats,
  post,
  like,
  follows,
  block,
  report,
}
