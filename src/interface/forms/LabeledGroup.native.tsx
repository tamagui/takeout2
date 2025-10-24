import { createElement, isValidElement, type JSX } from 'react'
import { Label, SizableText, View, XStack, YStack, type XStackProps } from 'tamagui'

/**
 * Native version of LabeledGroup optimized for mobile
 * Settings variant shows label and control on the same row
 */
export const LabeledGroup = ({
  htmlFor,
  label,
  labelHint,
  labelAction,
  description,
  icon,
  children,
  variant,
  ...rest
}: XStackProps & {
  variant?: 'settings' | 'form' | 'vertical'
  icon?: any
  htmlFor?: string
  label: string
  labelHint?: string
  labelAction?: JSX.Element
  description?: string
  below?: JSX.Element
  validation?: any
  disableValidCheck?: boolean
}) => {
  const isSettings = variant === 'settings'
  const isVertical = variant === 'vertical'

  // Settings variant - horizontal layout with label and control on same row
  if (isSettings) {
    return (
      <YStack py="$3">
        <XStack width="100%" items="center" gap="$3" {...rest}>
          {/* Icon and Label */}
          <XStack flex={1} gap="$3" items="center">
            {icon && (
              <View>
                {isValidElement(icon)
                  ? icon
                  : createElement(icon, { size: 18, opacity: 0.5 })}
              </View>
            )}
            <Label
              htmlFor={htmlFor}
              flex={1}
              pressStyle={{ opacity: 0.6 }}
              fontFamily="$mono"
              fontWeight="600"
            >
              {label}
            </Label>
          </XStack>

          {/* Control (Switch, etc) */}
          <View>{children}</View>
        </XStack>

        {/* Description below */}
        {description && (
          <SizableText size="$4" color="$color10" opacity={0.8} mt="$2">
            {description}
          </SizableText>
        )}
      </YStack>
    )
  }

  // Vertical variant
  if (isVertical) {
    return (
      <YStack px="$4" py="$2" gap="$2">
        {/* Label with icon */}
        <XStack gap="$3" items="center">
          {icon && (
            <View>
              {isValidElement(icon)
                ? icon
                : createElement(icon, { size: 14, opacity: 0.35 })}
            </View>
          )}
          <Label fontFamily="$mono" fontWeight="600" htmlFor={htmlFor} mb="$2">
            {label}
          </Label>
        </XStack>

        {/* Description */}
        {description && (
          <SizableText opacity={0.5} mb="$2">
            {description}
          </SizableText>
        )}

        {/* Children */}
        <View>{children}</View>
      </YStack>
    )
  }

  // Default/Form variant - side by side on mobile
  return (
    <YStack px="$4" py="$2">
      <XStack width="100%" gap="$4" items="center" {...rest}>
        {/* Label section */}
        <YStack flex={1} gap="$1">
          <XStack gap="$3" items="center">
            {icon && (
              <View>
                {isValidElement(icon)
                  ? icon
                  : createElement(icon, { size: 14, opacity: 0.35 })}
              </View>
            )}
            <Label fontFamily="$mono" htmlFor={htmlFor} pressStyle={{ opacity: 0.6 }}>
              {label}
            </Label>
          </XStack>
          {labelHint && (
            <SizableText size="$2" fontFamily="$mono" opacity={0.5}>
              {labelHint}
            </SizableText>
          )}
        </YStack>

        {/* Control */}
        <View>{children}</View>
      </XStack>

      {/* Description below */}
      {description && (
        <SizableText opacity={0.5} mt="$2">
          {description}
        </SizableText>
      )}
    </YStack>
  )
}
