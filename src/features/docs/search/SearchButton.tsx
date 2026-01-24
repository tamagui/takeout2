import { useContext } from 'react'
import { Paragraph, XStack } from 'tamagui'

import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'

import { SearchContext } from './SearchContext'

export const SearchButton = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) return null

  return (
    <XStack
      render="button"
      onPress={searchContext.onOpen}
      ml="$1"
      mr="$3"
      px="$2.5"
      py="$1.5"
      mb="$4"
      rounded="$3"
      borderWidth={0.5}
      borderColor="$color5"
      bg="$color2"
      items="center"
      cursor="pointer"
      hoverStyle={{
        bg: '$color3',
        borderColor: '$color6',
      }}
      pressStyle={{
        bg: '$color4',
      }}
      {...({} as any)}
    >
      <MagnifyingGlassIcon size={14} color="$color8" />
      <Paragraph flex={1} text="left" ml="$2" size="$3" color="$color9">
        Search
      </Paragraph>
      <Paragraph size="$2" color="$color8" fontFamily="$mono" letterSpacing={1}>
        ⌘K
      </Paragraph>
    </XStack>
  )
}
