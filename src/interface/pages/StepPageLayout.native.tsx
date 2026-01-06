import { router } from 'one'
import { H5, Spacer, XStack, YStack } from 'tamagui'

import { ButtonSimple } from '../buttons/ButtonSimple'
import { CaretLeftIcon } from '../icons/phosphor/CaretLeftIcon'
import { PageHeading } from '../text/PageHeading'
import { BaseStepPageLayout } from './BaseStepPageLayout'

import type { StepPageProps } from './StepPageLayout'

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
      <YStack gap="$4">
        {!hideBackButton && (
          <XStack justify="space-between" items="center">
            <ButtonSimple
              size="large"
              glass
              circular
              onPress={() => router.back()}
              icon={<CaretLeftIcon size={22} color="$color12" />}
              disabled={disableBackButton}
            />
            {headerTitle && (
              <H5 fontFamily="$heading" color="$color12">
                {headerTitle}
              </H5>
            )}
            {buttonRight ? buttonRight : <Spacer width={42} />}
          </XStack>
        )}

        <YStack gap="$4" mt="$2">
          {IconGroup && IconGroup}

          <PageHeading
            title={title}
            subTitle={description}
            subTitle2={descriptionSecondLine}
          />
        </YStack>
      </YStack>

      <YStack pt="$4" gap="$4">
        {children}
      </YStack>
    </BaseStepPageLayout>
  )
}
