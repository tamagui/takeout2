import { where } from 'over-zero'
import type { RelatedToServer } from './types'

export const hasServerAdminPermission = where<RelatedToServer>((_, auth) =>
  _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q.where((_) =>
        _.and(
          _.cmp('canAdmin', true),
          _.exists('member', (q) => q.where('id', auth?.id || ''))
        )
      )
    )
  )
)

export const hasServerEditPermission = where<RelatedToServer>((_, auth) =>
  _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q.where((_) =>
        _.and(
          _.cmp('canEditServer', true),
          _.exists('member', (q) => q.where('id', auth?.id || ''))
        )
      )
    )
  )
)

export const hasServerReadPermission = where<RelatedToServer>((_, auth) =>
  _.exists('server', (q) =>
    q.where((_) =>
      _.or(
        _.cmp('private', false),
        _.exists('member', (q) => q.where('id', auth?.id || ''))
      )
    )
  )
)

export const hasServerNotPrivate = where<RelatedToServer>((_) =>
  _.exists('server', (q) => q.where('private', false))
)
