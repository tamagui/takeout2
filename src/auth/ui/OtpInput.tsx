import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native'
import { Clipboard, Pressable, StyleSheet, TextInput } from 'react-native'
import Animated, {
  FadeInDown,
  FadeOut,
  type LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SizableText, useTheme, useWindowDimensions, View, XStack, YStack } from 'tamagui'

export interface IOtpInput {
  /**
   * Digits of pins in the OTP
   */
  otpCount: number
  /**
   * Style of the container
   */
  containerStyle?: StyleProp<ViewStyle>
  /**
   * Style of the input container
   */
  inputContainerStyle?: StyleProp<ViewStyle>
  /**
   * Style of the input fields
   */
  inputStyle?: StyleProp<TextStyle>
  /**
   * Style of the input mask
   */
  inputMaskStyle?: StyleProp<ViewStyle>
  /**
   * Style of text for input fields
   */
  textStyle?: StyleProp<TextStyle>
  /**
   * Color of border color when focused
   */
  focusColor?: string
  /**
   * If keyboard is automatically brought up when OTP is loaded.
   */
  autoFocus?: boolean
  /**
   * Set editable for inputs
   */
  editable?: boolean
  /**
   * Callback function
   * Trigger when all text input fields are fulfill
   */
  onCodeFilled?: (code: string) => void
  /**
   * Callback function
   * Trigger when a field of the OTP is changed
   */
  onCodeChanged?: (codes: string) => void
  /**
   * Entering animation using reanimated layout
   */
  enteringAnimated?: typeof LinearTransition
  /**
   * Exiting animation using reanimated layout
   */
  exitingAnimated?: typeof LinearTransition
  /**
   * If the input is an error
   */
  isError?: boolean
  /**
   * Default value for OTP input
   */
  defaultValue?: string
  /**
   * Test ID for testing
   */
  'data-testid'?: string
}

export interface IOtpContext extends IOtpInput {
  inputRef: React.RefObject<any[]>
  otpValue: string[]
  onPress: () => void
  onFocusNext: (value: string, index: number) => void
  onFocusPrevious: (key: string, index: number) => void
  setFocus: React.Dispatch<React.SetStateAction<number>>
  setOtpValue: React.Dispatch<React.SetStateAction<string[]>>
  focus: number
  autoFocus: boolean
  currentIndex: number
  isError: boolean
  testId?: string
  rest?: Omit<TextInputProps, 'style'>
}

const OtpContext = createContext<IOtpContext>({} as IOtpContext)

