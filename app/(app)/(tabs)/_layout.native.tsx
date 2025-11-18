import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
import { withLayoutContext } from 'one'
import { Platform } from 'react-native'

const NativeTabsNavigator = createNativeBottomTabNavigator().Navigator
const NativeTabs = withLayoutContext(NativeTabsNavigator)

export function TabsLayout() {
  return (
    <NativeTabs
      hapticFeedbackEnabled
      labeled={false}
      scrollEdgeAppearance="opaque"
      minimizeBehavior="onScrollDown"
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
      }}
    >
      <NativeTabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }: { color: string }) =>
            Platform.select({
              ios: { sfSymbol: 'house' } as any,
              android: require('../../../public/icons/house.png'),
            }),
        }}
      />

      <NativeTabs.Screen
        name="plus"
        options={{
          tabBarIcon: () =>
            Platform.select({
              ios: { sfSymbol: 'plus' } as any,
              android: require('../../../public/icons/plus.png'),
            }),
        }}
      />
      <NativeTabs.Screen
        name="profile"
        options={{
          tabBarIcon: () =>
            Platform.select({
              ios: { sfSymbol: 'person' } as any,
              android: require('../../../public/icons/user-round.png'),
            }),
        }}
      />
      <NativeTabs.Screen
        name="search"
        options={{
          role: 'search',
          tabBarIcon: () =>
            Platform.select({
              ios: { sfSymbol: 'magnifyingglass' } as any,
              android: require('../../../public/icons/search.png'),
            }),
        }}
      />
    </NativeTabs>
  )
}
