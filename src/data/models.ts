// ⚠️
// when adding/removing a model:
// add to here and ./tables.ts!

export type { Block } from '~/data/models/block'
export type { Device } from '~/data/models/device'
export type { Like } from '~/data/models/like'
export type { Post } from '~/data/models/post'
export type { Report } from '~/data/models/report'
export type { User } from '~/data/models/user'
export type { UserState } from '~/data/models/userState'
export type { UserStats } from '~/data/models/userStats'

import * as block from '~/data/models/block'
import * as device from '~/data/models/device'
import * as like from '~/data/models/like'
import * as post from '~/data/models/post'
import * as report from '~/data/models/report'
import * as userPublic from '~/data/models/user'
import * as userState from '~/data/models/userState'
import * as userStats from '~/data/models/userStats'

export const models = {
  device,
  userPublic,
  userState,
  userStats,
  post,
  block,
  like,
  report,
}