const OtpItem = ({ i }: { i: number }) => {
  const {
    inputRef,
    onPress,
    otpValue,
    onFocusNext,
    onFocusPrevious,
    setFocus,
    setOtpValue,
    focus,
    focusColor,
    autoFocus,
    inputContainerStyle,
    inputStyle,
    inputMaskStyle,
    textStyle,
    otpCount,
    editable,
    enteringAnimated,
    exitingAnimated,
    isError,
    testId,
    rest,
  } = useContext(OtpContext)

  const { color, color2, color02, red10 } = useTheme()
  const { width } = useWindowDimensions()

  const inputWidth = (width - 58) / otpCount

  const isFocused = useSharedValue(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need>
  useEffect(() => {
    isFocused.value = withTiming(focus === i ? 1 : 0, { duration: 150 })
  }, [focus])

  const borderStyle = useAnimatedStyle(() => {
    return {
      borderColor: isError ? red10.val : isFocused.value ? color02.val : 'transparent',
      borderWidth: 1,
    }
  }, [focus, isFocused, isError])

  return (
    <View key={i} style={[inputContainerStyle]}>
      <TextInput
        testID={testId ? `${testId}-${i}` : undefined}
        style={[{ width: inputWidth, height: inputWidth }, inputStyle]}
        caretHidden
        keyboardType="number-pad"
        ref={inputRef.current[i]}
        value={otpValue[i]}
        onChangeText={(v) => onFocusNext(v, i)}
        onKeyPress={(e) => onFocusPrevious(e.nativeEvent.key, i)}
        textContentType="oneTimeCode"
        autoFocus={autoFocus && i === 0}
        {...rest}
      />
      <Animated.View
        style={[
          styles.overlay,
          {
            alignItems: 'center',
            justifyContent: 'center',
            width: inputWidth,
            height: inputWidth,
            backgroundColor: color2.val,
            borderRadius: 12,
          },
          inputMaskStyle,
          borderStyle,
        ]}
        pointerEvents="none"
      >
        {otpValue[i] !== '' && (
          <Animated.Text
            key={`otp-text-${i}-${otpValue[i]}`}
            entering={enteringAnimated}
            exiting={exitingAnimated}
            style={[styles.text, { color: color.val, position: 'absolute' }, textStyle]}
          >
            {otpValue[i]}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  )
}

export const OtpInput = memo(
  ({
    otpCount = 6,
    containerStyle = {},
    inputContainerStyle = {},
    inputStyle = {},
    inputMaskStyle = {},
    textStyle = {},
    focusColor = 'transparent',
    autoFocus = false,
    editable = true,
    enteringAnimated = FadeInDown,
    exitingAnimated = FadeOut,
    onCodeFilled,
    onCodeChanged,
    isError = false,
    defaultValue = '',
    'data-testid': testId,
    ...rest
  }: IOtpInput) => {
    const inputRef = useRef<any[]>([])
    const data: string[] = new Array(otpCount).fill('')

    inputRef.current = data.map(
      (_, index) => (inputRef.current[index] = React.createRef<TextInputProps>())
    )

    const [focus, setFocus] = useState<number>(
      defaultValue && defaultValue.length === otpCount ? -1 : 0
    )

    const [otpValue, setOtpValue] = useState<string[]>(() => {
      if (defaultValue) {
        const values = defaultValue.split('').slice(0, otpCount)
        return values.concat(data.slice(defaultValue.length))
      }
      return data
    })

    const shouldAutoFocus = autoFocus && !defaultValue

    const onPress = () => {
      if (focus === -1) {
        setFocus(otpCount - 1)
        otpValue[data.length - 1] = ''
        setOtpValue([...otpValue])
        inputRef.current[data.length - 1].current.focus()
      } else {
        inputRef.current[focus].current.focus()
      }
    }

    const handlePasteValue = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, otpCount)
      const newOtpValue = [...data]
      for (let i = 0; i < digits.length; i++) {
        newOtpValue[i] = digits[i] ?? ''
      }
      setOtpValue(newOtpValue)

      const nextIndex = Math.min(digits.length, otpCount - 1)
      if (digits.length >= otpCount) {
        setFocus(-1)
        inputRef.current[otpCount - 1].current.blur()
      } else {
        setFocus(nextIndex)
        inputRef.current[nextIndex].current.focus()
      }
    }

    const onFocusNext = (value: string, index: number) => {
      if (value.length > 1) {
        handlePasteValue(value)
        return
      }

      if (index < data.length - 1 && value) {
        inputRef.current[index + 1].current.focus()
        setFocus(index + 1)
      }
      if (index === data.length - 1) {
        setFocus(-1)
        inputRef.current[index].current.blur()
      }
      otpValue[index] = value
      setOtpValue([...otpValue])
    }

    const handlePaste = async () => {
      const text = await Clipboard.getString()
      if (text) {
        handlePasteValue(text)
      }
    }

    const onFocusPrevious = (key: string, index: number) => {
      if (key === 'Backspace' && index !== 0) {
        inputRef.current[index - 1].current.focus()
        setFocus(index - 1)
        const newOtpValue = [...otpValue]
        newOtpValue[index - 1] = ''
        setOtpValue(newOtpValue)
      } else if (key === 'Backspace' && index === 0) {
        otpValue[0] = ''
      }
    }
    if (otpCount < 4 && otpCount > 6) {
      throw 'OTP Count min is 4 and max is 6'
    }

    const inputProps = {
      inputRef,
      containerStyle,
      otpValue,
      onPress,
      onFocusNext,
      onFocusPrevious,
      setFocus,
      setOtpValue,
      focus,
      autoFocus: shouldAutoFocus,
      inputContainerStyle,
      inputStyle,
      inputMaskStyle,
      textStyle,
      focusColor,
      otpCount,
      editable,
      enteringAnimated,
      exitingAnimated,
      isError,
      testId,
      rest,
    }

    useEffect(() => {
      const codeString = otpValue.join('')
      onCodeChanged && onCodeChanged(codeString)
      if (codeString.length === otpCount && onCodeFilled) {
        onCodeFilled(codeString)
      }
    }, [otpValue, onCodeChanged, onCodeFilled, otpCount])

    return (
      <OtpContext.Provider
        value={
          {
            ...inputProps,
            autoFocus: shouldAutoFocus,
          } as IOtpContext
        }
      >
        <YStack gap="$3">
          <XStack style={[styles.container, containerStyle]}>
            {data.map((_, i) => {
              return <OtpItem key={i} i={i} />
            })}
          </XStack>
          {editable && (
            <Pressable onPress={handlePaste}>
              <SizableText size="$2" color="$color9" text="center" pt="$2">
                Tap to paste code
              </SizableText>
            </Pressable>
          )}
        </YStack>
      </OtpContext.Provider>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  text: {
    fontWeight: '500',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
  },
})
