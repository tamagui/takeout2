import { router } from 'one'
import { useRef, type ReactNode } from 'react'
import { Circle, H5, Spacer, View, XStack, YStack } from 'tamagui'
import { Pressable } from '../buttons/Pressable'
import { CaretLeftIcon } from '../icons/phosphor/CaretLeftIcon'
import type { IconComponent } from '../icons/types'
import { PageHeading } from '../text/PageHeading'
import { BaseStepPageLayout, type ProgressBarConfig } from './BaseStepPageLayout'

export const StepPageLayout = ({
  title,
  description,
  descriptionSecondLine,
  headerTitle,
  Icon,
  IconGroup,
  children,
  bottom,
  buttonRight,
  disableBackButton = false,
  hideBackButton = false,
  disableScroll = false,

  linearGradientFooter = false,
  progressBar,
  disableKeyboardAvoidingView = false,
  keyboardOffset = 0,
}: {
  title: string
  description?: string
  descriptionSecondLine?: string
  headerTitle?: string
  Icon?: IconComponent
  IconGroup?: ReactNode
  children: ReactNode
  bottom?: ReactNode
  buttonRight?: ReactNode
  disableBackButton?: boolean
  hideBackButton?: boolean
  disableScroll?: boolean
  linearGradientFooter?: boolean
  progressBar?: ProgressBarConfig
  disableKeyboardAvoidingView?: boolean
  keyboardOffset?: number
}) => {
  const headerHeight = useRef(0)

  return (
    <BaseStepPageLayout
      bottom={bottom}
      disableScroll={disableScroll}
      linearGradientFooter={linearGradientFooter}
      progressBar={progressBar}
      disableKeyboardAvoidingView={disableKeyboardAvoidingView}
      hideBackButton={hideBackButton}
      keyboardOffset={keyboardOffset}
    >
      <YStack
        animation="200ms"
        onLayout={(e) => {
          headerHeight.current = e.nativeEvent.layout.height
        }}
        gap="$5"
      >
        {!hideBackButton && (
          <XStack justify="space-between" items="center">
            <Pressable
              disabled={disableBackButton}
              hitSlop={10}
              onPress={() => router.back()}
            >
              <CaretLeftIcon size={24} />
            </Pressable>
            {headerTitle && <H5>{headerTitle}</H5>}
            {buttonRight ? buttonRight : <Spacer width={24} />}
          </XStack>
        )}
        <YStack gap="$5">
          {Icon && (
            <Circle size={52} bg="$color2" items="center" justify="center">
              <Icon size={28} color="$color11" />
            </Circle>
          )}
          {IconGroup && IconGroup}

          <PageHeading
            title={title}
            subTitle={description}
            subTitle2={descriptionSecondLine}
          />
        </YStack>
      </YStack>

      <YStack animation="300ms" pt={'$5'} flex={1}>
        <View flex={1}>{children}</View>
      </YStack>
    </BaseStepPageLayout>
  )
}
