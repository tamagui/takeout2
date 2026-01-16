// web version - minimal static header
import { memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, View, XStack } from 'tamagui'

import { BellIcon } from '~/interface/icons/phosphor/BellIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

import { Pressable } from '../buttons/Pressable'

const HEADER_HEIGHT = 44

interface AnimatedHomeHeaderProps {
  scrollY?: { value: number }
}

export const AnimatedHomeHeader = memo(
  ({ scrollY: _unused }: AnimatedHomeHeaderProps) => {
    const insets = useSafeAreaInsets()
    const totalHeaderHeight = HEADER_HEIGHT + insets.top

    return (
      <View
        position="absolute"
        t={0}
        l={0}
        r={0}
        z={999}
        pt={insets.top}
        height={totalHeaderHeight}
        bg="$background"
        style={{
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
        }}
      >
        <XStack flex={1} items="center" justify="space-between" px="$3" pb="$2">
          <Pressable width={40} height={40} items="center" justify="center">
            <PlusIcon size={24} color="$color" />
          </Pressable>

          <SizableText fontSize="$6" fontWeight="700" color="$color">
            Takeout
          </SizableText>

          <Pressable width={40} height={40} items="center" justify="center">
            <BellIcon size={22} color="$color" />
          </Pressable>
        </XStack>
      </View>
    )
  }
)
