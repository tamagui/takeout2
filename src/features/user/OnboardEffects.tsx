import { useUser } from '~/features/user/useUser'
import { sleep } from '@vxrn/helpers'
import { useAsyncEffect } from '@vxrn/helpers'
import { dialogEmit } from '~/interface/dialogs/shared'
import { shouldRedirectBackToTauri } from '~/tauri/authFlowHelpers'

const shouldRedirectToTauri = shouldRedirectBackToTauri()

export const OnboardEffects = () => {
  const { user, session } = useUser()

  // once logged in, if they haven't set up profile show a dialog
  useAsyncEffect(
    async (signal) => {
      if (shouldRedirectToTauri) return
      if (!user) return
      if (!session) return
      if (!user.hasOnboarded) {
        await sleep(300, signal)
        dialogEmit({ type: 'onboard' })
      }
    },
    [shouldRedirectToTauri, user?.hasOnboarded, user, session]
  )

  return null
}
