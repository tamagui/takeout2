import { router } from 'one'
import { Circle, H5, isWeb, Spacer, XStack, YStack } from 'tamagui'

import { HeaderBackButton } from '../buttons/HeaderBackButton'
import { Pressable } from '../buttons/Pressable'
import { CaretLeftIcon } from '../icons/phosphor/CaretLeftIcon'
import { PageHeading } from '../text/PageHeading'
import { BaseStepPageLayout } from './BaseStepPageLayout'

import type { IconComponent } from '../icons/types'
import type { ReactNode } from 'react'

export type StepPageProps = {
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
  disableKeyboardAvoidingView?: boolean
  keyboardOffset?: number
}

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
  disableKeyboardAvoidingView = false,
  keyboardOffset = 0,
}: StepPageProps) => {
  return (
    <BaseStepPageLayout
      bottom={bottom}
      disableScroll={disableScroll}
      disableKeyboardAvoidingView={disableKeyboardAvoidingView}
      hideBackButton={hideBackButton}
      keyboardOffset={keyboardOffset}
    >
      <YStack gap="$5">
        {!hideBackButton && !isWeb && (
          <XStack justify="space-between" items="center">
            <HeaderBackButton disabled={disableBackButton} />
            {headerTitle && <H5>{headerTitle}</H5>}
            {buttonRight ? buttonRight : <Spacer width={24} />}
          </XStack>
        )}

        <YStack gap="$5">
          {Icon && (
            <Circle
              size={52}
              bg="$color2"
              shadowColor="$color12"
              shadowOpacity={0.1}
              shadowRadius={12}
              borderWidth={0.5}
              borderColor="$color3"
              items="center"
              justify="center"
            >
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

      <YStack pt="$5" gap="$4">
        {children}
      </YStack>
    </BaseStepPageLayout>
  )
}
