import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useEmitter } from '@take-out/helpers'
import { withLayoutContext } from 'one'
import { useCallback } from 'react'
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated'

import { TabBar } from '~/features/app/TabBar'
import { FeedDropdown } from '~/interface/headers/FeedDropdown'
import { feedDropdownEmitter } from '~/interface/headers/feedDropdownEmitter'

const Tab = createBottomTabNavigator()
const Tabs = withLayoutContext(Tab.Navigator)

const ANIMATION_DURATION = 300

export function TabsLayout() {
  const dropdownOpen = useSharedValue(0)

  useEmitter(feedDropdownEmitter, (open) => {
    dropdownOpen.value = withTiming(open ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  })

  const handleDropdownClose = useCallback(() => {
    feedDropdownEmitter.emit(false)
  }, [])

  return (
    <>
      <Tabs
        initialRouteName="feed"
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="ai" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <FeedDropdown isOpen={dropdownOpen} onClose={handleDropdownClose} />
    </>
  )
}
