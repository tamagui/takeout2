import { useForm } from '@tanstack/react-form'
import { useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import { TextArea } from 'tamagui'
import { useCurrentAppInstallId } from '~/context/CurrentAppInstallContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { getUser } from '~/features/user/getUser'
import { useUser } from '~/features/user/useUser'
import { sleep } from '@vxrn/helpers'
import { useAsyncEffect } from '@vxrn/helpers'
import { ensureExists } from '@vxrn/helpers'
import { randomId } from '@vxrn/helpers'
import { zero } from '~/zero/client'
import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { getValidationState } from '../forms/getValidationState'
import { Input } from '../forms/Input'
import { LabeledGroup } from '../forms/LabeledGroup'
import { Select } from '../select/Select'
import { showToast } from '../toast/Toast'
import { dataDialogEmitter } from './actions'
import { Dialog } from './Dialog'
import { dialogEmit, useDialogEmit } from './shared'
import type { DialogCreateDataType } from './types'

// Simple success/cancel helpers matching other dialogs
const success = () => dataDialogEmitter.emit(true)
const cancel = () => dataDialogEmitter.emit(false)

// TODO merge with AppSidePanel

const reliabilityItems = [
  { name: '1', id: '1' },
  { name: '2', id: '2' },
  { name: '3', id: '3' },
  { name: '4', id: '4' },
  { name: '5', id: '5' },
]

const permissionItems = [
  { name: 'Public', id: 'public' },
  { name: 'Private', id: 'private' },
]

export const DialogCreateData = () => {
  const [show, setShow] = useState(false)
  const keyInputRef = useRef<TextInput>(null)
  const [state, setState] = useState<DialogCreateDataType | null>(null)
  const serverId = useCurrentServerId()
  const appInstallId = useCurrentAppInstallId()

  useDialogEmit((next) => {
    if (next.type === 'create-data') {
      setShow(true)
      setState(next)
    } else {
      setShow(false)
    }
  })

  useAsyncEffect(
    async (signal) => {
      if (show) {
        await sleep(100)
        if (signal.aborted) return
        keyInputRef.current?.focus()
      }
    },
    [show]
  )

  const { user } = useUser()

  const form = useForm({
    defaultValues: {
      key: state?.text ? '' : state?.attachments?.[0]?.name || '',
      value: state?.text || state?.attachments?.[0]?.data || '',
      type: '',
      reliability: '1',
      permissions: 'public',
    },

    onSubmit: async ({ value: formValue, formApi }) => {
      if (!user) {
        showToast('You must be signed in')
        return
      }

      try {
        const { key, type, permissions, reliability, value } = formValue
        const user = getUser()
        ensureExists(user)
        ensureExists(key)
        ensureExists(type)
        ensureExists(permissions)
        ensureExists(reliability)
        ensureExists(value)

        showToast('Indexing...')

        await zero.mutate.data.insert({
          id: randomId(),
          creatorId: user.id,
          key,
          type,
          value,
          permissions: permissions as any,
          reliability: +reliability,
          channelId: serverId,
          appInstallId,
          // for now hard-code to "data" app but could let user select
          appId: `data`,
          serverId,
          createdAt: Date.now(),
        }).server

        showToast('Created!')
        formApi.reset()
        setShow(false)
        success()
      } catch (e) {
        showToast(`Failed to create data: ${e}`)
      }
    },
  })

  return (
    <Dialog
      onOpenChange={(open) => {
        if (show) {
          dialogEmit({ type: 'closed' })
        }
        setShow(open)
      }}
      open={show}
    >
      <Dialog.Header title="Insert Data" />

      <Dialog.Body scrollable>
        <form.Field
          name="key"
          validators={{
            onBlur: ({ value: v }) => {
              const val = v?.trim()
              if (!val) return 'required'
              if (val.length > 255) return 'too long'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              label="Key"
              htmlFor="datakey"
            >
              <Input
                borderWidth={0.5}
                autoComplete="off"
                ref={keyInputRef}
                flex={1}
                id="datakey"
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field
          name="value"
          validators={{
            onBlur: ({ value: v }) => {
              if (!v.trim()) return 'required'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              label="Value"
              htmlFor="datavalue"
            >
              <TextArea
                borderWidth={0.5}
                autoComplete="off"
                width="100%"
                flex={1}
                id="datavalue"
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field
          name="type"
          validators={{
            onBlur: ({ value: v }) => {
              if (!v?.trim()) return 'required'
            },
          }}
        >
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              label="Type"
              htmlFor="datatype"
            >
              <Input
                borderWidth={0.5}
                autoComplete="off"
                flex={1}
                id="datatype"
                value={field.state.value}
                onChange={(e: any) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field name="reliability">
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              label="Reliability"
              htmlFor="reliability"
            >
              <Select
                items={reliabilityItems}
                defaultValue={field.state.value}
                onValueChange={(val: string) => field.handleChange(val)}
              />
            </LabeledGroup>
          )}
        </form.Field>

        <form.Field name="permissions">
          {(field) => (
            <LabeledGroup
              validation={getValidationState(field)}
              label="Permissions"
              htmlFor="permissions"
            >
              <Select
                items={permissionItems}
                defaultValue={field.state.value}
                onValueChange={(val: string) => field.handleChange(val)}
              />
            </LabeledGroup>
          )}
        </form.Field>
      </Dialog.Body>

      <Dialog.Footer>
        <Dialog.Close asChild>
          <ButtonSimple
            onPress={() => {
              setShow(false)
              cancel()
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
              <ButtonAction disabled={disabled} onPress={form.handleSubmit}>
                {state.isSubmitting ? '...' : 'Create'}
              </ButtonAction>
            )
          }}
        </form.Subscribe>
      </Dialog.Footer>
    </Dialog>
  )
}
