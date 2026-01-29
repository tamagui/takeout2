import { useState } from 'react'
import { AnimatePresence, Tabs, View, withStaticProperties } from 'tamagui'

import { animationClamped } from '~/interface/animations/animationClamped'

import type { TabLayout, TabsTabProps, ViewProps } from 'tamagui'

type TabState = {
  intentAt: TabLayout | null
  activeAt: TabLayout | null
  prevActiveAt: TabLayout | null
}

type IndicatorStyle = 'underline' | 'pill'

type RenderProps = {
  handleOnInteraction: TabsTabProps['onInteraction']
  currentTab: string
}

type RovingTabsChildren = React.ReactNode | ((props: RenderProps) => React.ReactNode)

export function useRovingTabs(initialTab?: string) {
  const [currentTab, setCurrentTab] = useState(initialTab ?? '')
  const [tabState, setTabState] = useState<TabState>({
    intentAt: null,
    activeAt: null,
    prevActiveAt: null,
  })

  const setIntentIndicator = (intentAt: TabLayout | null) =>
    setTabState((prev) => ({ ...prev, intentAt }))

  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState((prev) => ({
      ...prev,
      prevActiveAt: prev.activeAt,
      activeAt,
    }))

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    } else {
      setIntentIndicator(layout)
    }
  }

  return {
    currentTab,
    setCurrentTab,
    tabState,
    handleOnInteraction,
  }
}

function RovingTabsRoot({
  children,
  value,
  onValueChange,
  indicatorStyle = 'underline',
  ...rest
}: {
  children: RovingTabsChildren
  value: string
  onValueChange?: (value: string) => void
  indicatorStyle?: IndicatorStyle
} & Omit<ViewProps, 'children'>) {
  const [tabState, setTabState] = useState<TabState>({
    intentAt: null,
    activeAt: null,
    prevActiveAt: null,
  })

  const setIntentIndicator = (intentAt: TabLayout | null) =>
    setTabState((prev) => ({ ...prev, intentAt }))

  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState((prev) => ({
      ...prev,
      prevActiveAt: prev.activeAt,
      activeAt,
    }))

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    } else {
      setIntentIndicator(layout)
    }
  }

  const { activeAt, intentAt } = tabState

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      activationMode="manual"
      {...rest}
    >
      <View position="relative">
        <AnimatePresence>
          {intentAt && (
            <RovingTabsIndicator
              key="intent"
              variant={indicatorStyle}
              width={intentAt.width}
              height={indicatorStyle === 'underline' ? 3 : intentAt.height}
              x={intentAt.x}
              y={indicatorStyle === 'underline' ? undefined : intentAt.y}
              b={indicatorStyle === 'underline' ? 0 : undefined}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeAt && (
            <RovingTabsIndicator
              key="active"
              active
              variant={indicatorStyle}
              width={activeAt.width}
              height={indicatorStyle === 'underline' ? 3 : activeAt.height}
              x={activeAt.x}
              y={indicatorStyle === 'underline' ? undefined : activeAt.y}
              b={indicatorStyle === 'underline' ? 0 : undefined}
            />
          )}
        </AnimatePresence>

        <Tabs.List loop={false} bg="transparent" gap="$2">
          {typeof children === 'function'
            ? children({
                handleOnInteraction,
                currentTab: value,
              })
            : children}
        </Tabs.List>
      </View>
    </Tabs>
  )
}

function RovingTabsTab({
  children,
  value,
  onInteraction,
  ...rest
}: {
  children: React.ReactNode
  value: string
  onInteraction?: TabsTabProps['onInteraction']
} & Omit<ViewProps, 'children'>) {
  return (
    <Tabs.Tab
      unstyled
      value={value}
      onInteraction={onInteraction}
      borderWidth={0}
      bg="transparent"
      rounded="$2"
      hoverStyle={{
        bg: 'transparent',
      }}
      pressStyle={{
        bg: 'transparent',
      }}
      {...rest}
    >
      {children}
    </Tabs.Tab>
  )
}

function RovingTabsIndicator({
  active,
  variant = 'underline',
  ...props
}: {
  active?: boolean
  variant?: IndicatorStyle
} & ViewProps) {
  const isUnderline = variant === 'underline'

  return (
    <View
      position="absolute"
      bg={active ? '$color10' : '$color6'}
      opacity={active ? 1 : 0.5}
      rounded={isUnderline ? '$2' : '$4'}
      transition={animationClamped('quickerLessBouncy')}
      pointerEvents="none"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      {...(active && {
        theme: 'blue',
      })}
      {...props}
    />
  )
}

export const RovingTabs = withStaticProperties(RovingTabsRoot, {
  Tab: RovingTabsTab,
  Indicator: RovingTabsIndicator,
})
