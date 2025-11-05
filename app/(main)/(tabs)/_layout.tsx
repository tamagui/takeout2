import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
import { withLayoutContext } from 'one'
import { Platform } from 'react-native'
import { CreateTabIcon } from '~/features/main-tabs/CreateTabIcon'
import { ProfileTabIcon } from '~/features/main-tabs/ProfileTabIcon'
import { useTabIconSize } from '~/features/main-tabs/useTabIconSize'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'
import { PostActionSheet } from '~/interface/sheet/PostActionSheet'
import { postActionSheetRef } from '~/interface/sheet/postActionSheetHelper'

const NativeTabsNavigator = createNativeBottomTabNavigator().Navigator

export const NativeTabs = withLayoutContext(NativeTabsNavigator)

export default function TabsLayout() {
  const { smallerIconSize } = useTabIconSize()

  return (
    <>
      <NativeTabs
        hapticFeedbackEnabled
        labeled={false}
        scrollEdgeAppearance="opaque"
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
                android: <HouseIcon size={smallerIconSize} fill={color} />,
              }),
          }}
        />

        <NativeTabs.Screen
          name="plus"
          options={{
            tabBarIcon: () =>
              Platform.select({
                ios: { sfSymbol: 'plus' } as any,
                android: <CreateTabIcon />,
              }),
          }}
        />
        <NativeTabs.Screen
          name="profile"
          options={{
            tabBarIcon: () =>
              Platform.select({
                ios: { sfSymbol: 'person' } as any,
                android: <ProfileTabIcon />,
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
                android: <MagnifyingGlassIcon />,
              }),
          }}
        />
      </NativeTabs>

      <PostActionSheet ref={postActionSheetRef} />
    </>
  )
}
