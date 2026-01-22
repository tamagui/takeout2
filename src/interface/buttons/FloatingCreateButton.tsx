import { View } from 'tamagui'

import { dialogEmit } from '~/interface/dialogs/shared'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

import { Pressable } from './Pressable'

export const FloatingCreateButton = () => {
  return (
    <View position="fixed" b="$10" l={0} r={0} z={999} $lg={{ b: '$4' }}>
      <View mx="auto" width="100%" maxW={1200} px="$4" items="flex-end">
        <Pressable
          data-testid="create-post-button"
          theme="accent"
          width={50}
          height={50}
          cursor="pointer"
          items="center"
          justify="center"
          rounded="$10"
          bg="$background"
          boxShadow="0 0 10px $shadow4"
          aria-label="Create post"
          onPress={() => dialogEmit({ type: 'create-post' })}
        >
          <PlusIcon size={24} color="$color12" />
        </Pressable>
      </View>
    </View>
  )
}
