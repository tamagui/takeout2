import { router, Slot, usePathname } from 'one'
import { memo, useLayoutEffect, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { isWeb, XStack } from 'tamagui'
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
import { AppSidePanel } from '~/features/apps/ui/AppSidePanel'
import { useChannelParams } from '~/features/apps/useChannelParams'
import { Autocomplete } from '~/features/autocomplete/Autocomplete'
import { CurrentChannelIdProvider } from '~/features/channel/currentChannelIdEmitter'
import { EditorEmittersProvider } from '~/features/editor/slate/editorEmitters'
import { Gallery } from '~/features/gallery/Gallery'
import { ProvideMessagesEmitters } from '~/features/message/emitters'
import { MessageMenuProvider } from '~/features/message/ui/MessageMenu'
import { GlobalNotificationsEffects } from '~/features/notification/GlobalNotificationsEffects'
import { PresenceProvider } from '~/features/presence/PresenceProvider'
import { GlobalReactionPopover } from '~/features/reaction/GlobalReactionPopover'
import { useServerParams } from '~/features/server/useServerParams'
import { GlobalShortcuts } from '~/features/shortcuts/GlobalShortcuts'
import { useHandleEscapeIf } from '~/features/shortcuts/handleKeyboardEscape'
import { GlobalShortcutsProvider } from '~/features/shortcuts/shortcuts'
import { MainOpenThread } from '~/features/thread/ui/MainOpenThread'
import { TopBarSlidingPopover } from '~/features/topbar/TopBarSlidingPopover'
import { OnboardEffects } from '~/features/user/OnboardEffects'
import { UserEffects } from '~/features/user/UserEffects'
import { GlobalUserPopover } from '~/features/user/ui/GlobalUserPopover'
import { useUserStateManager } from '~/features/user/userState'
import { FullScreenProgressBar } from '~/interface/app/FullScreenProgressBar'
import { useTooltipCloser } from '~/interface/app/useTooltipCloser'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { GuidedCursor } from '~/interface/effects/guidedNavigation'
import { MainLayout } from '~/interface/main/MainLayout'
import { NotificationToastProvider } from '~/interface/notification/NotificationToast'
import { Sidebar } from '~/interface/sidebar/Sidebar'
import { GlobalTooltipProvider } from '~/interface/tooltip/TooltipSimple'
import { useInstanceState } from '~/state/instanceState'
import { isTauri } from '@vxrn/helpers'
import { AppProvider } from '~/features/apps/ui/AppProvider'

export function Layout() {
  const params = useServerParams({ active: true })
  const { channelId, serverId, serverPage, userServerId, privateChatId } =
    useChannelParams()

  // root level escape should register early so be weakest
  // this one should be a single handler for basically anything relevant at this level
  useHandleEscapeIf(Boolean(params.message || params.thread), () => {
    if (params.thread) {
      router.setParams({ thread: '' })
    } else {
      router.setParams({ message: '' })
    }
  })

  // testing tooltips
  // return (
  //   <GlobalTooltipProvider>
  //     <TooltipSimple label="testing">
  //       <Square size={100} bg="red" />
  //     </TooltipSimple>

  //     <TooltipSimple label="testing">
  //       <Square size={100} bg="blue" />
  //     </TooltipSimple>
  //   </GlobalTooltipProvider>
  // )

  return (
    <AppProvider>
      <GlobalShortcutsProvider>
        <GlobalShortcuts />
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
                              <EditorEmittersProvider>
                                <PresenceProvider>
                                  <NotificationToastProvider>
                                    <MessageMenuProvider>
                                      <GlobalUserPopover>
                                        <GlobalTooltipProvider>
                                          <GlobalReactionPopover>
                                            {/* global interface */}
                                            <Dialogs />
                                            <Gallery />
                                            <GuidedCursor />
                                            <Autocomplete />

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
                                              <FloatingSidebarContent>
                                                <FullScreenProgressBar />

                                                <TopBarSlidingPopover disableFocus>
                                                  <TopBarSlidingPopover.Targets
                                                    flex={10}
                                                    items="center"
                                                    data-tauri-drag-region
                                                    gap="$1"
                                                  >
                                                    {/* sidebar keeps the serverId/channelId of the last one in private chat */}
                                                    <Sidebar />

                                                    {/* but the rest gets the "private chat" serverId/channelId if it exists: */}
                                                    <ProvideCurrentServerId
                                                      value={
                                                        userServerId ||
                                                        privateChatId ||
                                                        serverId
                                                      }
                                                    >
                                                      <ProvideCurrentChannelId
                                                        value={
                                                          userServerId ||
                                                          privateChatId ||
                                                          channelId
                                                        }
                                                      >
                                                        <MainLayout>
                                                          <Slot />
                                                        </MainLayout>
                                                        <MainOpenThread />
                                                        <AppSidePanel />
                                                      </ProvideCurrentChannelId>
                                                    </ProvideCurrentServerId>
                                                  </TopBarSlidingPopover.Targets>
                                                </TopBarSlidingPopover>
                                              </FloatingSidebarContent>
                                            </AppLayout>
                                          </GlobalReactionPopover>
                                        </GlobalTooltipProvider>
                                      </GlobalUserPopover>
                                    </MessageMenuProvider>
                                  </NotificationToastProvider>
                                </PresenceProvider>
                              </EditorEmittersProvider>
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
      </GlobalShortcutsProvider>
    </AppProvider>
  )
}

const FloatingSidebarContent = ({ children }: { children: ReactNode }) => {
  const showSidebar = useInstanceState((s) => s.showSidebar)
  const { width } = useWindowDimensions()

  return (
    <XStack
      data-tauri-drag-region
      animation="medium"
      position="relative"
      items="stretch"
      contain="strict"
      flex={1}
      x={0}
      width="100%"
      $pointerTouch={{
        width: '200vw',
        position: 'absolute',
        t: 0,
        l: 0,
        b: 0,
        x: showSidebar ? 0 : -width,
      }}
    >
      {children}
    </XStack>
  )
}

const GlobalEffects = memo(() => {
  useTooltipCloser()
  return (
    <>
      <TauriBackgroundColorEffect />
      <UserStateManager />
      <TamaguiPerformanceOnWindowResize />
    </>
  )
})

// avoid tamagui onLayout during resizing window
const TamaguiPerformanceOnWindowResize = () => {
  // were using async which is fast on this now
  // useAsyncEffect((signal) => {
  //   const resizeEnd = debounce(() => {
  //     setOnLayoutStrategy('off')
  //   }, 250)

  //   if (typeof window === 'undefined') return
  //   window.addEventListener(
  //     'resize',
  //     () => {
  //       setOnLayoutStrategy('async')
  //       resizeEnd()
  //     },
  //     { signal }
  //   )
  // }, [])

  return null
}

const TauriBackgroundColorEffect = () => {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (!isWeb) return
    if (!isTauri) {
      document.documentElement.classList.add('not_tauri')
      return
    }
    if (pathname === '/sub-window') {
      document.documentElement.classList.add('no_bg')
    }
  }, [pathname])

  return null
}

const UserStateManager = () => {
  useUserStateManager()
  return null
}
