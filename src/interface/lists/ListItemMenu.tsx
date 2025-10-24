import { MoreVertical } from '@tamagui/lucide-icons'
import { use } from 'react'
import { YStack } from 'tamagui'
import { animationClamped } from '../animations/animationClamped'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Menu } from '../menu/Menu'
import { ListItemContext } from './ListItemContext'

type ListItemMenuProps = {
  items?: { text: string; action?: Function; icon?: React.ReactNode }[]
}

export const ListItemMenu = ({ items }: ListItemMenuProps) => {
  if (!items || items.length === 0) {
    return null
  }

  const context = use(ListItemContext)

  return (
    <Menu
      popoverProps={{
        placement: 'bottom-end',
      }}
      items={
        items?.map((item) => {
          return {
            id: item.text,
            children: item.text,
            icon: item.icon,
            onPress: item.action as any,
          }
        }) || []
      }
    >
      <Menu.Trigger>
        <ButtonSimple
          variant="transparent"
          my={-12}
          size="small"
          onPress={(e) => {
            e.stopPropagation()
          }}
        >
          <YStack
            opacity={0.6}
            // sidebar hides by default
            {...(context.variant === 'sidebar' && {
              animation: animationClamped('quickLessBouncy'),
              opacity: 0,
              y: 5,
              '$group-item-hover': { opacity: 0.4, y: 0 },
            })}
          >
            <MoreVertical size={12} my={-2} />
          </YStack>
        </ButtonSimple>
      </Menu.Trigger>
    </Menu>
  )
}
