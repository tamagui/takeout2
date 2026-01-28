import { getClipboardText } from '@take-out/helpers'
import { memo, useEffect, useRef, useState } from 'react'
import {
  SizableText,
  Input as TamaguiInput,
  useWindowDimensions,
  View,
  XStack,
  YStack,
  type InputProps,
} from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { ClipboardIcon } from '~/interface/icons/phosphor/ClipboardIcon'

import type { Input } from '~/interface/forms/Input'

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
  const { width: windowWidth } = useWindowDimensions()
  const width = Math.min(340, windowWidth)

  const inputRef = useRef<Array<Input>>([])

  const [focus, setFocus] = useState<number>(defaultValue?.length === otpCount ? -1 : 0)

  const [otpValue, setOtpValue] = useState<string[]>(() => {
    if (defaultValue) {
      const values = defaultValue.split('').slice(0, otpCount)
      return [...values, ...Array(otpCount - values.length).fill('')]
    }
    return Array(otpCount).fill('')
  })

  const inputWidth = (width - 58) / otpCount

  const handlePasteValue = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, otpCount)
    const newOtpValue = Array(otpCount).fill('')
    for (let i = 0; i < digits.length; i++) {
      newOtpValue[i] = digits[i] ?? ''
    }
    setOtpValue(newOtpValue)

    if (digits.length >= otpCount) {
      setFocus(-1)
      inputRef.current[otpCount - 1]?.blur()
    } else {
      const nextIndex = Math.min(digits.length, otpCount - 1)
      setFocus(nextIndex)
      inputRef.current[nextIndex]?.focus()
    }
  }

  const onFocusNext = (value: string, index: number) => {
    if (value.length > 1) {
      handlePasteValue(value)
      return
    }

    const newOtpValue = [...otpValue]
    newOtpValue[index] = value
    setOtpValue(newOtpValue)

    if (index < otpCount - 1 && value) {
      inputRef.current[index + 1]?.focus()
      setFocus(index + 1)
    } else if (index === otpCount - 1) {
      setFocus(-1)
      inputRef.current[index]?.blur()
    }
  }

  const onFocusPrevious = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (index !== 0) {
        inputRef.current[index - 1]?.focus()
        setFocus(index - 1)
        const newOtpValue = [...otpValue]
        newOtpValue[index - 1] = ''
        setOtpValue(newOtpValue)
      } else {
        const newOtpValue = [...otpValue]
        newOtpValue[0] = ''
        setOtpValue(newOtpValue)
      }
    }
  }

  const handlePaste = async () => {
    const text = await getClipboardText()
    if (text) {
      handlePasteValue(text)
    }
  }

  const codeString = otpValue.join('')
  const isFilled = codeString.length === otpCount

  useEffect(() => {
    onCodeChanged?.(codeString)
    if (isFilled) {
      onCodeFilled?.(codeString)
    }
  }, [onCodeChanged, onCodeFilled, codeString, isFilled])

  return (
    <YStack gap="$3">
      <XStack gap={8}>
        {Array(otpCount)
          .fill(null)
          .map((_, i) => {
            const isFocused = focus === i

            return (
              <View key={i} position="relative">
                <TamaguiInput
                  testID={testId ? `${testId}-${i}` : undefined}
                  width={inputWidth}
                  height={inputWidth}
                  rounded={12}
                  type="number"
                  ref={(ref) => {
                    if (ref) inputRef.current[i] = ref
                  }}
                  fontSize="$5"
                  value={otpValue[i]}
                  onChange={(e) => onFocusNext((e.target as HTMLInputElement).value, i)}
                  onKeyDown={(e) => onFocusPrevious(e.nativeEvent.key, i)}
                  autoComplete="one-time-code"
                  autoFocus={autoFocus && i === 0}
                  {...(inputProps as any)}
                />
                <View
                  position="absolute"
                  inset={0}
                  items="center"
                  justify="center"
                  width={inputWidth}
                  height={inputWidth}
                  bg="$color2"
                  borderWidth={1}
                  borderColor="$color4"
                  rounded={12}
                  pointerEvents="none"
                >
                  {otpValue[i] !== '' && (
                    <SizableText fontWeight="500" fontSize={18} position="absolute">
                      {otpValue[i]}
                    </SizableText>
                  )}
                </View>
              </View>
            )
          })}
      </XStack>

      <Button
        variant="transparent"
        size="small"
        onPress={handlePaste}
        self="center"
        icon={ClipboardIcon}
        {...(isFilled && {
          opacity: 0,
          disabled: true,
        })}
      >
        <Button.Text color="$color9">Paste code</Button.Text>
      </Button>
    </YStack>
  )
})
