import { BlurView } from 'expo-blur'
import { XStack, YStack, Text, SizableText } from 'tamagui'
import { Settings } from '@tamagui/lucide-icons'
import { Button, ContextMenu } from '@expo/ui/swift-ui'
import { ButtonGlassCircle } from '~/interface/buttons/ButtonGlassCircle'
import { isIos } from '@vxrn/helpers'
import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface HeaderBlurProps {
  title: string
  subtitle?: string
  leftContent?: ReactNode
  showSettings?: boolean
  onSettingsPress?: () => void
}

// channel settings button component
const ChannelSettingsButton = ({ onPress }: { onPress?: () => void }) => {
  if (!isIos) {
    // android fallback - simple button
    return (
      <ButtonGlassCircle onPress={onPress} size={32} borderRadius={16}>
        <Settings size={16} color="$color11" strokeWidth={2} />
      </ButtonGlassCircle>
    )
  }

  return (
    <ContextMenu>
      <ContextMenu.Items>
        <Button
          systemImage="bell"
          onPress={() => {
            // TODO: Implement notification settings
          }}
        >
          Notification Settings
        </Button>
        <Button
          systemImage="pin"
          onPress={() => {
            // TODO: Implement pinned messages
          }}
        >
          Pinned Messages
        </Button>
        <Button
          systemImage="person.2"
          onPress={() => {
            // TODO: Implement member list
          }}
        >
          View Members
        </Button>
        <Button
          systemImage="magnifyingglass"
          onPress={() => {
            // TODO: Implement search in channel
          }}
        >
          Search in Channel
        </Button>
        <Button systemImage="gearshape" onPress={onPress}>
          Channel Settings
        </Button>
        <Button
          systemImage="door.left.hand.open"
          onPress={() => {
            // TODO: Implement leave channel
          }}
        >
          Leave Channel
        </Button>
      </ContextMenu.Items>
      <ContextMenu.Trigger>
        <ButtonGlassCircle size={32} borderRadius={16}>
          <Settings size={16} color="$color" strokeWidth={2} />
        </ButtonGlassCircle>
      </ContextMenu.Trigger>
    </ContextMenu>
  )
}

export function HeaderBlur({
  title,
  subtitle,
  leftContent,
  showSettings = true,
  onSettingsPress,
}: HeaderBlurProps) {
  const { top } = useSafeAreaInsets()
  const headerContent = (
    <XStack
      px="$2"
      py="$1"
      mx="$2.5"
      items="center"
      justify="space-between"
      // bg="$background"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$10"
    >
      {leftContent}
      <YStack flex={1} items="center" justify="center">
        <SizableText color="$color12" fontFamily="$mono" fontWeight="bold">
          {title}
        </SizableText>
        {subtitle && (
          <SizableText color="$color11" mt="$0.5">
            {subtitle}
          </SizableText>
        )}
      </YStack>
      {showSettings && <ChannelSettingsButton onPress={onSettingsPress} />}
    </XStack>
  )

  if (!isIos) {
    // android fallback with regular view
    return (
      <YStack bg="$background" borderBottomWidth={0.5} borderBottomColor="$borderColor">
        {headerContent}
      </YStack>
    )
  }

  // ios with blur view
  return (
    <BlurView intensity={60} style={{ marginTop: top, borderRadius: 30 }}>
      {headerContent}
    </BlurView>
  )
}
