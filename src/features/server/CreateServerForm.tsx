import { useForm } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import type { ReactNode } from 'react'
import { SizableText, Spacer, XStack, YStack } from 'tamagui'
import { mutateInsertServer } from '~/features/server/actions/mutateInsertServer'
import { slugify } from '@vxrn/helpers'
import { zero } from '~/zero/client'
import { getValidationState } from '~/interface/forms/getValidationState'
import { Input } from '~/interface/forms/Input'
import { LabeledGroup } from '~/interface/forms/LabeledGroup'
import { showToast } from '~/interface/toast/Toast'
import { AvatarUpload } from '~/interface/upload/AvatarUpload'
import { ButtonAction } from '~/interface/buttons/ButtonAction'
import { showNotification } from '~/interface/notification/Notification'

type FormValues = {
  name: string
  domain: string
}

export type CreateServerFormProps = {
  onComplete: (serverId: string) => void
  autoFocus?: boolean
  dropActive?: boolean
  cancelButton?: ReactNode
  customFooter?: (props: { form: any; state: any; submitButton: ReactNode }) => ReactNode
}

export const CreateServerForm = ({
  onComplete,
  autoFocus = true,
  dropActive = true,
  cancelButton,
  customFooter,
}: CreateServerFormProps) => {
  const [image, setImage] = useState('')
  const cachedDomainValidations = useRef<Record<string, boolean>>({}).current
  const nameInputRef = useRef<TextInput>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      domain: '',
    },
    onSubmit: async ({ value }) => {
      if (!image) {
        showToast('Server must have an image')
        return
      }

      try {
        const next = {
          name: value.name,
          icon: image,
          id: value.domain,
        }
        console.info(`Inserting server`, next)
        const server = await mutateInsertServer(next)
        if (server) {
          onComplete(server.id)
        }
      } catch (e: any) {
        console.error(`Failed to create server`, e)
        showNotification(`Failed to create server`, {
          display: 'error',
          description: `${e.error} ${e.details}`,
        })
      }
    },
  })

  useEffect(() => {
    if (autoFocus && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [autoFocus])

  const lastName = useRef('')

  return (
    <>
      <form.Field
        name="name"
        validators={{
          onChangeAsyncDebounceMs: 0,
          onChange: ({ value: valueIn }) => {
            const value = valueIn.trim()
            const last = lastName.current

            const lastSlugifiedDomain = slugify(last)
            const domain = form.getFieldValue('domain')
            if (!domain || domain === lastSlugifiedDomain) {
              form.setFieldValue('domain', slugify(value))
            }

            lastName.current = value

            if (!value.length) return 'too short'
            if (value.length < 3) return 'too short'
            if (value.length > 255) return 'too long'
          },
          onBlur: ({ value }) => {
            if (!value) return 'must set'
          },
        }}
      >
        {(field) => (
          <LabeledGroup
            validation={getValidationState(field)}
            label="Name"
            htmlFor="servername"
          >
            <Input
              borderWidth={0.5}
              maxW={250}
              autoComplete="off"
              ref={nameInputRef}
              flex={2}
              id="servername"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </LabeledGroup>
        )}
      </form.Field>

      <form.Field
        name="domain"
        validators={{
          onChange: ({ value: valueIn }) => {
            const value = valueIn.trim()
            if (value.length < 3) return 'too short'
            if (value.length > 255) return 'too long'
          },
          onChangeAsyncDebounceMs: 500,
          onChangeAsync: async ({ value: valueIn }) => {
            const value = valueIn.trim()
            const cached = cachedDomainValidations[value]
            if (cached !== undefined) {
              return cached ? undefined : 'exists already'
            }
            if (value && value.length > 2) {
              console.info('checking', value)
              const serverWithDomainExists = await zero.query.server
                .where('id', value)
                .one()
                .run({ type: 'complete' })
              console.info('serverWithDomainExists', serverWithDomainExists)
              cachedDomainValidations[value] = !serverWithDomainExists
              return serverWithDomainExists ? 'exists already' : undefined
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <LabeledGroup
            validation={getValidationState(field)}
            label="Domain"
            htmlFor="domain"
          >
            <XStack items="center" gap="$3">
              <Input
                borderWidth={0.5}
                autoComplete="off"
                maxW={120}
                flex={1}
                id="domain"
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <SizableText fontFamily="$mono" size="$4">
                .start.chat
              </SizableText>
            </XStack>
          </LabeledGroup>
        )}
      </form.Field>

      <LabeledGroup
        validation={image ? 'valid' : 'idle'}
        label="Image"
        htmlFor="server-create-image"
      >
        <AvatarUpload
          id="server-create-image"
          dropActive={dropActive}
          originalImage=""
          currentImage={image}
          onChangeImage={setImage}
        />
      </LabeledGroup>

      <Spacer flex />

      <form.Subscribe>
        {(state) => {
          const disabled =
            !state.isValid ||
            state.isSubmitting ||
            (!state.canSubmit && state.isSubmitted)

          const submitButton = (
            <ButtonAction disabled={disabled} onPress={form.handleSubmit}>
              {state.isSubmitting ? '...' : 'Create'}
            </ButtonAction>
          )

          return customFooter ? (
            customFooter({ form, state, submitButton })
          ) : (
            <XStack justify="space-between" pt="$4">
              {cancelButton}
              {submitButton}
            </XStack>
          )
        }}
      </form.Subscribe>
    </>
  )
}
