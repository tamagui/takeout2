import { createGlobalContext, isNative } from '@vxrn/helpers'
import { useState } from 'react'
import type {
  RadiusTokens,
  TabLayout,
  TabsTabProps,
  ViewProps,
  XStackProps,
} from 'tamagui'
import {
  AnimatePresence,
  SizableText,
  Tabs as TamaguiTabs,
  useEvent,
  withStaticProperties,
  XStack,
  YStack,
} from 'tamagui'
import { Shortcut } from '~/features/shortcuts/shortcuts'
import { animationClamped } from '../animations/animationClamped'

const TabsDirection = createGlobalContext<0 | 1 | -1>('tabs/direction', 0)

type ReactComponent = (props: any) => React.ReactNode

function TabsComponent({
  tabs,
  children,
  initialTab,
  onValueChange,
  tabsContainerProps,
  ...rest
}: {
  tabs: { label: any; value: string; Icon?: ReactComponent }[]
  children: any
  initialTab: string
  onValueChange?: (value: string) => void
  tabsContainerProps?: XStackProps
}) {
  const [selected, setSelected] = useState<string>(initialTab)

  const [tabState, setTabState] = useState<{
    // Layout of the Tab user might intend to select (hovering / focusing)
    intentAt: TabLayout | null
    // Layout of the Tab user selected
    activeAt: TabLayout | null
    // Used to get the direction of activation for animating the active indicator
    prevActiveAt: TabLayout | null
  }>({
    intentAt: null,
    activeAt: null,
    prevActiveAt: null,
  })

  const setIntentIndicator = (intentAt: TabLayout | null) =>
    setTabState((prevTabState) => ({ ...prevTabState, intentAt }))
  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState((prevTabState) => ({
      ...prevTabState,
      prevActiveAt: tabState.activeAt,
      activeAt,
    }))

  const { activeAt, intentAt, prevActiveAt } = tabState

  // 1 = right, 0 = nowhere, -1 = left
  const direction = (() => {
    if (!activeAt || !prevActiveAt || activeAt.x === prevActiveAt.x) {
      return 0
    }
    return activeAt.x > prevActiveAt.x ? -1 : 1
  })()

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    } else {
      setIntentIndicator(layout)
    }
  }

  const switchTab = useEvent((direction: 'forward' | 'backward') => {
    const currentIndex = tabs.findIndex((tab) => tab.value === selected)
    let nextIndex = currentIndex

    if (direction === 'forward') {
      nextIndex = currentIndex + 1
      if (nextIndex >= tabs.length) {
        return
      }
    } else {
      nextIndex = currentIndex - 1
      if (nextIndex < 0) {
        return
      }
    }

    const nextTab = tabs[nextIndex]
    if (nextTab) {
      onValueChange?.(nextTab.value)
      setSelected(nextTab.value)
    }
  })

  const TabsContent = (
    <TamaguiTabs
      data-tauri-drag-region
      activationMode="manual"
      orientation="horizontal"
      size="$4"
      minH="max-content"
      tabIndex="unset"
      width="100%"
      value={selected}
      onPress={(e) => e.stopPropagation()}
      onValueChange={(val) => {
        onValueChange?.(val)
        setSelected(val)
      }}
      group
      flex={1}
      {...rest}
    >
      <YStack data-tauri-drag-region flex={1} {...tabsContainerProps}>
        <YStack z={100000} data-tauri-drag-region rounded="$5">
          <XStack data-tauri-drag-region width="100%" gap="$6">
            <XStack data-tauri-drag-region mb="$4" flex={1}>
              <AnimatePresence initial={false}>
                {intentAt && (
                  <TabIndicator
                    width={intentAt.width}
                    height={intentAt.height}
                    x={intentAt.x}
                    y={intentAt.y}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {activeAt && (
                  <TabIndicator
                    width={activeAt.width}
                    height={activeAt.height}
                    x={activeAt.x}
                    y={activeAt.y}
                  />
                )}
              </AnimatePresence>

              <TamaguiTabs.List
                flex={1}
                disablePassBorderRadius
                loop={false}
                aria-label="package manager"
                gap="$2"
              >
                {tabs.map((tab) => {
                  return (
                    <Tab
                      key={tab.value}
                      Icon={tab.Icon}
                      active={selected === tab.value}
                      label={tab.label}
                      onInteraction={handleOnInteraction}
                      value={tab.value}
                    />
                  )
                })}
              </TamaguiTabs.List>
            </XStack>
          </XStack>
        </YStack>

        {/* <AnimatePresence exitBeforeEnter custom={{ direction }} initial={false}>
          <AnimatedYStack flex={1} key={selected}>
            
          </AnimatedYStack>
        </AnimatePresence> */}

        {children}
      </YStack>
    </TamaguiTabs>
  )

  return (
    <TabsDirection.Provider value={direction}>
      {!isNative ? (
        <Shortcut whenFocused shortcut="Meta+[" onTrigger={() => switchTab('backward')}>
          <Shortcut whenFocused shortcut="Meta+]" onTrigger={() => switchTab('forward')}>
            {TabsContent}
          </Shortcut>
        </Shortcut>
      ) : (
        TabsContent
      )}
    </TabsDirection.Provider>
  )
}

const rounded: RadiusTokens = '$4'

function Tab({
  label,
  value,
  onInteraction,
  active,
  Icon,
}: {
  label: string
  value: string
  onInteraction: TabsTabProps['onInteraction']
  active?: boolean
  Icon?: ReactComponent
}) {
  return (
    <TamaguiTabs.Tab
      unstyled
      data-tauri-drag-region
      pl="$2"
      pr="$2.5"
      py="$1.5"
      gap="$1.5"
      flex={1}
      bg="transparent"
      tabIndex={0}
      borderWidth={0}
      shadowRadius={0}
      rounded={rounded}
      value={value}
      // TODO: these 2 crashes on native
      {...(!isNative && {
        animation: animationClamped('quickerLessBouncy'),
        onInteraction,
      })}
      className={`tab-${value} ` + (active ? '' : 'disable-all-pointer-events')}
      pressStyle={{
        bg: '$color3',
      }}
      focusStyle={{
        outlineWidth: 1,
        outlineStyle: 'solid',
        outlineColor: '$background02',
      }}
    >
      <XStack data-tauri-drag-region gap="$1.5" items="center" justify="center">
        {!!Icon && <Icon size={12} mr={3} opacity={0.5} />}
        <SizableText
          data-tauri-drag-region
          fontFamily="$mono"
          y={-0.5}
          size="$2"
          color={active ? '$color12' : '$color11'}
          fontWeight="500"
          select="none"
        >
          {label}
        </SizableText>
      </XStack>
    </TamaguiTabs.Tab>
  )
}

function TabIndicator({ active, ...props }: { active?: boolean } & ViewProps) {
  return (
    <YStack
      position="absolute"
      bg="$color4"
      opacity={0.7}
      rounded={rounded}
      animation={animationClamped('quickerLessBouncy')}
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      {...(active && {
        bg: '$color8',
        opacity: 0.6,
      })}
      {...props}
    />
  )
}

// TODO make animated tab
// const TabsContent = (props: TabsContentProps) => {
//   const direction = use(TabsDirection)

//   return <AnimatedPane animation="bouncy" direction={direction as any} {...props} />
// }

// const AnimatedPane = styled(YStack, {
//   flex: 1,
//   x: 0,
//   opacity: 1,

//   variants: {
//     // 1 = right, 0 = nowhere, -1 = left
//     direction: {
//       ':number': (direction) => ({
//         enterStyle: {
//           x: direction > 0 ? -10 : -10,
//           opacity: 0,
//         },
//         exitStyle: {
//           zIndex: 0,
//           x: direction < 0 ? -10 : -10,
//           opacity: 0,
//         },
//       }),
//     },
//   } as const,
// })

export const Tabs = withStaticProperties(TabsComponent, {
  Content: TamaguiTabs.Content,
})
