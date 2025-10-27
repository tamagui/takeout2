import { Tabs } from 'one'
import { Platform, Pressable } from 'react-native'
import { CreateSheet } from '~/features/main-tabs/CreateSheet'
import { CreateTabIcon } from '~/features/main-tabs/CreateTabIcon'
import { ProfileTabIcon } from '~/features/main-tabs/ProfileTabIcon'
import { scrollToTopEmitter } from '~/features/main-tabs/scrollToTopEmitter'
import { useTabIconSize } from '~/features/main-tabs/useTabIconSize'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { PostActionSheet } from '~/interface/sheet/PostActionSheet'
// import { PostOwnerActionSheet } from '~/interface/sheet/PostOwnerActionSheet'
import { postActionSheetRef } from '~/interface/sheet/postActionSheetHelper'
import { HapticTab } from '~/interface/tabs/HapticTab'
import { TabBarBackground } from '~/interface/tabs/TabBarBackground'

export default function TabsLayout() {
  const { smallerIconSize } = useTabIconSize()

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#B4B4B4',
          headerShown: false,
          // @ts-expect-error its ok
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarShowLabel: false,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              borderTopWidth: 0.5,
              borderTopColor: 'rgba(255,255,255,0.2)',
              borderTopStyle: 'solid',
            },
            default: {},
          }),
          tabBarIconStyle: {
            marginTop: 10,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarButton: (props: any) => (
              <Pressable
                {...props}
                onPressOut={() => {
                  scrollToTopEmitter.emit('home')
                }}
              />
            ),
            tabBarIcon: ({ color }: { color: string }) => (
              <HouseIcon size={smallerIconSize} fill={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            tabBarButton: () => <CreateTabIcon />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: () => <ProfileTabIcon />,
          }}
        />
      </Tabs>
      <PostActionSheet ref={postActionSheetRef} />
      {/* <PostOwnerActionSheet ref={postOwnerActionSheetRef} /> */}
      <CreateSheet />
    </>
  )
}
