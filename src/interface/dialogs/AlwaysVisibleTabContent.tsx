import { use } from 'react'
import { Tabs, YStack, type YStackProps } from 'tamagui'
import { TabScrollView } from '~/features/topbar/TabScrollView'
import { PaneFooter } from '~/features/topbar/TopBarPane'
import { createGlobalContext } from '@vxrn/helpers'
import type { TabContentPaneProps } from './types'

const ActiveContext = createGlobalContext('dialog/always-visible-tab-content', false)

export const AlwaysVisibleTabContent = ({
  active,
  scrollable,
  outsideScrollable,
  footer,
  children,
  ...props
}: Omit<TabContentPaneProps, 'setShow'> & {
  scrollable?: boolean
  outsideScrollable?: any
  footer?: any
}) => {
  return (
    <ActiveContext.Provider value={active === props.value}>
      <Tabs.Content
        forceMount
        position="absolute"
        data-tauri-drag-region
        t={0}
        l={0}
        r={0}
        b={0}
        contain="layout"
        tabIndex="unset"
        opacity={0}
        pointerEvents="none"
        className={active === props.value ? '' : 'disable-all-pointer-events'}
        {...(active === props.value && {
          opacity: 1,
          pointerEvents: undefined,
        })}
        {...(props as any)}
      >
        {scrollable ? <TabScrollView>{children}</TabScrollView> : children}

        {outsideScrollable}

        {!!footer && <PaneFooter>{footer}</PaneFooter>}
      </Tabs.Content>
    </ActiveContext.Provider>
  )
}

export const AlwaysVisibleTabContainer = (props: YStackProps) => {
  return (
    <YStack data-tauri-drag-region width="100%" flex={1} position="relative" {...props} />
  )
}

export const useIsSubTabActive = () => {
  return use(ActiveContext)
}
