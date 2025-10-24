import { Check } from '@tamagui/lucide-icons'
import { createElement, isValidElement, type JSX } from 'react'
import {
  AnimatePresence,
  Label,
  SizableText,
  Spinner,
  Theme,
  View,
  XStack,
  YStack,
  type XStackProps,
} from 'tamagui'
import { animationClamped } from '../animations/animationClamped'
import type { FormFieldValidation } from './getValidationState'

/**
 * Display content with a label
 *
 * @param variant - "form" aligns children left more, "settings" pushes them to right end
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
  validation,
  below,
  disableValidCheck,
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
  validation?: FormFieldValidation
  disableValidCheck?: boolean
}) => {
  const error = typeof validation === 'object' ? validation.error : ''
  const isSettings = variant === 'settings'
  const isVertical = variant === 'vertical'

  return (
    <YStack width="100%" px="$4" py={isVertical ? '$2' : '$2'}>
      <View
        flexDirection="column"
        {...(!isVertical && {
          $xs: { flexDirection: 'row' },
        })}
        gap="$0.5"
        {...rest}
      >
        <YStack
          items="flex-start"
          {...(!isVertical && {
            flex: 2.5,
            mr: 15,
          })}
        >
          <YStack
            gap="$3"
            items="flex-end"
            animation="quick"
            y={0}
            {...(isSettings && {
              flexDirection: 'row',
              items: 'center',
            })}
            {...(isVertical && {
              items: 'flex-start',
            })}
            {...(!isVertical && {
              minH: 44,
              pt: '$2.5',
              ...(!!error && {
                y: -2,
              }),
            })}
          >
            {/* view prevents it shrinking */}
            {icon && (
              <View>
                {isValidElement(icon)
                  ? icon
                  : createElement(icon, { size: 14, opacity: 0.35 })}
              </View>
            )}

            <Theme name={error ? 'red' : null}>
              <XStack items="center" gap="$2" width="100%">
                <Label
                  fontFamily="$mono"
                  overflow="hidden"
                  gap="$4"
                  pressStyle={{ opacity: 0.6 }}
                  htmlFor={htmlFor}
                  text={isSettings ? 'left' : 'right'}
                  fontWeight={isVertical ? '600' : '400'}
                  mb={isVertical ? '$2' : '$0'}
                  ellipse
                >
                  {label}
                  <AnimatePresence>
                    {(validation === 'checking' || validation === 'valid') && (
                      <View
                        animation={animationClamped('bouncy')}
                        items="center"
                        justify="center"
                        opacity={1}
                        y={0}
                        enterStyle={{
                          opacity: 0,
                          y: -5,
                        }}
                        exitStyle={{
                          opacity: 0,
                          y: 5,
                        }}
                      >
                        {validation === 'checking' ? (
                          <Spinner color="$color8" size="small" />
                        ) : validation === 'valid' && !disableValidCheck ? (
                          <Check size={14} color="$green10" />
                        ) : null}
                      </View>
                    )}
                  </AnimatePresence>
                  {labelAction}
                </Label>
              </XStack>
            </Theme>
          </YStack>

          {error ? (
            <SizableText
              cursor="default"
              select="none"
              size="$2"
              fontFamily="$mono"
              color="$red10"
              text="right"
              mt={-3}
              lineHeight={0}
            >
              {error}
            </SizableText>
          ) : labelHint ? (
            <SizableText
              cursor="default"
              select="none"
              size="$2"
              fontFamily="$mono"
              text="right"
              mr="auto"
              lineHeight={0}
              opacity={0.5}
            >
              {labelHint}
            </SizableText>
          ) : null}
        </YStack>

        {Boolean(isVertical && description) && (
          <SizableText cursor="default" pointerEvents="none" opacity={0.5} mt={-4} mb={6}>
            {description}
          </SizableText>
        )}

        <XStack
          flex={isSettings || isVertical ? 'unset' : 5}
          items="center"
          {...(isVertical && {
            flexDirection: 'column',
            flex: 'unset',
            items: 'flex-start',
          })}
        >
          {children}
        </XStack>
      </View>

      {!!description && !isVertical && (
        <SizableText mr="auto" cursor="default" pointerEvents="none" opacity={0.5}>
          {description}
        </SizableText>
      )}
    </YStack>
  )
}
