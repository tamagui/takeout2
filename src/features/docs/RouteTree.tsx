import { Paragraph, ScrollView, XStack, YStack, styled } from 'tamagui'

import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { FolderOpenIcon } from '~/interface/icons/phosphor/FolderOpenIcon'
import { MinusIcon } from '~/interface/icons/phosphor/MinusIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

type RouteNode = {
  name: string
  description?: string
  highlight?: boolean
  children?: RouteNode[]
  delete?: boolean
  add?: boolean
}

const TreeFrame = styled(YStack, {
  overflow: 'hidden',
  variants: {
    isRoot: {
      true: {
        borderWidth: 2,
        borderColor: '$color4',
        rounded: '$4',
        my: '$4',
      },
      false: {
        borderTopColor: '$color4',
        z: 1000,
        borderTopWidth: 1,
      },
    },
  } as const,
})

const TreeRow = styled(YStack, {
  borderBottomWidth: 1,
  borderBottomColor: '$color3',
  variants: {
    isLast: {
      true: {
        mb: -1,
      },
    },
    isHighlighted: {
      true: {
        bg: '$color2',
      },
    },
  } as const,
})

const TreeRowContent = styled(XStack, {
  px: '$2',
})

const TreeRowName = styled(XStack, {
  width: '30%',
  minW: 130,
  overflow: 'hidden',
  px: '$2.5',
  py: '$2',
  items: 'center',
  gap: '$2',
})

const TreeRowDescription = styled(YStack, {
  px: '$2.5',
  py: '$2',
})

export const RouteTree = ({
  routes,
  indent = 0,
}: {
  routes: RouteNode[]
  indent?: number
}) => {
  return (
    <TreeFrame isRoot={!indent}>
      <ScrollView
        horizontal
        contentContainerStyle={
          {
            flex: 1,
            minWidth: '100%',
          } as any
        }
      >
        <YStack flex={1}>
          {routes.map((route, i) => {
            const Icon = route.children ? FolderOpenIcon : FileIcon
            const StatusIcon = route.delete ? MinusIcon : route.add ? PlusIcon : null
            const statusColor = route.delete
              ? '$red10'
              : route.add
                ? '$green10'
                : undefined

            return (
              <TreeRow
                key={i}
                isLast={i === routes.length - 1}
                isHighlighted={route.highlight || route.add}
              >
                <TreeRowContent>
                  <TreeRowName pl={indent * 20}>
                    <Icon size={12} color="$color10" opacity={route.children ? 1 : 0.5} />
                    {StatusIcon && <StatusIcon size={12} color={statusColor} />}
                    <Paragraph flex={1} overflow="hidden" fontFamily="$mono" size="$3">
                      {route.name}
                    </Paragraph>
                  </TreeRowName>
                  <TreeRowDescription>
                    <Paragraph size="$4" color="$color11">
                      {route.description}
                    </Paragraph>
                  </TreeRowDescription>
                </TreeRowContent>

                {route.children && (
                  <YStack>
                    <RouteTree routes={route.children} indent={indent + 1} />
                  </YStack>
                )}
              </TreeRow>
            )
          })}
        </YStack>
      </ScrollView>
    </TreeFrame>
  )
}
