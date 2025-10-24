import { Lock } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import {
  setShouldRedirectBackToTauri,
  shouldRedirectBackToTauri,
  useTauriAuthDeepLink,
} from '~/tauri/authFlowHelpers'

export const FinishTauriAppLoginButton = memo(() => {
  const link = useTauriAuthDeepLink()

  return (
    <a href={link || ''}>
      <ButtonSimple
        size="large"
        icon={Lock}
        onPressOut={() => {
          if (shouldRedirectBackToTauri()) {
            setShouldRedirectBackToTauri(false)
            setTimeout(() => {
              location.href = window.location.origin
            }, 3000)
          }
        }}
      >
        Finish app sign in
      </ButtonSimple>
    </a>
  )
})
