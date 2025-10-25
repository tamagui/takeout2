import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import type {
  RadiusTokens,
  TabLayout,
  TabsTabProps,
  ViewProps,
  XStackProps,
} from 'tamagui'
import {
  AnimatePresence,
  isWeb,
  SizableText,
  Tabs as TamaguiTabs,
  useTheme,
  withStaticProperties,
  XStack,
  YStack,
} from 'tamagui'
import { isNative } from '~/constants/platform'
import { createGlobalContext } from '@vxrn/helpers'
import { animationClamped } from '../animations/animationClamped'

const TabsDirection = createGlobalContext<0 | 1 | -1>('tabs/direction', 0)

type ReactComponent = (props: any) => React.ReactNode

const rounded: RadiusTokens = '$8'

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
  const theme = useTheme()
  const [selected, setSelected] = useState<string>(initialTab)
  // native animated indicator
  const animatedPosition = useRef(new Animated.Value(0)).current
  const [tabWidth, setTabWidth] = useState(100)

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

  // animate to active tab
  const animateToTab = (index: number) => {
    Animated.spring(animatedPosition, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start()
  }

  // update animation when tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.value === selected)
    if (activeIndex >= 0 && tabWidth > 0) {
      animateToTab(activeIndex)
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: animateToTab is stable
  }, [selected, tabWidth, tabs, animateToTab])

  const tabsContent = (
    <TamaguiTabs
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
      <YStack flex={1} {...tabsContainerProps}>
        <YStack z={100000} rounded="$5">
          <XStack width="100%" gap="$6">
            <XStack mb="$4" flex={1} bg="$color2" rounded={rounded} p="$1">
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
                onLayout={(e) => {
                  const width = e.nativeEvent.layout.width
                  setTabWidth(width / tabs.length)
                }}
              >
                {!isWeb && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      height: '100%',
                      backgroundColor: theme.color5.val,

                      width: tabWidth,
                      borderRadius: 14,
                      transform: [{ translateX: animatedPosition }],
                    }}
                  />
                )}
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

        <YStack position="relative">{children}</YStack>
      </YStack>
    </TamaguiTabs>
  )

  return <TabsDirection.Provider value={direction}>{tabsContent}</TabsDirection.Provider>
}

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
      active={false}
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
      <XStack gap="$1.5" items="center" justify="center">
        {!!Icon && <Icon size={12} mr={3} opacity={0.5} />}
        <SizableText
          size="$3"
          color={active ? '$color12' : '$color11'}
          fontWeight="600"
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
      $theme-light={{
        bg: '$color5',
      }}
      opacity={0.5}
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
