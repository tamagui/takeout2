import { LinearGradient } from '@tamagui/linear-gradient'
import { ChevronLeft, ChevronRight, Link } from '@tamagui/lucide-icons'
import { router } from 'one'
import { memo, useEffect, useMemo, type ReactNode } from 'react'
import {
  ScrollView,
  Spacer,
  useDebounceValue,
  useMedia,
  View,
  XGroup,
  XStack,
  YStack,
} from 'tamagui'
import { IS_SAFARI } from '@vxrn/helpers'
import { AppTheme, useAppTheme, useServerTintColor } from '~/features/app/AppTheme'
import { useAuth } from '~/auth/client/authClient'
import { TopBarDevToolsButton } from '~/features/devtools/TopBarDevTools'
import { HudSidebar } from '~/features/hud/HudSidebar'
import { useHudOpen } from '~/features/hud/useUserHud'
import { updateInstanceState, useInstanceState } from '~/state/instanceState'
import { isTauri } from '@vxrn/helpers'
import { LoginSignupContents } from '../../auth/ui/LoginSignupContents'
import { SidebarActivity } from '../activity/SidebarActivity'
import { animationClamped } from '../animations/animationClamped'
import { AnimationDriver } from '../animations/AnimationDriver'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { MAIN_PAD_PANE, TOP_BAR_HEIGHT } from '../constants'
import { DraggableVerticalSeparator } from '../dividers/DraggableVerticalSeparator'
import { useDraggableDivider } from '../dividers/useDraggableDivider'
import { showToast } from '../toast/Toast'
import { SidebarHome } from './SidebarHome'
import { SidebarPrivateChats } from './SidebarPrivateChats'
import { SidebarServerChannelsList } from './SidebarServerChannelsList'
import { SidebarServersRow } from './SidebarServersRow'
import { useSidebarCollapsed } from './useSidebarCollapsed'

const DRAG_HANDLE_WIDTH = 6

export const Sidebar = memo(() => {
  const { pointerTouch } = useMedia()

  return (
    <>
      {pointerTouch && <SidebarMobile />}
      {!pointerTouch && <SidebarDesktop />}
    </>
  )
})

export const SidebarMobile = memo(() => {
  const { state } = useAuth()

  return (
    <AppTheme>
      <YStack width="100vw" pt={TOP_BAR_HEIGHT}>
        {state === 'logged-in' ? <SidebarContent /> : <LoginSignupContents />}
      </YStack>
    </AppTheme>
  )
})

