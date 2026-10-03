import { styled } from 'tamagui'
import { TextArea as TamaguiTextArea } from 'tamagui/unstyled'

export const TextArea = styled(TamaguiTextArea, {
  name: 'TextArea',
  background: 'color1',
  borderWidth: 0.5,
  borderColor: 'borderColor focus:color4',
  placeholderTextColor: 'color8',
  minH: 100,
  fontSize: '4',
  outlineColor: 'focus-visible:color3',
  outlineWidth: 'focus-visible:3px',
  outlineOffset: 'focus-visible:2px',
  variants: {
    size: {
      small: {
        rounded: '2',
        fontSize: '3',
        minH: 80,
        px: '2-5',
        py: '2',
      },
      medium: {
        rounded: '4',
        fontSize: '4',
        minH: 100,
      },
      large: {
        rounded: '6',
        fontSize: '5',
        minH: 120,
        px: '4',
        py: '3',
      },
    },
  } as const,
  defaultVariants: {
    size: 'medium',
  },
})
