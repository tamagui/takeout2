import { Info } from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import { SizableText, Text, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { useQuery, zero } from '~/zero/client'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Input } from '../forms/Input'
import { showToast } from '../toast/Toast'
import { Dialog } from './Dialog'
import { dialogEmit, useDialogEmit } from './shared'

export const DialogInvite = () => {
  const [show, setShow] = useState(false)
  const [roleId, setRoleId] = useState<string | undefined>()

  useDialogEmit((next) => {
    if (next.type === 'invite') {
      setShow(true)
      setRoleId(next.roleId)
    } else {
      setShow(false)
      setRoleId(undefined)
    }
  })

  return (
    <Dialog
      onOpenChange={(next) => {
        setShow(next)
      }}
      open={show}
      minH={400}
    >
      <Content show={show} roleId={roleId} />
    </Dialog>
  )
}

export const Content = ({ show, roleId }: { show: boolean; roleId?: string }) => {
  const inputRef = useRef<any>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const { server } = useCurrentServer()
  const { user } = useAuth()

  // get role if roleId is provided
  const [role] = useQuery(
    zero.query.role
      .where('id', roleId || '')
      .where('serverId', server?.id || '')
      .one(),
    { enabled: !!roleId && !!server?.id }
  )

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 40)
      setEmail('')
    }
  }, [show])

  const handleSendInvite = async () => {
    if (!email || !server?.id || !user?.id) return

    setSending(true)
    try {
      const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

      await zero.mutate.invite.insert({
        id: inviteId,
        email,
        serverId: server.id,
        roleId: roleId || undefined,
        inviterId: user.id,
        accepted: false,
        expiresAt,
        createdAt: Date.now(),
      })

      showToast(`Invitation sent to ${email}`)
      setEmail('')
      dialogEmit({ type: 'closed' })
    } catch (error) {
      console.error('Failed to send invite:', error)
      showToast('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Dialog.Header
        title={`Invite to ${server?.name}`}
        description={role ? `Inviting with role: ${role.name}` : undefined}
      />

      <YStack flex={1} p="$4" gap="$4">
        <YStack gap="$2">
          <SizableText size="$2" color="$color10">
            Email address of invitee:
          </SizableText>
          <Input
            ref={inputRef}
            flex={1}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </YStack>

        {role && (
          <XStack p="$2" bg="$color2" rounded="$2" gap="$2" items="center">
            <Info size={16} color="$color10" />
            <Text fontSize="$2" color="$color11">
              This person will be assigned the <Text fontWeight="bold">{role?.name}</Text>{' '}
              role when they join
            </Text>
          </XStack>
        )}
      </YStack>

      <Dialog.Footer>
        <ButtonSimple onPress={() => dialogEmit({ type: 'closed' })} disabled={sending}>
          Cancel
        </ButtonSimple>
        <ButtonSimple active onPress={handleSendInvite} disabled={!email || sending}>
          {sending ? 'Sending...' : 'Send Invite'}
        </ButtonSimple>
      </Dialog.Footer>
    </>
  )
}
