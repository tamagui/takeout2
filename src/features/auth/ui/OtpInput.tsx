import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Input,
  type InputProps,
  SizableText,
  useTheme,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from 'tamagui'

import { getClipboardText } from '~/helpers/clipboard'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ClipboardIcon } from '~/interface/icons/phosphor/ClipboardIcon'

export interface IOtpInput {
  otpCount?: number
  onCodeFilled?: (code: string) => void
  onCodeChanged?: (code: string) => void
  isError?: boolean
  defaultValue?: string
  autoFocus?: boolean
  'data-testid'?: string
  inputProps?: InputProps
}

export const OtpInput = memo(function OtpInput({
  otpCount = 6,
  onCodeFilled,
  onCodeChanged,
  isError = false,
  defaultValue = '',
  autoFocus = false,
  'data-testid': testId,
  inputProps,
}: IOtpInput) {
  const { color, color2, color3, color02, red10 } = useTheme()
  const { width: windowWidth } = useWindowDimensions()
  const width = Math.min(340, windowWidth)

  const hiddenInputRef = useRef<Input>(null)

  const [code, setCode] = useState<string>(() => {
    if (defaultValue) {
      return defaultValue.replace(/\D/g, '').slice(0, otpCount)
    }
    return ''
  })

  const inputWidth = (width - 58) / otpCount

  const handleChangeText = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, otpCount)
      setCode(digits)
    },
    [otpCount]
  )

  const handlePaste = async () => {
    const text = await getClipboardText()
    if (text) {
      handleChangeText(text)
    }
  }

  const handleBoxPress = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

  const isFilled = code.length === otpCount

  useEffect(() => {
    onCodeChanged?.(code)
    if (code.length === otpCount) {
      onCodeFilled?.(code)
    }
  }, [onCodeChanged, onCodeFilled, code, otpCount])

  // split code into individual digits for display
  const digits = code.split('')

  return (
    <YStack gap="$3">
      {/* hidden input that captures all keyboard input */}
      <Input
        ref={hiddenInputRef}
        testID={testId}
        position="absolute"
        opacity={0}
        width={1}
        height={1}
        keyboardType="number-pad"
        value={code}
        onChangeText={handleChangeText}
        textContentType="oneTimeCode"
        autoFocus={autoFocus}
        maxLength={otpCount}
        {...inputProps}
      />

      <XStack gap={8} onPress={handleBoxPress}>
        {Array(otpCount)
          .fill(null)
          .map((_, i) => {
            const digit = digits[i] ?? ''
            const isFocused = code.length === i
            const borderColor = isError
              ? red10.val
              : isFocused
                ? color02.val
                : 'transparent'

            return (
              <View key={i} position="relative" onPress={handleBoxPress} cursor="pointer">
                <View
                  width={inputWidth}
                  height={inputWidth}
                  items="center"
                  justify="center"
                  bg={color2}
                  rounded={12}
                  borderColor={borderColor as any}
                  borderWidth={isFocused ? 2 : 1}
                  style={!isFocused ? { borderColor: color3.val } : undefined}
                >
                  {digit !== '' && (
                    <SizableText fontWeight="500" fontSize={18} color={color as any}>
                      {digit}
                    </SizableText>
                  )}
                </View>
              </View>
            )
          })}
      </XStack>

      <ButtonSimple
        variant="transparent"
        size="small"
        onPress={handlePaste}
        icon={ClipboardIcon}
        {...(isFilled && {
          opacity: 0,
          disabled: true,
        })}
      >
        <ButtonSimple.Text color="$color9">Paste code</ButtonSimple.Text>
      </ButtonSimple>
    </YStack>
  )
})
