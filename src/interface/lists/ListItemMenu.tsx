import { use } from 'react'
import { YStack } from 'tamagui'

import { DotsThreeVerticalIcon } from '~/interface/icons/phosphor/DotsThreeVerticalIcon'

import { animationClamped } from '../animations/animationClamped'
import { Button } from '../buttons/Button'
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
      <Menu.Trigger unstyled borderWidth={0} bg="transparent" p={0}>
        <Button
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
              transition: animationClamped('quickLessBouncy'),
              opacity: 0,
              y: 5,
              '$group-item-hover': { opacity: 0.4, y: 0 },
            })}
          >
            <DotsThreeVerticalIcon size={12} />
          </YStack>
        </Button>
      </Menu.Trigger>
    </Menu>
  )
}
