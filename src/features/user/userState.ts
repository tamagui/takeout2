import { router } from 'one'
import { useEffect, useLayoutEffect } from 'react'
import type { ChannelState, ThreadState, UserSettings } from 'start/types'
import { debounce } from 'tamagui'
import { merge } from 'ts-deepmerge'
import { getLastChannelId, useCurrentChannelId } from '~/context/CurrentChannelContext'
import { getLastThreadId, useCurrentThreadId } from '~/context/CurrentThreadContext'
import { setDevGlobal } from '~/features/devtools/devGlobal'
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
 * This file sort of evolved so it's possible it could be simplified
 * We split user into a few parts:
 *
 *   - user = private, locked down, only accessible by backend, better-auth manages it
 *   - userPublic = public-facing (to the world) account info, created in user.completeSignup
 *   - userState = private to each user
 *
 * We could just use zero here honestly, but we used this originally to get granular re-rendering
 * and slightly easier updating (since it uses nested sub-objects)
 *
 */

type MutableUserState = Required<
  Omit<Mutable<UserStateType>, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
>

type GlobalUserState = {
  [Key in keyof MutableUserState]: Exclude<MutableUserState[Key], null>
}

export const userStateEmitter = createEmitter<GlobalUserState>(
  'userState',
  {
    settings: {
      themeMode: 'system',
      themeVariant: 'subtle',
      serverTintOverrides: {},
    },
    lastActiveChannel: {},
    serversSort: [],
    activeServer: '',
    apiKey: '',
    channelState: {},
    lastPathname: '',
    messageEdits: [{ content: '', id: '' }],
    threadState: {},
    topReactions: [],
  },
  {
    comparator: isEqualNever,
  }
)

setDevGlobal(userStateEmitter, 'userState')

// for now force a simple key selector as we almost never grab > 1
export const useUserState = <Key extends keyof GlobalUserState>(key: Key) => {
  return useEmitterSelector(userStateEmitter, (s) => s[key])
}

export const useUserStateSelector = useEmitterSelector.bind(null, userStateEmitter)

let userStateData: UserState | null = null

export const useUserStateManager = () => {
  const { user: curUser } = useUser()
  const [userStateRecord, status] = useQuery(
    zero.query.userState.where('userId', curUser?.id || '').one(),
    !!curUser?.id
  )

  // SYNC down
  useLayoutEffect(() => {
    userStateData = userStateRecord || null

    if (!userStateRecord) {
      return
    }

    const userState = userStateEmitter.value

    for (const key of objectKeys(userState)) {
      if (!isEqualDeepLite(userState[key], userStateRecord[key])) {
        // fallback to default value
        userState[key] = (userStateRecord[key] as any) ?? userState[key]
      }
    }

    userStateEmitter.emit(userState)
  }, [userStateRecord])

  useLayoutEffect(() => {
    setUser(curUser || null)
  }, [curUser])
}

export const updateUserSettings = async (next: Partial<UserSettings>) => {
  const settings = {
    ...userStateEmitter.value.settings,
    ...next,
  }
  await updateUserState({
    settings: JSON.parse(JSON.stringify(settings)),
  })
}

export const updateUserState = async (next: Partial<GlobalUserState>) => {
  if (!getUser()) {
    await ensureSignedUp()
    if (!getUser()) {
      console.warn(`No user?`)
    }
    return
  }

  const current = userStateData
  try {
    if (!current) {
      console.error(`No user state! Not loaded yet!`)
    } else {
      let hasChanged = false
      for (const key in next) {
        if (
          next[key as keyof GlobalUserState] !== current[key as keyof GlobalUserState]
        ) {
          hasChanged = true
        }
      }

      if (hasChanged) {
        const userState = {
          id: current.id,
          updatedAt: Date.now(),
          ...next,
        }
        console.groupCollapsed(`[userState] update`, userState)
        console.trace()
        console.groupEnd()
        await zero.mutate.userState.update(userState).client
      }
    }
  } catch (err) {
    console.error(`error updating user state`, err)
  }
}

// helpers

// thread state

export const getCurrentThreadState = () => {
  return userStateEmitter.value?.threadState?.[getLastThreadId() || '']
}

export const useUserCurrentThreadState = <Selected>(
  selector: (state: ThreadState) => Selected,
  args: any[] = []
): Selected => {
  const threadId = useCurrentThreadId()
  return useUserStateSelector(
    (state) => selector(state.threadState?.[threadId] || {}),
    {},
    [threadId, ...args]
  ) as any
}

export const updateUserCurrentThread = async (
  next: Partial<ThreadState> | ((prev: Partial<ThreadState>) => Partial<ThreadState>),
  shouldMerge = false
) => {
  if (!getUser()) {
    ensureSignedUp()
    console.error(`No user`)
    return
  }

  const threadId = getLastThreadId()

  if (!threadId) {
    console.error(`No thread to update`, next)
    return
  }

  const prev = userStateEmitter.value?.threadState?.[threadId] || {}

  let final = typeof next === 'function' ? next(prev) : next

  if (shouldMerge) {
    final = merge(prev, final)
  }

  return await updateUserState({
    threadState: {
      ...userStateEmitter.value.threadState,
      [threadId]: final,
    },
  })
}

// channel state

export const useUserCurrentChannelState = <Selected>(
  selector: (state: ChannelState) => Selected,
  args: any[] = []
): Selected => {
  const channelId = useCurrentChannelId()
  return useUserStateSelector(
    (state) => selector(state?.channelState?.[channelId] || {}),
    {},
    [channelId, ...args]
  ) as any
}

export const getCurrentChannelState = () => {
  return userStateEmitter.value.channelState?.[getLastChannelId() || '']
}

export const updateUserCurrentChannel = async (
  next: Partial<ChannelState> | ((prev: Partial<ChannelState>) => Partial<ChannelState>),
  shouldMerge = false
) => {
  if (!getUser()) {
    ensureSignedUp()
    console.error(`No user`)
    return
  }
  const channelId = getLastChannelId()
  if (!channelId) {
    console.error(`No channel to update`, next)
    return
  }

  const prev = userStateEmitter.value.channelState?.[channelId] || {}

  let final = typeof next === 'function' ? next(prev) : next

  if (shouldMerge) {
    final = merge(prev, final)
  }

  return await updateUserState({
    channelState: {
      ...userStateEmitter.value.channelState,
      [channelId]: final,
    },
  })
}

export const updateUserCurrentChannelToggleMessageSelected = (messageId: string) => {
  return updateUserCurrentChannel((prev) => {
    const last = prev.selectedMessages?.[messageId]

    if (last) {
      const selectedMessages = { ...prev.selectedMessages }
      delete selectedMessages[messageId]
      return {
        selectedMessages,
      }
    }

    return {
      selectedMessages: {
        ...prev.selectedMessages,
        [messageId]: true,
      },
    }
  })
}

export const closeCurrentThread = () => {
  router.setParams({
    thread: '',
  })
}
