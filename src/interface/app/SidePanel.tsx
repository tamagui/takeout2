import { Maximize2, Minimize2, X } from '@tamagui/lucide-icons'
import type React from 'react'
import { memo, useLayoutEffect, useState } from 'react'
import { Separator, useDebounceValue, XStack, YStack } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { useAppTheme } from '~/features/app/AppTheme'
import { useShowFloatingSidePane } from '~/features/app/useShowFloatingSidePane'
import { animationClamped } from '~/interface/animations/animationClamped'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import {
  MAIN_CONTENT_RADIUS_INSET,
  MAIN_PAD_PANE,
  TOP_BAR_HEIGHT,
} from '~/interface/constants'
import { DraggableVerticalSeparator } from '~/interface/dividers/DraggableVerticalSeparator'
import { useDraggableDivider } from '~/interface/dividers/useDraggableDivider'
import { useHoverGlow } from '~/interface/effects/HoverGlow'
import { updateInstanceState, useInstanceState } from '~/state/instanceState'
import Glint from '../effects/Glint'

type Props = {
  children: any
  open: boolean
  onClose?: () => void
  topLeftActions?: React.ReactNode
  topLeftTitle?: React.ReactNode
  topRightActions?: React.ReactNode
  maximized?: boolean
  onToggleMaximized?: () => void
  onSetFloating?: () => void
}

export const SidePanel = (props: Props) => {
  const { open } = props
  const { sidebarWidth, sidePanelAdjustX } = useInstanceState((s) => s)
  const openDebounced = useDebounceValue(open, 500)
  const isFullyClosed = !open && !openDebounced
  const [closedWidth, setClosedWidth] = useState(sidebarWidth)

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need to re-run
  useLayoutEffect(() => {
    if (isFullyClosed) {
      setClosedWidth(sidebarWidth)
    }
  }, [isFullyClosed])

  return (
    <SidePanelContents
      {...props}
      isFullyClosed={isFullyClosed}
      open={open}
      sidebarWidth={isFullyClosed ? closedWidth : sidebarWidth}
      sidePanelAdjustX={sidePanelAdjustX}
    />
  )
}

