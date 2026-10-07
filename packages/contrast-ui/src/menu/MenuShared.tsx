import { memo } from 'react'
import { Separator, SizableText, styled, View } from 'tamagui'

export const MenuSeparator = memo(() => {
  return (
    <Separator
      my="0-5"
      mx={7}
      borderWidth={0.5}
      borderColor="border-color"
      opacity={0.5}
    />
  )
})

export const MenuTitle = memo(({ title }: { title: string }) => {
  return (
    <SizableText
      size="2"
      fontFamily="mono"
      color="placeholder-color"
      fontWeight="500"
      select="none"
      px={7}
      pt={7}
      pb="0-5"
    >
      {title}
    </SizableText>
  )
})

// the visible menu frame. it sits inside tamagui's Content rather than being it,
// so the entering transform animates the frame and not the popper position.
export const MenuContentsFrame = styled(View, {
  bg: 'background',
  minW: 180,
  p: '1',
  borderWidth: 0.5,
  borderColor: 'border-color',
  boxShadow: '0 4px 12px shadow-color',
  rounded: '4',
  overflow: 'hidden',
})
