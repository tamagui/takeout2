import type React from 'react'
import { forwardRef } from 'react'
import {
  type GetProps,
  getTokens,
  type Input,
  styled,
  Text,
  useComposedRefs,
} from 'tamagui'
import { inputFocusStyle } from '../forms/Input'
import { useSearchableListContext } from './Context'

const StyledInput = styled(Text, {
  tag: 'input',
  name: 'Input',
  display: 'flex',
  fontFamily: '$mono',
  fontSize: '$4',
  borderWidth: 0,
  outlineWidth: 0,
  focusVisibleStyle: {
    outlineColor: 'transparent',
    outlineStyle: 'solid',
    outlineWidth: 0,
  },

  variants: {
    unstyled: {
      false: {
        bg: '$background',
        borderColor: '$color6',
        borderWidth: 0.5,
        borderStyle: 'solid',
        color: '$color',
        focusVisibleStyle: inputFocusStyle,
      },
    },

    size: {
      '...size': (val) => {
        // @ts-ignore
        const size = getTokens().size[val].val
        return {
          fontSize: val,
          lineHeight: val,
          rounded: size / 5,
          px: size / 3,
          py: size / 4,
        }
      },
    },
  } as const,

  defaultVariants: {
    unstyled: false,
    size: '$4',
  },
})

type StyledInputBaseProps = GetProps<typeof StyledInput>

type DetailedInputProps = React.DetailedHTMLProps<
  React.HTMLProps<HTMLInputElement>,
  HTMLInputElement
>

type StyledInputProps = StyledInputBaseProps &
  Omit<DetailedInputProps, keyof StyledInputBaseProps> & {
    onChangeText?: (text: string) => void
  }

export const SearchableInput = forwardRef<Input, StyledInputProps>((props, ref) => {
  const { onChangeText, ...rest } = props
  const context = useSearchableListContext()
  const combinedRef = useComposedRefs(ref, context.refs.setReference as any)
  const refProps = context.getReferenceProps({
    ref: combinedRef as any,
  })

  // WHY input? because `refProps` from floatingUI i think it passes some props the tamagui native input doesn't
  // we should see why input-next doesn't work and get it to work
  return (
    <StyledInput
      {...refProps}
      {...rest}
      // @ts-ignore
      onKeyDown={(e) => {
        const isEmpty = e.target.value === ''

        // why does this not blur jesus
        // if (e.key === 'Escape') {
        //   if (isEmpty) {
        //     e.target.blur()
        //     return
        //   }
        // }

        if (context.layout === 'grid' && isEmpty) {
          if (e.key === 'ArrowRight') {
            context.down()
            return
          }
          if (e.key === 'ArrowLeft') {
            context.up()
            return
          }
        }

        // @ts-ignore
        refProps.onKeyDown(e)
        rest.onKeyDown?.(e)
      }}
      // @ts-ignore
      onChange={(e) => {
        context.setSearch(e.target.value)
        onChangeText?.(e.target.value)
        props.onChange?.(e as any)
      }}
    />
  )
})
