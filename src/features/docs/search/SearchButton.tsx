import { useContext } from 'react'
import { Paragraph, XStack } from 'tamagui'

import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'

import { SearchContext } from './SearchContext'

export const SearchButton = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) return null

  return (
    <XStack
      tag="button"
      onPress={searchContext.onOpen}
      mx="$2"
      px="$3"
      py="$2"
      mb="$4"
      rounded="$4"
      borderWidth={1}
      borderColor="$color4"
      bg="$color2"
      items="center"
      cursor="pointer"
      hoverStyle={{
        bg: '$color3',
        borderColor: '$color5',
      }}
      pressStyle={{
        bg: '$color4',
      }}
      {...({} as any)}
    >
      <MagnifyingGlassIcon size={16} color="$color10" />
      <Paragraph flex={1} text="left" ml="$2" size="$3" color="$color10">
        Search
      </Paragraph>
      <XStack gap="$1">
        <XStack
          px="$1.5"
          py="$0.5"
          rounded="$2"
          bg="$color4"
          borderWidth={1}
          borderColor="$color5"
        >
          <Paragraph size="$1" color="$color10" fontFamily="$mono">
            ⌘
          </Paragraph>
        </XStack>
        <XStack
          px="$1.5"
          py="$0.5"
          rounded="$2"
          bg="$color4"
          borderWidth={1}
          borderColor="$color5"
        >
          <Paragraph size="$1" color="$color10" fontFamily="$mono">
            K
          </Paragraph>
        </XStack>
      </XStack>
    </XStack>
  )
}
