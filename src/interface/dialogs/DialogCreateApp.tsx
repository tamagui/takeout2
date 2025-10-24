import { useForm } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import { SizableText, TextArea, XStack } from 'tamagui'
import { useUser } from '~/features/user/useUser'
import { ensureExists } from '@vxrn/helpers'
import { randomId } from '@vxrn/helpers'
import { slugify } from '@vxrn/helpers'
import { zero } from '~/zero/client'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { getValidationState } from '../forms/getValidationState'
import { Input } from '../forms/Input'
import { LabeledGroup } from '../forms/LabeledGroup'
import { showToast } from '../toast/Toast'
import { AvatarUpload } from '../upload/AvatarUpload'
import { DropAreaFrame } from '../upload/DragDropFile'
import { Dialog, useDialogOpen } from './Dialog'
import { dialogEmit, useDialogEmit } from './shared'

export const DialogCreateApp = () => {
  const [show, setShow] = useState(false)
  const [image, setImage] = useState('')
  const dialogOpen = useDialogOpen()
  const { user } = useUser()
  const nameInputRef = useRef<TextInput>(null)

  useDialogEmit((next) => {
    if (next.type === 'create-app') {
      setShow(true)
    } else {
      setShow(false)
    }
  })

  // focus on active
  useEffect(() => {
    if (show) {
      nameInputRef.current?.focus()
    }
  }, [show])

  const form = useForm({
    defaultValues: {
      name: '',
      id: '',
      description: '',
    },

    onSubmit: async ({ value, formApi }) => {
      ensureExists(user)

      try {
        await zero.mutate.app.insert({
          id: value.id,
          creatorId: user.id,
          installCount: 0,
          version: '0.0.0',
          source: '',
          image,
          description: value.description,
          name: value.name,
          createdAt: Date.now(),
        })

        showToast(`Created app`)
        formApi.reset()
        setShow(false)
      } catch (e) {
        showToast(`Failed to create app: ${e}`)
      }
    },
  })

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          dialogEmit({ type: 'closed' })
        }
      }}
      open={show}
    >
      <DropAreaFrame>
        <Dialog.Header title="Create App" />

        <Dialog.Body scrollable>
          <form.Field
            name="name"
            validators={{
              onChange: ({ value: valueIn }) => {
                const value = valueIn.trim()
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
                htmlFor="appname"
              >
                <Input
                  borderWidth={0.5}
                  maxW={250}
                  autoComplete="off"
                  ref={nameInputRef}
                  flex={2}
                  id="appname"
                  value={field.state.value}
                  onChange={(e: any) => {
                    const value = e.target.value
                    field.handleChange(value)

                    const idVal = field.form.getFieldValue('id')
                    const slugged = slugify(value)
                    if (!idVal || idVal === slugged.slice(0, -1)) {
                      field.form.setFieldValue('id', slugged)
                    }
                  }}
                  onBlur={field.handleBlur}
                />
              </LabeledGroup>
            )}
          </form.Field>

          <form.Field
            name="id"
            validators={{
              onChange: ({ value: valueIn }) => {
                const value = valueIn.trim()
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
                label="ID"
                htmlFor="appid"
              >
                <XStack items="center">
                  <SizableText fontFamily="$mono" mr="$2">
                    {user?.username}.
                  </SizableText>
                  <Input
                    borderWidth={0.5}
                    maxW={250}
                    autoComplete="off"
                    flex={2}
                    id="appid"
                    value={field.state.value}
                    onChange={(e: any) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </XStack>
              </LabeledGroup>
            )}
          </form.Field>

          <form.Field
            name="description"
            validators={{
              onChange: ({ value: valueIn }) => {
                const value = valueIn.trim()
                if (value.length < 3) return 'too short'
                if (value.length > 5_000) return 'too long'
              },
              onBlur: ({ value }) => {
                if (!value) return 'must set'
              },
            }}
          >
            {(field) => (
              <LabeledGroup
                validation={getValidationState(field)}
                label="Description"
                htmlFor="description"
              >
                <TextArea
                  borderWidth={0.5}
                  autoComplete="off"
                  width="100%"
                  flex={2}
                  id="description"
                  value={field.state.value}
                  onChange={(e: any) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </LabeledGroup>
            )}
          </form.Field>

          <LabeledGroup
            validation={image ? 'valid' : 'idle'}
            label="Image"
            htmlFor="app-image"
          >
            <AvatarUpload
              id="app-image"
              dropActive={dialogOpen}
              originalImage=""
              currentImage={image}
              onChangeImage={setImage}
            />
          </LabeledGroup>
        </Dialog.Body>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <ButtonSimple
              onPress={() => {
                setShow(false)
                dialogEmit({ type: 'closed' })
              }}
            >
              Cancel
            </ButtonSimple>
          </Dialog.Close>

          <form.Subscribe>
            {(state) => {
              const disabled =
                !state.isValid ||
                state.isSubmitting ||
                (!state.canSubmit && state.isSubmitted)

              return (
                <ButtonAction
                  disabled={disabled}
                  onPress={() => {
                    form.handleSubmit()
                  }}
                >
                  {state.isSubmitting ? '...' : 'Create'}
                </ButtonAction>
              )
            }}
          </form.Subscribe>
        </Dialog.Footer>
      </DropAreaFrame>
    </Dialog>
  )
}
