import { useEmitterValue } from '@take-out/helpers'
import { router, useFocusEffect } from 'one'
import { memo, useRef } from 'react'
import { YStack } from 'tamagui'

import { showCreatePostDialog } from '~/interface/dialogs/actions'
import { dialogEmitter } from '~/interface/dialogs/shared'

export const PlusPage = memo(() => {
  const dialogState = useEmitterValue(dialogEmitter)
  const wasOpenRef = useRef(false)

  useFocusEffect(() => {
    showCreatePostDialog()
    wasOpenRef.current = true
  }, [])

  useFocusEffect(() => {
    if (wasOpenRef.current && dialogState.type === 'closed') {
      wasOpenRef.current = false
      router.back()
    }
  }, [dialogState.type])

  return <YStack flex={1} bg="$background" />
})
