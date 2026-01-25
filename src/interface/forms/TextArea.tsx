import { TextArea as TamaguiTextArea, styled } from 'tamagui'

export const TextArea = styled(TamaguiTextArea, {
  name: 'TextArea',
  borderWidth: 1,
  borderColor: '$borderColor',
  placeholderTextColor: '$color8',
  rounded: '$2',
  px: '$3',
  py: '$2',
  minH: 100,
  fontSize: '$4',

  focusStyle: {
    borderColor: '$color8',
  },

  variants: {
    size: {
      small: {
        fontSize: '$3',
        minHeight: 80,
        px: '$2.5',
        py: '$2',
      },
      medium: {
        fontSize: '$4',
        minHeight: 100,
      },
      large: {
        fontSize: '$5',
        minHeight: 120,
        px: '$4',
        py: '$3',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})
