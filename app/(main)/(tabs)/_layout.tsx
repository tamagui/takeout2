import { Platform } from 'react-native'
import { CreateTabIcon } from '~/features/main-tabs/CreateTabIcon'
import { ProfileTabIcon } from '~/features/main-tabs/ProfileTabIcon'
import { useTabIconSize } from '~/features/main-tabs/useTabIconSize'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
// import { PostOwnerActionSheet } from '~/interface/sheet/PostOwnerActionSheet'

import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
import { withLayoutContext } from 'one'
import { CreateSheet } from '~/features/main-tabs/CreateSheet'
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
      </NativeTabs>
      <PostActionSheet ref={postActionSheetRef} />
      <CreateSheet />
    </>
  )
}
