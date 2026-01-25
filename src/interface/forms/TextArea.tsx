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
  // @ts-expect-error fontSize token type issue in canary
  fontSize: '$4',

  focusStyle: {
    borderColor: '$color8',
  },

  variants: {
    size: {
      small: {
        // @ts-expect-error fontSize token type issue in canary
        fontSize: '$3',
        minHeight: 80,
        px: '$2.5',
        py: '$2',
      },
      medium: {
        // @ts-expect-error fontSize token type issue in canary
        fontSize: '$4',
        minHeight: 100,
      },
      large: {
        // @ts-expect-error fontSize token type issue in canary
        fontSize: '$5',
        minHeight: 120,
        px: '$4',
        py: '$3',
      },
    },
  } as const,

  defaultVariants: {
    // @ts-expect-error defaultVariants type issue in canary
    size: 'medium',
  },
})
