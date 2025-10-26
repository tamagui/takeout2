import { router } from 'one'
import { useEffect, useLayoutEffect } from 'react'
import type { UserSettings } from 'start/types'
import { debounce } from 'tamagui'
import { merge } from 'ts-deepmerge'
import { createEmitter, useEmitterSelector } from '@vxrn/helpers'
import { isEqualDeepLite } from '@vxrn/helpers'
import { isEqualNever } from '@vxrn/helpers'
import { time } from '@vxrn/helpers'
import { objectKeys, type Mutable } from '@vxrn/helpers'
import { ensureSignedUp } from '~/interface/dialogs/isSignedUpEmitter'
import { useQuery, zero } from '~/zero/client'
import type { UserState, UserState as UserStateType } from '~/data/types'
import { getUser, setUser } from './getUser'
import { useUser } from './useUser'

/**
 * This file manages user state for the social media app
 *
 * We split user into a few parts:
 *   - user = private, locked down, only accessible by backend, better-auth manages it
 *   - userPublic = public-facing (to the world) account info
 *   - userState = private to each user (settings, preferences)
 */

type MutableUserState = Required<
  Omit<Mutable<UserStateType>, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
>

type GlobalUserState = {
  [Key in keyof MutableUserState]: Exclude<MutableUserState[Key], null>
}

const userStateEmitter = createEmitter<GlobalUserState | null>(null)

export const useUserState = () => {
  return userStateEmitter.useValue()
}

export const useUserStateSelector = <Selected = unknown>(
  selector: (state: GlobalUserState) => Selected,
  defaultValue: Selected,
  keys?: any[]
): Selected => {
  return useEmitterSelector(
    userStateEmitter,
    (state) => {
      if (!state) {
        return defaultValue
      }
      return selector(state) ?? defaultValue
    },
    defaultValue,
    keys,
    isEqualDeepLite
  )
}

export const getUserState = () => {
  return userStateEmitter.value
}

export function SyncUserState() {
  const user = useUser()
  const userId = user?.id

  const [userState] = useQuery(zero.query.userState.where('id', userId || '').one())

  useLayoutEffect(() => {
    if (!userState) {
      userStateEmitter.value = null
      return
    }

    const prev = userStateEmitter.value

    const toHydrate = objectKeys(userState).reduce((acc, key) => {
      const val = userState[key]
      if (val == null) {
        return acc
      }
      acc[key] = val
      return acc
    }, {} as any)

    if (!prev || !isEqualDeepLite(toHydrate, prev)) {
      userStateEmitter.value = toHydrate
    }
  }, [userState])

  return null
}

const updateUserStateDebounced = debounce(async (updates: Partial<UserState>) => {
  const currentUser = getUser()
  if (!currentUser?.id) {
    console.error('No user found for state update')
    return
  }

  const userState = await zero.query.userState.where('id', currentUser.id).one()
  const id = userState?.id || `${currentUser.id}-state`

  try {
    await zero.mutate.userState.upsert({
      id,
      userId: currentUser.id,
      ...updates,
      updatedAt: Date.now(),
    })
  } catch (err) {
    console.error('Error updating user state:', err)
  }
}, 100)

export async function updateUserState(
  updates: Partial<UserState> | ((prev: UserState | null) => Partial<UserState>),
  debounceMs?: number
) {
  try {
    const user = getUser()
    if (!user?.id) {
      console.error('No user')
      return
    }

    const prev = getUserState()
    const next = typeof updates === 'function' ? updates(prev) : updates

    // optimistically update
    userStateEmitter.value = {
      ...prev,
      ...next,
    } as any

    if (debounceMs && debounceMs > 0) {
      updateUserStateDebounced.debounce(debounceMs)
    } else {
      updateUserStateDebounced.cancel()
    }

    await updateUserStateDebounced(next)
  } catch (err) {
    console.error(`error updating user state`, err)
  }
}

// User settings helpers
export const getUserSettings = (): UserSettings | null => {
  return getUserState()?.settings || null
}

export const useUserSettings = (): UserSettings | null => {
  return useUserStateSelector((state) => state.settings, null, ['settings'])
}

export const updateUserSettings = async (
  updates: Partial<UserSettings> | ((prev: UserSettings | null) => Partial<UserSettings>)
) => {
  const prev = getUserSettings()
  const next = typeof updates === 'function' ? updates(prev) : updates
  const merged = merge(prev || {}, next)

  await updateUserState({
    settings: merged as UserSettings,
  })
}
