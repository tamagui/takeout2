import { memo, useState } from 'react'
import { YStack } from 'tamagui'
import { DevToolsActions } from '~/features/devtools/DevToolsActions'
import { DevToolsApps } from '~/features/devtools/DevToolsApps'
import { AlwaysVisibleTabContent } from '~/interface/dialogs/AlwaysVisibleTabContent'
import { Tabs } from '~/interface/tabs/Tabs'
import { TabScrollView } from '../topbar/TabScrollView'
import { TopBarContentPane } from '../topbar/TopBarContentPane'
import { DevToolsSearch } from './DevToolsSearch'
import { DevToolsSimulate } from '~/features/devtools/DevToolsSimulate'
import { SidecarDebugPanel } from '~/features/sidecar/SidecarDebugPanel'
import { isTauri } from '@vxrn/helpers'
import { Code } from '@tamagui/lucide-icons'
import { useUser } from '~/features/user/useUser'
import type { ButtonSimpleProps } from '~/interface/buttons/ButtonSimple'
import { TopBarButton } from '../topbar/TopBarButton'
import { TopBarSlidingPopover } from '../topbar/TopBarSlidingPopover'
import { DevToolsZero } from './DevToolsZero'

export const TopBarDevToolsButton = (props: ButtonSimpleProps) => {
  const { isAdmin, user } = useUser()

  if (process.env.NODE_ENV !== 'development') {
    if (!isAdmin) {
      return (
        <span data-test-id="not-admin" style={{ display: 'none' }}>
          {JSON.stringify(JSON.stringify(user || null, null, 2))}
        </span>
      )
    }
  }

  return (
    <TopBarSlidingPopover.Target id="devtools">
      <TopBarButton
        data-testid="devtools-button"
        size={isTauri ? 'small' : 'medium'}
        icon={Code}
        {...props}
        variant="transparent"
      />
    </TopBarSlidingPopover.Target>
  )
}

type Tab = 'actions' | 'search' | 'simulate' | 'sidecar' | 'apps' | 'zero'

export const TopBarDevToolsPane = memo(() => {
  const [tab, setTab] = useState<Tab>('actions')

  const tabs = [
    { label: 'Actions', value: 'actions' },
    { label: 'Zero', value: 'zero' },
    { label: 'Simulate', value: 'simulate' },
    { label: 'Search', value: 'search' },
    { label: 'Apps', value: 'apps' },
  ]

  if (isTauri) {
    tabs.push({ label: 'Sidecar', value: 'sidecar' })
  }

  return (
    <TopBarContentPane id="devtools">
      <YStack p="$4" flex={1}>
        <Tabs
          initialTab={tab}
          onValueChange={(x) => setTab(x as any)}
          tabs={tabs}
          // @ts-ignore
          z={10000}
        >
          <YStack flex={1} position="relative">
            <AlwaysVisibleTabContent active={tab} value="actions">
              <TabScrollView>
                <DevToolsActions />
              </TabScrollView>
            </AlwaysVisibleTabContent>

            <AlwaysVisibleTabContent active={tab} value="zero">
              <TabScrollView>
                <DevToolsZero />
              </TabScrollView>
            </AlwaysVisibleTabContent>

            <AlwaysVisibleTabContent active={tab} value="simulate">
              <TabScrollView>
                <DevToolsSimulate />
              </TabScrollView>
            </AlwaysVisibleTabContent>

            <AlwaysVisibleTabContent flex={1} active={tab} value="search">
              <DevToolsSearch open={tab === 'search'} />
            </AlwaysVisibleTabContent>

            <AlwaysVisibleTabContent active={tab} value="apps">
              <TabScrollView>
                <DevToolsApps isActive={tab === 'apps'} />
              </TabScrollView>
            </AlwaysVisibleTabContent>

            {isTauri && (
              <AlwaysVisibleTabContent active={tab} value="sidecar">
                <TabScrollView>
                  <SidecarDebugPanel />
                </TabScrollView>
              </AlwaysVisibleTabContent>
            )}
          </YStack>
        </Tabs>
      </YStack>
    </TopBarContentPane>
  )
})
