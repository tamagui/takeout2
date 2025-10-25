import { forwardRef } from 'react'
import { TextArea as TamaguiTextArea, styled } from 'tamagui'

export const TextArea = styled(TamaguiTextArea, {
  name: 'TextArea',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$2',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$4',
  minHeight: 100,
  textAlignVertical: 'top',

  focusStyle: {
    borderColor: '$color8',
  },

  placeholderTextColor: '$color8',

  variants: {
    size: {
      small: {
        fontSize: '$3',
        minHeight: 80,
      },
      medium: {
        fontSize: '$4',
        minHeight: 100,
      },
      large: {
        fontSize: '$5',
        minHeight: 120,
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})

export default TextArea
