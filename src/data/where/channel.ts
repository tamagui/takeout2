import { where } from 'over-zero'
import {
  hasServerAdminPermission,
  hasServerNotPrivate,
  hasServerReadPermission,
} from './server'
import type { RelatedToServerAndChannel } from './types'

const hasChannelNotPrivate = where<RelatedToServerAndChannel>((_) =>
  _.exists('channel', (q) => q.where('private', false))
)

export const hasChannelRole = where<RelatedToServerAndChannel>((_, auth) =>
  _.exists('channel', (q) =>
    q.whereExists('role', (q) =>
      q.whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )
)

export const hasChannelReadPermission = where<RelatedToServerAndChannel>((_, auth) => {
  const isServerNotPrivate = hasServerNotPrivate(_, auth)
  const isServerMember = hasServerReadPermission(_, auth)
  const isChannelNotPrivate = hasChannelNotPrivate(_, auth)
  const isUserRoleOnChannel = hasChannelRole(_, auth)
  const isServerAdmin = hasServerAdminPermission(_, auth)

  return _.or(
    isServerNotPrivate,
    _.and(isServerMember, _.or(isChannelNotPrivate, isUserRoleOnChannel, isServerAdmin))
  )
})

export const hasChannelEditRole = where<RelatedToServerAndChannel>((_, auth) =>
  _.exists('channel', (q) =>
    q.whereExists('role', (q) =>
      q
        .where('canEditChannel', true)
        .whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )
)

export const hasChannelWritePermission = where<RelatedToServerAndChannel>((_, auth) => {
  const isChannelEditor = hasChannelEditRole(_, auth)
  const isServerAdmin = hasServerAdminPermission(_, auth)

  return _.or(isChannelEditor, isServerAdmin)
})
