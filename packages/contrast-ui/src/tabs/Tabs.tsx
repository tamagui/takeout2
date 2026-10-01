import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import {
  AnimatePresence,
  isWeb,
  SizableText,
  styled,
  Tabs as TamaguiTabs,
  Text,
  withStaticProperties,
  XStack,
  YStack,
  type RadiusTokens,
  type SizableTextProps,
  type SpaceTokens,
  type TabLayout,
  type TabsTabProps,
  type ViewProps,
  type XStackProps,
} from 'tamagui'
import { animationClamped } from '../animations/animationClamped'
import type { IconComponent } from '../icons/types'

// the value of the enclosing Tabs, so a content pane can tell whether it is the
// visible one without every pane subscribing to the tabs root.
const TabsSelectedContext = createContext('')

// set by the `alwaysVisibleContent` prop; Tabs.Content reads it instead of
// taking the same flag again at every call site.
const TabsAlwaysVisibleContext = createContext(false)

export type TabSize = 'small' | 'medium' | 'large'
export type TabVariant = 'default' | 'underline'

export type TabConfig = {
  label: string
  value: string
  Icon?: IconComponent
}

export type TabsProps = ViewProps & {
  tabs: TabConfig[]
  children?: ReactNode
  initialTab?: string
  value?: string
  variant?: TabVariant
  size?: TabSize
  onValueChange?: (value: string) => void
  // margin around the tab row, for tabs that inset from a surface edge
  insetTabs?: SpaceTokens
  tabsContainerProps?: XStackProps
  // keep every tab's content mounted on web (see AlwaysVisibleTabsContent)
  alwaysVisibleContent?: boolean
  // size the content to what it holds rather than filling the parent; use it
  // where the tabs sit inside an auto-height surface such as an adapted sheet
  fitContent?: boolean
}

