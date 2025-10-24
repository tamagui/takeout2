import type { ReactNode } from 'react'
import { YStack } from 'tamagui'
import { useAppTheme } from '~/features/app/AppTheme'
import { AppEditor } from '~/features/apps/ui/AppEditor'
import { AppsFloatingRow } from '~/features/apps/ui/AppsFloatingRow'
import { ChannelMainMessageInput } from '~/features/channel/ui/ChannelMainMessageInput'
import { useMainInputHeight } from '~/features/channel/ui/mainInputHeightEmitter'
import { HudMain } from '~/features/hud/HudMain'
import { useHudMainFrameHideProps } from '~/features/hud/useHudMainFrameHideProps'
import { TopBar } from '~/features/topbar/TopBar'
import { MainLayoutTopFadeEffect } from '~/interface/app/MainLayoutTopFadeEffect'
import {
  MAIN_CONTENT_RADIUS_LEFT,
  MAIN_CONTENT_RADIUS_PROPS,
  MAIN_PAD_PANE,
  MESSAGE_LIST_BOTTOM_PAD,
} from '~/interface/constants'
import { MainPreloads } from '~/interface/main/MainPreloads'
import { RenderChildrenWhenIdle } from '~/interface/utils/RenderChildrenWhenIdle'
import { MainLayoutBottomFadeEffect } from '../app/MainLayoutBottomFadeEffect'
import { TaskDetailFloatingPane } from '~/features/task/TaskDetailFloatingPane'

export const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <YStack m={MAIN_PAD_PANE} id="main-layout" flex={1} z={5}>
        <MainLayoutTopFadeEffect />

        <YStack
          flex={1}
          id="main-content-container"
          group="frame"
          {...MAIN_CONTENT_RADIUS_PROPS}
          // CHROME will break gradient blurs if you make hidden
          // but SAFARI will show content outside if you don't
          // overflow={IS_SAFARI ? 'hidden' : undefined}
        >
          <RenderChildrenWhenIdle>
            <MainPreloads />
          </RenderChildrenWhenIdle>

          <TopBar />

          <HudMain />

          <MainContent>
            {children}

            <BottomFade />
            <UpperContentBg />
          </MainContent>

          <ChannelMainMessageInput />

          <TaskDetailFloatingPane />
          <AppEditor />
          <AppsFloatingRow />
        </YStack>

        {/* base background bg */}
        <YStack
          {...MAIN_CONTENT_RADIUS_PROPS}
          id="main-background"
          fullscreen
          z={-1}
          overflow="hidden"
          pointerEvents="none"
          borderWidth={0.5}
          opacity={0.6}
          borderColor="$color4"
          $theme-dark={{
            shadowColor: '$shadow4',
            shadowRadius: 8,
            shadowOffset: { height: 2, width: 0 },
          }}
          $theme-light={{
            shadowColor: '$shadow4',
            shadowRadius: 5,
            shadowOffset: { height: 2, width: 0 },
          }}
        >
          <YStack fullscreen opacity={0.8} bg="$color1pt5" />
        </YStack>
      </YStack>
    </>
  )
}

const BottomFade = () => {
  const { extraHeight } = useMainInputHeight()
  return (
    <YStack position="absolute" b={0} l={0} r={0} y={extraHeight}>
      <MainLayoutBottomFadeEffect />
    </YStack>
  )
}

const UpperContentBg = () => {
  const { colors } = useAppTheme()
  const { extraHeight } = useMainInputHeight()

  return (
    <YStack
      fullscreen
      {...MAIN_CONTENT_RADIUS_PROPS}
      // overflow="hidden"
      z={-1}
      {...useHudMainFrameHideProps()}
    >
      <YStack
        fullscreen
        bg={colors.mainLayoutBackground}
        opacity={colors.mainLayoutBackgroundOpacity}
        y={extraHeight}
        t={-extraHeight}
        {...MAIN_CONTENT_RADIUS_PROPS}
      />
      <YStack
        rounded={MAIN_CONTENT_RADIUS_LEFT}
        fullscreen
        b={0}
        z={0}
        opacity={1}
        y={extraHeight}
        t={-extraHeight}
        pointerEvents="none"
        $theme-dark={{
          shadowColor: '$shadow1',
          shadowRadius: 4,
          shadowOffset: { height: 3, width: 0 },
        }}
        $theme-light={{
          shadowColor: '$shadow3',
          shadowRadius: 4,
          shadowOffset: { height: 3, width: 0 },
        }}
      />
    </YStack>
  )
}

const MainContent = (props: { children: any }) => {
  return (
    <YStack
      data-tauri-drag-region
      id="main-content"
      {...MAIN_CONTENT_RADIUS_PROPS}
      // overflow="hidden"
      group="frame"
      z={0}
      position="relative"
      flex={1}
      y={0}
      mb={MESSAGE_LIST_BOTTOM_PAD - 22}
      {...useHudMainFrameHideProps()}
    >
      {/* background */}
      {props.children}
    </YStack>
  )
}

// gradient border frame effect
// <YStack
//         fullscreen
//         bg={colors.mainLayoutBackground}
//         opacity={colors.mainLayoutBackgroundOpacity}
//         {...MAIN_CONTENT_RADIUS_PROPS}
//         style={{
//           background: `conic-gradient(
//             from var(--gradient-angle, 0deg) at 50% 50%,
//             var(--teal7) 0deg,
//             var(--orange7) 36deg,
//             var(--purple7) 72deg,
//             var(--teal7) 108deg,
//             var(--orange7) 144deg,
//             var(--purple7) 180deg,
//             var(--teal7) 216deg,
//             var(--orange7) 252deg,
//             var(--purple7) 288deg,
//             var(--teal7) 324deg,
//             var(--orange7) 360deg
//           )`,
//           padding: 3,
//           WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
//           WebkitMaskComposite: 'xor',
//           mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
//           maskComposite: 'exclude',
//           animation: 'gradient-rotate 60s linear infinite',
//         }}
// />
