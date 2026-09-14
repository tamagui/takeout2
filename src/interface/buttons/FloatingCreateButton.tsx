import { View } from 'tamagui'

import { dialogEmit } from '~/interface/dialogs/shared'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

import { Button } from './Button'
import { Pressable } from './Pressable'

export const FloatingCreateButton = () => {
  return (
    <View position="fixed" b="12 lg:6" l={0} r={0} z={999}>
      <View mx="auto" w="100%" maxW={1200} px="4" items="flex-end">
        <Button
          size="xxl"
          circular
          data-testid="create-post-button"
          theme="accent"
          boxShadow="0 5px 10px shadow-color"
          aria-label="Create post"
          onPress={() => dialogEmit({ type: 'create-post' })}
        >
          <PlusIcon size={28} color="$color12" />
        </Button>
      </View>
    </View>
  )
}
