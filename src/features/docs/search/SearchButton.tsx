import { useContext } from 'react'
import { html, Paragraph } from 'tamagui'

import { MagnifyingGlassIcon } from '~/interface/icons/phosphor/MagnifyingGlassIcon'

import { SearchContext } from './SearchContext'

export const SearchButton = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) return null

  return (
    <html.button
      type="button"
      onPress={searchContext.onOpen}
      display="flex"
      flexDirection="row"
      items="center"
      ml="1"
      mr="3"
      px="2-5"
      py="1-5"
      mb="4"
      rounded="3"
      borderWidth={0.5}
      borderColor="color5 hover:color6"
      bg="color2 hover:color3 press:color4"
      cursor="pointer"
    >
      <MagnifyingGlassIcon size={14} color="$color8" />
      <Paragraph flex={1} text="left" ml="2" color="color9" size="3">
        Search
      </Paragraph>
      <Paragraph size="2" color="color8" fontFamily="mono" letterSpacing={1}>
        ⌘K
      </Paragraph>
    </html.button>
  )
}
