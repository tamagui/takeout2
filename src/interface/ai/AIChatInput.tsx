import { memo, useState } from 'react'
import { Spinner, styled, View, XStack } from 'tamagui'

import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'

import { Input } from '../forms/Input'

interface AIChatInputProps {
  onSend?: (message: string, imageUri?: string) => void
  onPlusPress?: () => void
  onMicPress?: () => void
  selectedImage?: string | null
  onRemoveImage?: () => void
  isLoading?: boolean
}

const SendButton = styled(View, {
  width: 48,
  height: 48,
  rounded: '$10',
  items: 'center',
  justify: 'center',
  cursor: 'pointer',
  transition: '200ms',

  variants: {
    active: {
      true: {
        bg: '$blue9',
        scale: 1,
        opacity: 1,
      },
      false: {
        bg: '$color4',
        scale: 0.9,
        opacity: 0.5,
      },
    },
  } as const,
})

// hoisted static styles (rendering-hoist-jsx)
const activeHoverStyle = { scale: 1.05 }
const activePressStyle = { scale: 0.95 }
const emptyStyle = {}

export const AIChatInput = memo(({ onSend, isLoading }: AIChatInputProps) => {
  const [message, setMessage] = useState('')

  const hasContent = message.trim().length > 0
  const canSend = hasContent && !isLoading

  const handleSend = () => {
    if (!canSend) return
    onSend?.(message.trim())
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <XStack gap="$2" items="center">
      <Input
        flex={1}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <SendButton
        active={canSend}
        onPress={handleSend}
        hoverStyle={canSend ? activeHoverStyle : emptyStyle}
        pressStyle={canSend ? activePressStyle : emptyStyle}
      >
        {isLoading ? (
          <Spinner size="small" color="$color11" />
        ) : (
          <ArrowUpIcon size={24} color={canSend ? 'white' : '$color10'} />
        )}
      </SendButton>
    </XStack>
  )
})
