import { useForm } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { memo } from 'react'
import { SizableText, Spacer } from 'tamagui'
import { PaneFooter } from '~/features/topbar/TopBarPane'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { getValidationState } from '~/interface/forms/getValidationState'
import { LabeledGroup } from '~/interface/forms/LabeledGroup'
import { showToast } from '~/interface/toast/Toast'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'
import { zero } from '~/zero/client'
import { useUser } from '../useUser'
import { Input } from '~/interface/forms/Input'

export const UserProfileEditForm = memo(
  ({
    isOpen,
    onProfileComplete,
    customFooter,
  }: {
    isOpen: boolean
    onProfileComplete?: () => void
    customFooter?: (props: {
      form: any
      state: any
      submitButton: ReactNode
    }) => ReactNode
  }) => {
    const { user } = useUser()

    const form = useForm({
      defaultValues: {
        name: user?.name || '',
        username: user?.username || '',
        image: user?.image || '',
      },
      onSubmit: async ({ value }) => {
        if (!value.image) {
          showToast('Profile image is required')
          return
        }

        try {
          console.info(`editing`, zero)

          await zero.mutate.userPublic.updateProfile({
            name: value.name,
            image: value.image,
            username: value.username,
          }).client

          showToast('Saved')
          onProfileComplete?.()
        } catch (error) {
          showToast('Failed to save changes')
          console.error('Failed to update user:', error)
        }
      },
    })

    return (
      <>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Name is required'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              disableValidCheck
              label="Name"
              htmlFor="user-name"
            >
              <Input
                maxW={250}
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                flex={1}
                id="user-name"
                onSubmitEditing={() => form.handleSubmit()}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'required'
              if (value.length < 3) return '>=3 characters'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              disableValidCheck
              label="Username"
              htmlFor="user-username"
            >
              <Input
                maxW={250}
                textContentType="username"
                autoComplete="off"
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                flex={1}
                id="user-username"
                onSubmitEditing={() => form.handleSubmit()}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field
          name="image"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'required'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              disableValidCheck
              label="Image"
              htmlFor="image"
            >
              <AvatarUpload
                id="useredit-image"
                dropActive={isOpen}
                originalImage={user?.image || ''}
                currentImage={field.state.value}
                onChangeImage={(newImage) => {
                  field.handleChange(newImage)
                }}
              />
            </LabeledGroup>
          )}
        </form.Field>

        {process.env.NODE_ENV === 'development' && (
          <SizableText mt="$2" mb="$-4" size="$2" opacity={0.15} fontFamily="$mono">
            (dev) user id: {user?.id}
          </SizableText>
        )}

        <Spacer flex />

        <form.Subscribe>
          {(state) => {
            const disabled = !state.isValid || state.isSubmitting

            const submitButton = (
              <ButtonAction
                data-testid="profile-save"
                size="small"
                self="flex-end"
                opacity={disabled ? 0.5 : 1}
                disabled={disabled}
                onPress={() => form.handleSubmit()}
              >
                {state.isSubmitting ? '...' : 'Save'}
              </ButtonAction>
            )

            return customFooter ? (
              customFooter({ form, state, submitButton })
            ) : (
              <PaneFooter>
                {/* {!!user && (
            <Link
              href={getUserProfileLink(user)}
              onPressOut={() => {
                topBarSlidingPopoverController.emit({ type: 'close' })
              }}
            >
              <ButtonSimple size="small">Profile</ButtonSimple>
            </Link>
          )} */}

                <Spacer flex />

                {submitButton}
              </PaneFooter>
            )
          }}
        </form.Subscribe>
      </>
    )
  }
)
