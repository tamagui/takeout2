import * as Linking from 'expo-linking'
import { useRouter } from 'one'
import { memo, useCallback, useEffect, useState } from 'react'
import { XStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { useAppInitContext } from '~/context/AppInitContext'
import { ProvideCurrentAppId } from '~/context/CurrentAppContext'
import { ProvideCurrentAppInstallId } from '~/context/CurrentAppInstallContext'
import { ProvideCurrentChannelId } from '~/context/CurrentChannelContext'
import { ProvideCurrentHudThreadId } from '~/context/CurrentHudThreadContext'
import { ProvideCurrentPrivateChatId } from '~/context/CurrentPrivateChatContext'
import { ProvideCurrentServerId } from '~/context/CurrentServerContext'
import { ProvideCurrentServerPage } from '~/context/CurrentServerPageContext'
import { ProvideCurrentThreadId } from '~/context/CurrentThreadContext'
import { CurrentUserServerIdProvider } from '~/context/CurrentUserServerContext'
import { AppLayout } from '~/features/app/AppLayout'
import { ProvideAppTheme } from '~/features/app/AppTheme'
import { AppEffects } from '~/features/apps/AppEffects'
import { useChannelParams } from '~/features/apps/useChannelParams'
import { CurrentChannelIdProvider } from '~/features/channel/currentChannelIdEmitter'
import { ProvideMessagesEmitters } from '~/features/message/emitters'
import { GlobalNotificationsEffects } from '~/features/notification/GlobalNotificationsEffects'
import { EmojiPickerProvider } from '~/features/reaction/ui/EmojiPickerContext.native'
import { useServerParams } from '~/features/server/useServerParams'
import { OnboardEffects } from '~/features/user/OnboardEffects'
import { UserEffects } from '~/features/user/UserEffects'
import { useUserStateManager } from '~/features/user/userState'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { Stack } from '~/interface/layouts/stack'
import { NotificationToastProvider } from '~/interface/notification/NotificationToast'

export default function Layout() {
  const { setNavigationReady } = useAppInitContext()
  const router = useRouter()
  const { state } = useAuth()
  const params = useServerParams({ active: true })
  const { channelId, serverId, serverPage, userServerId, privateChatId } =
    useChannelParams()

  const handleDeepLink = useCallback(
    async (url: string) => {
      console.info('Processing deep link in chat layout:', url)
      const { path } = Linking.parse(url)

      // Handle navigation deep links (only if logged in)
      if (state === 'logged-in') {
        // Handle server/channel deep links
        const serverMatch = path?.match(/^server\/([^/]+)(?:\/channel\/([^/]+))?/)
        if (serverMatch) {
          const [, deepLinkServerId, deepLinkChannelId] = serverMatch
          if (deepLinkChannelId) {
            router.replace(`/(chat)/${deepLinkServerId}/${deepLinkChannelId}`)
          } else {
            router.replace(`/(chat)/${deepLinkServerId}`)
          }
        }
      }
    },
    [state, router]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need>
  useEffect(() => {
    if (state === 'logged-out') {
      // TODO: using setTimeout here to avoid `Transform with key translateY must have units unless the provided value is 0, found translateY(100)` error
      setTimeout(() => {
        router.replace('/auth')
        setNavigationReady(true)
      }, 50)
    }
  }, [state])

  // Deep link handler
  useEffect(() => {
    console.info('Setting up deep link handler in chat layout')
    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.info('Initial deep link detected:', url)
        handleDeepLink(url)
      }
    })

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      console.info('Deep link received:', event.url)
      handleDeepLink(event.url)
    })

    return () => subscription.remove()
  }, [handleDeepLink])

  return (
    <ProvideCurrentServerId value={serverId}>
      <ProvideCurrentPrivateChatId value={params.privateChatId || ''}>
        <ProvideCurrentChannelId value={channelId}>
          <CurrentChannelIdProvider value={channelId}>
            <CurrentUserServerIdProvider value={userServerId || ''}>
              <ProvideCurrentServerPage value={serverPage}>
                <ProvideCurrentThreadId value={params.thread || ''}>
                  <ProvideCurrentHudThreadId value={params.hudThread || ''}>
                    <ProvideCurrentAppInstallId value={params.appInstallId || ''}>
                      <ProvideCurrentAppId value={params.appId || ''}>
                        {/* we provide this here once so all messages rendered outside lists (pinned, search, etc) that don't need it still have the context */}
                        <ProvideMessagesEmitters>
                          {/* Emoji picker provider for reactions across all chat screens */}
                          <EmojiPickerProvider>
                            <NotificationToastProvider>
                              {/* global interface */}
                              <Dialogs />
                              {/* Emoji picker sheet UI - rendered once for all screens */}
                              {/* <EmojiPickerSheet /> */}
                              {/* Todo Gallery */}
                              {/* TODO: add gallery back in */}
                              {/* <Gallery /> */}
                              {/* <Autocomplete /> */}

                              {/* effects */}
                              <GlobalEffects />
                              <OnboardEffects />
                              <AppEffects />
                              <UserEffects />

                              {/* global listeners */}
                              <GlobalNotificationsEffects />
                              <ProvideAppTheme />

                              {/* content */}
                              <AppLayout>
                                <XStack flex={1} items="stretch" contain="strict">
                                  <Stack
                                    screenOptions={{
                                      headerShown: false,
                                    }}
                                  >
                                    <Stack.Screen name="index" />
                                    <Stack.Screen name="[serverId]" />
                                  </Stack>
                                </XStack>
                              </AppLayout>
                            </NotificationToastProvider>
                          </EmojiPickerProvider>
                        </ProvideMessagesEmitters>
                      </ProvideCurrentAppId>
                    </ProvideCurrentAppInstallId>
                  </ProvideCurrentHudThreadId>
                </ProvideCurrentThreadId>
              </ProvideCurrentServerPage>
            </CurrentUserServerIdProvider>
          </CurrentChannelIdProvider>
        </ProvideCurrentChannelId>
      </ProvideCurrentPrivateChatId>
    </ProvideCurrentServerId>
  )
}

const GlobalEffects = memo(() => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.info(`💬 chat loaded`)
    }
  }, [])

  return (
    <>
      <UserStateManager />
    </>
  )
})

const UserStateManager = () => {
  useUserStateManager()
  return null
}
