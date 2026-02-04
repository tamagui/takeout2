// import { memo } from 'react'
// import { SizableText, View, YStack } from 'tamagui'

// import { useUnreadNotificationCount } from '~/features/notification/useNotifications'
// import { BellIcon } from '~/interface/icons/phosphor/BellIcon'

// type NotificationBellProps = {
//   size?: number
//   onPress?: () => void
// }

// export const NotificationBell = memo(({ size = 24, onPress }: NotificationBellProps) => {
//   const unreadCount = useUnreadNotificationCount()
//   const showBadge = unreadCount > 0
//   const displayCount = unreadCount > 99 ? '99+' : unreadCount

//   return (
//     <YStack
//       position="relative"
//       cursor="pointer"
//       hoverStyle={{ opacity: 0.8 }}
//       pressStyle={{ opacity: 0.6 }}
//       onPress={onPress}
//     >
//       <BellIcon size={size} />
//       {showBadge && (
//         <View
//           position="absolute"
//           t={-4}
//           r={-6}
//           width={16}
//           height={16}
//           rounded="$10"
//           bg="$red10"
//           items="center"
//           justify="center"
//         >
//           <SizableText size="$1" color="white" fontWeight="700">
//             {displayCount}
//           </SizableText>
//         </View>
//       )}
//     </YStack>
//   )
// })