function TabsComponent({
  tabs,
  children,
  initialTab,
  value: valueProp,
  variant = 'default',
  size = 'medium',
  onValueChange,
  insetTabs,
  tabsContainerProps,
  alwaysVisibleContent,
  fitContent = false,
  ...rest
}: TabsProps) {
  const isControlled = valueProp !== undefined
  const [internalSelected, setInternalSelected] = useState(initialTab ?? valueProp ?? '')
  const selected = isControlled ? valueProp : internalSelected

  const [tabState, setTabState] = useState<{
    intentAt: TabLayout | null
    activeAt: TabLayout | null
  }>({ intentAt: null, activeAt: null })

  const setIntentIndicator = (intentAt: TabLayout | null) =>
    setTabState((prev) => ({ ...prev, intentAt }))

  const setActiveIndicator = (activeAt: TabLayout | null) =>
    setTabState((prev) => ({ ...prev, activeAt }))

  const { activeAt, intentAt } = tabState

  // layouts reported by onInteraction, in pre-transform dimensions
  const tabLayouts = useRef<Record<string, TabLayout>>({})

  // one stable callback per tab value, so a tab's memo survives a hover
  const interactionCallbacks = useRef<Record<string, TabsTabProps['onInteraction']>>({})

  const getOnInteraction = useCallback((tabValue: string) => {
    interactionCallbacks.current[tabValue] ||= (type, layout) => {
      if (!layout) return
      tabLayouts.current[tabValue] = layout
      if (type === 'select') setActiveIndicator(layout)
      else if (type === 'hover') setIntentIndicator(layout)
    }
    return interactionCallbacks.current[tabValue]
  }, [])

  // a selection made anywhere but a click still moves the active indicator
  useEffect(() => {
    const layout = tabLayouts.current[selected]
    if (layout) setActiveIndicator(layout)
  }, [selected])

  const isUnderline = variant === 'underline'
  const fitProps: ViewProps = fitContent ? { grow: 0, flexBasis: 'auto' } : { grow: 1 }

  return (
    <TabsAlwaysVisibleContext.Provider value={!!alwaysVisibleContent}>
      <TabsSelectedContext.Provider value={selected}>
        <TamaguiTabs
          activationMode="manual"
          orientation="horizontal"
          value={selected}
          onValueChange={(value) => {
            onValueChange?.(value)
            if (!isControlled) setInternalSelected(value)
          }}
          {...(alwaysVisibleContent ? fitProps : { flex: 1 })}
          {...rest}
        >
          <YStack
            {...(alwaysVisibleContent ? fitProps : { h: '100%' })}
            {...tabsContainerProps}
          >
            <YStack
              z={isUnderline ? undefined : 100}
              mb={isUnderline || !children ? 0 : size === 'small' ? 7 : 18}
            >
              <XStack m={insetTabs}>
                <XStack
                  flex={1}
                  position="relative"
                  onMouseLeave={() => setIntentIndicator(null)}
                >
                  <AnimatePresence initial={false}>
                    {intentAt && (
                      <TabIndicator
                        key="intent"
                        w={intentAt.width}
                        // an explicit prop outranks a variant, so the rule's
                        // height comes from here rather than its variant
                        h={isUnderline ? UNDERLINE_HEIGHT : intentAt.height}
                        x={intentAt.x}
                        y={intentAt.y}
                        underline={isUnderline}
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    {activeAt && (
                      <TabIndicator
                        key="active"
                        w={activeAt.width}
                        // an explicit prop outranks a variant, so the rule's
                        // height comes from here rather than its variant
                        h={isUnderline ? UNDERLINE_HEIGHT : activeAt.height}
                        x={activeAt.x}
                        y={activeAt.y}
                        underline={isUnderline}
                        active
                      />
                    )}
                  </AnimatePresence>

                  <TamaguiTabs.List
                    flex={1}
                    gap={7}
                    {...(isUnderline && { unstyled: true, gap: '1' })}
                    loop={false}
                    aria-label="tabs"
                  >
                    {tabs.map((tab) => (
                      <Tab
                        key={tab.value}
                        Icon={tab.Icon}
                        active={selected === tab.value}
                        label={tab.label}
                        onInteraction={getOnInteraction(tab.value)}
                        value={tab.value}
                        variant={variant}
                        size={size}
                      />
                    ))}
                  </TamaguiTabs.List>
                </XStack>
              </XStack>
            </YStack>

            {alwaysVisibleContent ? (
              <AlwaysVisibleTabsContent fitContent={fitContent}>
                {children}
              </AlwaysVisibleTabsContent>
            ) : (
              children
            )}
          </YStack>
        </TamaguiTabs>
      </TabsSelectedContext.Provider>
    </TabsAlwaysVisibleContext.Provider>
  )
}

const tabRadius: RadiusTokens = '4'
const UNDERLINE_HEIGHT = 3

const tabSizings: Record<TabSize, ViewProps> = {
  small: { px: '2', py: '0-5' },
  medium: { px: '3', py: '0-5' },
  large: { px: '5', py: '2' },
}

const tabTextSizings: Record<TabSize, SizableTextProps> = {
  small: { size: '1' },
  medium: { size: '2' },
  large: { size: '3' },
}

const Tab = memo(function Tab({
  label,
  value,
  onInteraction,
  active,
  Icon,
  variant,
  size,
}: {
  label: string
  value: string
  onInteraction: TabsTabProps['onInteraction']
  active?: boolean
  Icon?: IconComponent
  variant: TabVariant
  size: TabSize
}) {
  const isUnderline = variant === 'underline'
  const color = isUnderline
    ? active
      ? 'color'
      : 'placeholder-color'
    : active
      ? 'background'
      : 'color'

  return (
    <TamaguiTabs.Tab
      unstyled
      bg="transparent"
      borderWidth={0}
      cursor="pointer"
      {...(isWeb
        ? { onInteraction }
        : { accessible: true, accessibilityLabel: label, accessibilityRole: 'tab' })}
      outlineWidth="focus-visible:1px"
      outlineStyle="focus-visible:solid"
      outlineColor="focus-visible:outline-color"
      {...(isUnderline
        ? { p: 0, height: 'auto' }
        : {
            pl: '2',
            pr: '2-5',
            py: '1',
            gap: '1-5',
            flex: 1,
            rounded: tabRadius,
            ...(!isWeb && active && { bg: 'color' }),
            opacity: 'press:0.5',
          })}
      tabIndex={0}
      value={value}
      aria-label={label}
    >
      <XStack gap="1" items="center" justify="center" {...tabSizings[size]}>
        {!!Icon && <Icon color={color} size={16} opacity={0.75} />}
        <SizableText
          fontFamily="mono"
          z={10}
          {...tabTextSizings[size]}
          color={color}
          fontWeight={isUnderline ? '600' : '500'}
          select="none"
        >
          {label}
        </SizableText>
      </XStack>
    </TamaguiTabs.Tab>
  )
})

// the hover and active marks under the tabs: a pill behind the label, or a
// rule under it. the active mark takes the label color at full strength.
const TabIndicator = styled(YStack, {
  position: 'absolute',
  pointerEvents: 'none',
  transition: animationClamped('quickerLessBouncy'),
  bg: 'background-press',
  opacity: '0.7 enter:0 exit:0',
  rounded: tabRadius,

  variants: {
    underline: {
      true: {
        bg: 'placeholder-color',
        opacity: '0.5 enter:0 exit:0',
        rounded: 0,
        b: 0,
        borderTopLeftRadius: UNDERLINE_HEIGHT,
        borderTopRightRadius: UNDERLINE_HEIGHT,
      },
    },
    active: {
      true: { bg: 'color', opacity: 1 },
    },
  } as const,
})

// web keeps every tab's subtree mounted so scroll position, focus, and
// component state survive a switch; the inactive panes leave the flow so the
// visible one still sizes this container. native mounts only the active pane,
// where an offscreen tree costs more than the state it preserves.
function AlwaysVisibleTabsContent({
  children,
  fitContent,
}: {
  children: ReactNode
  fitContent: boolean
}) {
  return (
    <YStack
      width="100%"
      position="relative"
      {...(fitContent ? { grow: 0, flexBasis: 'auto' } : { flex: 1, minH: 0 })}
    >
      {children}
    </YStack>
  )
}

type TabsContentProps = ComponentProps<typeof TamaguiTabs.Content>

const TabsContent = memo(function TabsContent({
  value,
  children,
  ...props
}: TabsContentProps) {
  const selected = use(TabsSelectedContext)
  const alwaysVisible = use(TabsAlwaysVisibleContext)
  const isActive = selected === value

  if (!alwaysVisible) {
    return (
      <TamaguiTabs.Content value={value} {...props}>
        {children}
      </TamaguiTabs.Content>
    )
  }

  if (!isWeb && !isActive) return null

  return (
    <TamaguiTabs.Content
      forceMount
      value={value}
      contain="layout"
      opacity={isActive ? 1 : 0}
      pointerEvents={isActive ? 'auto' : 'none'}
      {...(isActive ? null : { position: 'absolute', inset: 0 })}
      {...props}
    >
      {children}
    </TamaguiTabs.Content>
  )
})

export const Tabs = withStaticProperties(TabsComponent, {
  Content: TabsContent,
})

// a plain text tab for rows that carry no indicator, such as a segmented filter
// inside a toolbar
export const SimpleTab = styled(Text, {
  fontFamily: 'mono',
  cursor: 'pointer',
  color: 'placeholder-color hover:color',
  select: 'none',
  rounded: '2',
  flex: 1,
  text: 'center',
  bg: 'hover:background-hover',
  variants: {
    isActive: {
      true: {
        color: 'color',
      },
    },

    size: {
      small: {
        fontSize: '1',
        px: '1',
        py: 'px',
      },
      medium: {
        fontSize: '2',
        px: 7,
        py: '0-5',
      },
      large: {
        fontSize: '3',
        px: '2-5',
        py: '1',
      },
    },
  } as const,
  defaultVariants: {
    size: 'small',
  },
})