const SidebarDesktop = memo(() => {
  const { sidebarWidth, showSidebar } = useInstanceState((s) => s)
  const isCollapsed = useSidebarCollapsed()
  const isCollapsedSlow = useDebounceValue(
    isCollapsed,
    500 // === animation="slow"
  )

  const fastAnimationSpeed = 100
  const showSidebarDelayed = useDebounceValue(showSidebar, fastAnimationSpeed)

  const isAnimatingToCollapsed =
    (isCollapsed && !isCollapsedSlow) || (!isCollapsed && isCollapsedSlow)

  const isFullyCollapsed = isCollapsed && !isAnimatingToCollapsed
  const isVisiblyFloating = isFullyCollapsed && (showSidebar || showSidebarDelayed)

  useEffect(() => {
    if (!isCollapsed) {
      // when resizing to big again, always set sidebar to hidden again
      updateInstanceState({ showSidebar: false })
    }
  }, [isCollapsed])

  // Use the custom hook, passing the current width and an onDrag callback
  const { dragHandleProps, isDragging, dragDirection } = useDraggableDivider({
    initialWidth: sidebarWidth,
    minWidth: 220,
    maxWidth: 300,
    onDrag: (newWidth) => {
      updateInstanceState({ sidebarWidth: newWidth })
    },
  })

  const innerContent = useMemo(() => {
    return (
      <AnimationDriver name="spring">
        {isTauri && (
          <XStack
            position="absolute"
            t={MAIN_PAD_PANE}
            r={MAIN_PAD_PANE}
            items="center"
            animation={animationClamped('quick')}
            z={100000000}
          >
            <TopBarDevToolsButton variant="subtle" />

            <ButtonSimple
              variant="transparent"
              size="small"
              scaleIcon={0.8}
              tooltip="Permalink"
              tooltipDelayed
              icon={Link}
              onPress={() => {
                navigator.clipboard.writeText(window.location.href)
                showToast(`Copied current URL`)
              }}
            />

            <ButtonSimple
              variant="transparent"
              tooltip="Back"
              tooltipDelayed
              size="small"
              onPress={() => router.back()}
              icon={ChevronLeft}
            />

            <ButtonSimple
              variant="transparent"
              tooltip="Forward"
              tooltipDelayed
              size="small"
              onPress={() => {
                if (typeof history !== 'undefined') {
                  history.forward()
                }
              }}
              icon={ChevronRight}
            />
          </XStack>
        )}

        <SidebarContent />
      </AnimationDriver>
    )
  }, [])

  return (
    <>
      <AppTheme>
        <AnimationDriver name="css">
          <YStack
            flex={10}
            minH="100vh"
            maxW={sidebarWidth}
            minW={sidebarWidth}
            data-tauri-drag-region
            id="sidebar"
            animation={
              isDragging ? null : isVisiblyFloating ? `${fastAnimationSpeed}ms` : 'medium'
            }
            animateOnly={['transform', 'width', 'opacity', 'margin']}
            opacity={1}
            // TODO bug x should overwrite not be cumulative
            // to show the bug, remove the below media query and replace with the commented out stuff below
            // then resize the window wide/small which should animate the sidebar to collapsed or not

            {...(isCollapsed && {
              mr: -sidebarWidth + MAIN_PAD_PANE,
              x: showSidebar
                ? 0
                : !isCollapsed || isAnimatingToCollapsed
                  ? -sidebarWidth / 2
                  : -sidebarWidth,
              z: isFullyCollapsed ? 3_000_000 : -1,
              bg: isVisiblyFloating ? '$color2' : null,
              opacity: isVisiblyFloating ? 1 : 0,
              pointerEvents: isVisiblyFloating ? 'auto' : 'none',
              shadowColor: isVisiblyFloating ? '$shadow6' : 'transparent',
              shadowRadius: 50,
              p: '$2',
            })}

            // sidebarWidth / 2 should be 0, but its adding the "x" value from the base
            // x={showSidebar ? 0 : -sidebarWidth / 2}
            // z={showSidebar ? 10000000 : 0}
            // $sm={{
            //   // x should overwrite not be cumulative!
            //   x: sidebarWidth / 2,
            //   z: showSidebar ? 200_000 : 0,
            //   mr: 0,
            // }}
          >
            {/* <GradientBlurUp /> */}
            {/* <SidebarBottomFade /> */}
            <YStack flex={1} overflow="hidden" contain="strict" group="frame">
              {innerContent}
            </YStack>

            <YStack
              py="$2"
              // mt="auto"
              maxH={200}
              z={1000}
              position="absolute"
              b={0}
              l={0}
              r={0}
            >
              <SidebarServersRow />
            </YStack>
          </YStack>
        </AnimationDriver>

        {/* floating bg */}
        <YStack
          fullscreen
          animation={`${fastAnimationSpeed}ms`}
          z={3_000_000 - 1}
          bg="$shadow2"
          onPress={() => updateInstanceState({ showSidebar: false })}
          opacity={0}
          pointerEvents="none"
          {...(showSidebar &&
            isCollapsed && {
              opacity: 1,
              pointerEvents: 'auto',
            })}
        />
      </AppTheme>

      <YStack
        z={6}
        px={DRAG_HANDLE_WIDTH / 2}
        mx={-DRAG_HANDLE_WIDTH}
        x={!IS_SAFARI ? -1 : 0}
        group="item"
        containerType="normal"
        // Spread the drag handle props from our hook here
        {...dragHandleProps}
      >
        <DraggableVerticalSeparator
          isDragging={isDragging}
          dragDirection={dragDirection}
        />
      </YStack>
    </>
  )
})

const SidebarBottomFade = () => {
  const serverTint = useServerTintColor()
  const { colors } = useAppTheme()

  return (
    <YStack
      pointerEvents="none"
      // className="fade-out-right"
      position="absolute"
      z={2}
      b={0}
      l={0}
      r={-20}
      height={80}
    >
      {/* <GradientBlurDown top={-15} bottom={-50} /> */}
      {isTauri && (
        <LinearGradient
          fullscreen
          t={-25}
          colors={['$color0', colors.appBackground, colors.appBackground]}
          // mixBlendMode="saturation"
          opacity={serverTint ? 0.1 : colors.sidebarBottomFadeOpacity}
        />
      )}
    </YStack>
  )
}

const SidebarHudContainer = memo(({ children }: { children: ReactNode }) => {
  const hudOpen = useHudOpen()

  return (
    <>
      <HudSidebar />

      <View
        animation={animationClamped('quickerLessBouncy')}
        flex={1}
        z={-1}
        {...(hudOpen
          ? {
              pointerEvents: 'none',
              opacity: 0,
              x: -10,
            }
          : {
              pointerEvents: 'auto',
              opacity: 1,
              x: 0,
            })}
      >
        {children}
      </View>
    </>
  )
})

export const SidebarContent = memo(function SidebarContent() {
  return (
    <SidebarHudContainer>
      <SidebarActivity />

      <ScrollView data-tauri-drag-region showsVerticalScrollIndicator={false}>
        <YStack
          flex={1}
          gap="$2"
          // this aligns the top item (non-tauri) with the top rounding of the main content
          py={MAIN_PAD_PANE}
          px={MAIN_PAD_PANE}
          data-tauri-drag-region
          id="sidebar-content"
        >
          {isTauri && <Spacer size={30} />}

          <SidebarHome />

          <SidebarServerChannelsList />

          {/* <SidebarApps /> */}

          {/* <SidebarThreads /> */}

          <Spacer flex />

          <SidebarPrivateChats />
        </YStack>
      </ScrollView>
    </SidebarHudContainer>
  )
})
