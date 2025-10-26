import { Button } from 'react-native'
import { useTheme, YStack } from 'tamagui'

interface ForwardButtonProps {
  title: string
  onPress?: () => void
  disabled?: boolean
}

export const ForwardButton = ({ title, onPress, disabled }: ForwardButtonProps) => {
  const theme = useTheme()

  return (
    <YStack opacity={disabled ? 0.5 : 1}>
      <Button
        title={title}
        onPress={onPress}
        color={disabled ? theme.color8.val : theme.color11.val}
        disabled={disabled}
      />
    </YStack>
  )
}
