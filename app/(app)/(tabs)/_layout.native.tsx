import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { withLayoutContext } from 'one'

import { TabBar } from '~/interface/navigation/TabBar'

const Tab = createBottomTabNavigator()
const Tabs = withLayoutContext(Tab.Navigator)

export function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
