import { ArrowRight, Check } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { showToast } from '~/interface/toast/Toast'
import { runQueryMutation } from '../ai/runQueryMutation'
import { MarkdownSandboxQuery } from './MarkdownSandboxQuery'

export const MarkdownSandboxMutation = ({ ...props }: any) => {
  const codeContent = props.children as string

  // todo persist
  const [accepted, setAccepted] = useState(false)

  if (!codeContent.startsWith('export const query')) {
    return null
  }

  const queryMatch = codeContent.match(
    /export const query[^{]*{[^}]*return\s+([\s\S]*?)\s*}\s*(?=export|$)/
  )
  const queryString = queryMatch?.[1]?.trim()

  const transformMatch = codeContent.match(/export const transform[^{]*{([\s\S]*?)^}/m)
  const transformCode = transformMatch?.[1]?.trim()

  if (!queryString) {
    return null
  }

  return (
    <YStack>
      <MarkdownSandboxQuery transformCode={transformCode}>
        {queryString}
      </MarkdownSandboxQuery>

      <XStack
        className="styled-block"
        onPress={async () => {
          const withoutExports = codeContent.replaceAll(/^export const/gim, 'const')
          const result = await runQueryMutation(withoutExports)
          if (result?.success) {
            setAccepted(true)
            showToast(`Ran mutation!`)
          }
        }}
        p="$2"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        disabled={accepted}
      >
        <ButtonSimple iconAfter icon={accepted ? Check : ArrowRight}>
          Accept
        </ButtonSimple>
      </XStack>
    </YStack>
  )
}
