import { router } from 'one'
import { YStack } from 'tamagui'
import { ImagesSquareIcon } from '~/interface/icons/phosphor/ImagesSquareIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { ListItem } from '~/interface/lists/ListItem'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { setCreateSheetRef } from './CreateTabIcon'

let sheetRef: SheetRef | null = null

export const CreateSheet = () => {
  const handleNewPost = () => {
    sheetRef?.collapse()
    // router.push(`/studio/draft/new`)
  }

  const handleNewContent = () => {
    sheetRef?.collapse()
    // router.push('/studio/create-content')
  }

  const options = [
    { icon: PlusIcon, label: 'New Post', onPress: handleNewPost },
    { icon: ImagesSquareIcon, label: 'New Content', onPress: handleNewContent },
  ]

  return (
    <Sheet
      ref={(node) => {
        sheetRef = node
        setCreateSheetRef(node)
      }}
      title="Create"
    >
      <YStack gap="$2">
        {options.map(({ icon: Icon, label, onPress }) => (
          <ListItem
            key={label}
            onPress={onPress}
            size="large"
            bg="$color3"
            pressStyle={{ bg: '$color2' }}
            height={50}
          >
            <Icon size={22} color="$color10" />
            <ListItem.Text fontWeight="600" color="$color">
              {label}
            </ListItem.Text>
          </ListItem>
        ))}
      </YStack>
    </Sheet>
  )
}