const SidePanelContents = memo(
  ({
    children,
    onClose,
    topLeftActions,
    topLeftTitle,
    topRightActions,
    maximized,
    onToggleMaximized,
    sidebarWidth,
    onSetFloating,
    sidePanelAdjustX,
    open,
    isFullyClosed,
  }: Props & {
    sidebarWidth: number
    sidePanelAdjustX: number
    open: boolean
    isFullyClosed: boolean
  }) => {
    // const isSidebarCollapsed = useSidebarCollapsed()
    const isFloating = useShowFloatingSidePane()
    const { colors } = useAppTheme()

    const HoverGlow = useHoverGlow({
      background: 'var(--background0)',
      color: 'var(--color2)',
      strategy: 'radial-gradient',
      restingStyle: { opacity: 0 },
      recenterOnRest: true,
      resist: 20,
      useResizeObserverRect: true,
      blurPct: 0,
      scale: 8,
      opacity: 0.8,
    })

    // console.warn({
    //   isFullyClosed,
    //   isFloating,
    //   maximized,
    //   isSidebarCollapsed,
    //   sidebarWidth,
    // })

    return (
      <>
        {/* backdrop */}
        <YStack
          animation={animationClamped('medium')}
          data-backdrop-open={open}
          fullscreen
          pointerEvents={open ? 'auto' : 'none'}
          bg="$color1"
          opacity={open ? 0.4 : 0}
          z={400_000}
          onPress={onClose}
          shadowOpacity={1}
          {...(!isFloating && {
            opacity: 0,
            pointerEvents: 'none',
          })}
        />

        <YStack
          animation={!isFullyClosed && isFloating ? animationClamped('200ms') : '0ms'}
          animateOnly={['transform', 'opacity', 'width']}
          rounded={MAIN_CONTENT_RADIUS_INSET}
          $platform-web={{
            visibility: isFullyClosed ? 'hidden' : 'visible',
          }}
          z={500000}
          width="100%"
          maxW="100%"
          group="frame"
          l="auto"
          position="relative"
          {...(isFloating && {
            position: 'absolute',
            overflow: 'hidden',
            t: TOP_BAR_HEIGHT - 16,
            r: 16,
            b: 16,
            backdropFilter: 'blur(20px)',
            shadowColor: '$shadow6',
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 20 },
            ...(!maximized && {
              width: 'calc(70% - 20px)',
            }),
            ...(maximized && {
              width: 'calc(100% - 40px)',
            }),

            ...(open
              ? {
                  opacity: 1,
                  pe: 'auto',
                }
              : {
                  opacity: 0,
                  pe: 'none',
                  x: 3,
                }),
          })}
          {...(!isFloating && {
            x: 0,
            my: MAIN_PAD_PANE,
            mr: MAIN_PAD_PANE,
            ...(open
              ? {
                  width: '100%',
                  maxW: `calc(41.666666% - ${sidePanelAdjustX}px)`,
                  flex: 1.5,
                  opacity: 1,
                  shadowColor: '$shadow4',
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 1 },
                }
              : {
                  width: 0,
                  mr: 0,
                  maxW: 0,
                  flex: 1,
                }),
          })}
        >
          {open && !isFloating && (
            <YStack fullscreen pointerEvents="none" x={-3}>
              <SidePanelDraggableDivider />
            </YStack>
          )}

          {/* non-floating background */}
          <YStack
            rounded={MAIN_CONTENT_RADIUS_INSET}
            fullscreen
            bg={colors.mainLayoutBackground}
            opacity={isFloating ? 0 : 0.9}
          />

          {/* floating background */}
          <YStack
            rounded={MAIN_CONTENT_RADIUS_INSET}
            opacity={isFloating ? 1 : 0}
            data-tauri-drag-region
            pointerEvents="none"
            fullscreen
            z={0}
            borderWidth={0.5}
            borderColor="$color4"
          >
            <YStack>
              <LinearGradient
                colors={['$background0', colors.mainLayoutBackground]}
                pointerEvents="none"
                height={85}
                z={1}
              />
              <HoverGlow.Component />
            </YStack>
            <YStack flex={1} bg={colors.mainLayoutBackground} />
          </YStack>

          {/* topbar */}
          <XStack
            ref={HoverGlow.parentRef as any}
            data-tauri-drag-region
            items="center"
            py="$2"
            px="$3"
            gap="$3"
          >
            <Glint
              borderTopLeftRadius={MAIN_CONTENT_RADIUS_INSET}
              borderTopRightRadius={MAIN_CONTENT_RADIUS_INSET}
            />

            <XStack items="center" gap="$1">
              <>
                {isFloating && (
                  <ButtonSimple
                    glow
                    variant="transparent"
                    size="small"
                    circular
                    onPress={onToggleMaximized}
                  >
                    <YStack
                      animation="quick"
                      opacity={0}
                      fullscreen
                      items="center"
                      justify="center"
                      y={5}
                      {...(maximized && {
                        opacity: 1,
                        y: 0,
                      })}
                    >
                      <Minimize2 size={12} />
                    </YStack>
                    <YStack
                      animation="quick"
                      opacity={0}
                      y={5}
                      fullscreen
                      items="center"
                      justify="center"
                      {...(!maximized && {
                        opacity: 1,
                        y: 0,
                      })}
                    >
                      <Maximize2 size={12} />
                    </YStack>
                  </ButtonSimple>
                )}

                {!isFloating && onSetFloating && (
                  <ButtonSimple
                    glow
                    variant="transparent"
                    size="small"
                    circular
                    onPress={onSetFloating}
                  >
                    <Maximize2 size={12} />
                  </ButtonSimple>
                )}
              </>

              {topLeftActions}
            </XStack>

            <XStack data-tauri-drag-region flex={10} items="center" gap="$3">
              {topLeftTitle}
            </XStack>

            <XStack flex={1} />

            <XStack items="center">
              {topRightActions}

              <ButtonSimple
                glow
                variant="transparent"
                size="small"
                onPress={onClose}
                icon={X}
              />
            </XStack>
          </XStack>

          <Separator mx="$6" opacity={0.25} />

          {children}
        </YStack>
      </>
    )
  }
)

const DRAG_HANDLE_WIDTH = 6
const ALLOW_ADJUST_AMOUNT = 400

const SidePanelDraggableDivider = memo(() => {
  const sidePanelAdjustX = useInstanceState((s) => s.sidePanelAdjustX)

  const { dragHandleProps, isDragging, dragDirection } = useDraggableDivider({
    initialWidth: sidePanelAdjustX + ALLOW_ADJUST_AMOUNT / 2,
    minWidth: 0,
    maxWidth: ALLOW_ADJUST_AMOUNT,
    onDrag: (newWidth) => {
      updateInstanceState({ sidePanelAdjustX: newWidth - ALLOW_ADJUST_AMOUNT / 2 })
    },
  })

  return (
    <YStack
      z={10000000}
      transition="all ease-in-out 150ms 120ms"
      px={DRAG_HANDLE_WIDTH / 2}
      mx={-DRAG_HANDLE_WIDTH / 2}
      width={10}
      x={-2}
      group="item"
      containerType="normal"
      t={0}
      b={0}
      position="absolute"
      pointerEvents="auto"
      // Spread the drag handle props from our hook here
      {...dragHandleProps}
    >
      <DraggableVerticalSeparator isDragging={isDragging} dragDirection={dragDirection} />
    </YStack>
  )
})

// @ts-expect-error
globalThis['GlobalElement'] ||= {}
// @ts-expect-error
globalThis['GlobalElement'].SidePanelFrame = SidePanel
