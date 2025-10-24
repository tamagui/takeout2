import { Copy } from '@tamagui/lucide-icons'
import { getURL } from 'one'
import { useState } from 'react'
import { Paragraph, XStack, YStack } from 'tamagui'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { dialogEmitter } from './shared'
import { Dialog } from './Dialog'
import type { DialogDomainInstructions } from './types'
import { useEmitter } from '@vxrn/helpers'
import { showToast } from '~/interface/toast/Toast'

export const DialogDomainInstructionsComponent = () => {
  const [state, setState] = useState<DialogDomainInstructions | null>(null)

  useEmitter(dialogEmitter, (next) => {
    if (next.type === 'domain-instructions') {
      setState(next)
    } else if (next.type === 'closed') {
      setState(null)
    }
  })

  const mainDomain = getURL().replace(/^https?:\/\//, '')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied')
  }

  return (
    <Dialog
      minH={500}
      open={!!state}
      onOpenChange={(open) => {
        if (!open && state) {
          setState(null)
        }
      }}
    >
      <YStack pointerEvents="box-none" gap="$4" flex={1}>
        <Dialog.Header
          title="Custom Domain Setup"
          description="Configure your DNS to point to our servers"
        />

        <YStack gap="$3">
          <Paragraph fontFamily="$mono" size="$4">
            1. Add a CNAME record in your DNS settings:
          </Paragraph>

          <YStack bg="$color2" p="$3" rounded="$4" gap="$2">
            <XStack justify="space-between" items="center">
              <Paragraph fontFamily="$mono" size="$3">
                Type: CNAME
              </Paragraph>
            </XStack>
            <XStack justify="space-between" items="center">
              <Paragraph fontFamily="$mono" size="$3">
                Name: {state?.domain || 'your-domain'}
              </Paragraph>
              <ButtonSimple
                size="small"
                icon={Copy}
                onPress={() => copyToClipboard(state?.domain || '')}
              />
            </XStack>
            <XStack justify="space-between" items="center">
              <Paragraph fontFamily="$mono" size="$3">
                Target: {mainDomain}
              </Paragraph>
              <ButtonSimple
                size="small"
                icon={Copy}
                onPress={() => copyToClipboard(mainDomain)}
              />
            </XStack>
          </YStack>

          <Paragraph fontFamily="$mono" size="$4" mt="$2">
            2. Wait for DNS propagation (can take up to 48 hours)
          </Paragraph>

          <Paragraph fontFamily="$mono" size="$4">
            3. Configure SSL through your DNS provider
          </Paragraph>

          <Paragraph fontFamily="$mono" size="$4">
            4. Click "Verify DNS" to confirm setup
          </Paragraph>

          <YStack bg="$color2" p="$3" rounded="$4" mt="$2">
            <Paragraph fontFamily="$mono" size="$3" color="$color11">
              Note: You'll need to handle SSL certificates for your custom domain through
              your DNS provider (e.g., enable proxy mode if using Cloudflare)
            </Paragraph>
          </YStack>
        </YStack>
      </YStack>

      <XStack pointerEvents="box-none" justify="flex-end" gap="$2">
        <Dialog.Close asChild>
          <ButtonSimple
            onPress={() => {
              setState(null)
            }}
          >
            Close
          </ButtonSimple>
        </Dialog.Close>
      </XStack>
    </Dialog>
  )
}
