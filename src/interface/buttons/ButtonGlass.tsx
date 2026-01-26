import { forwardRef } from 'react'
import { type TamaguiElement, useTheme } from 'tamagui'

import { ButtonSimple, type ButtonSimpleProps } from './ButtonSimple'

export type ButtonGlassProps = Omit<ButtonSimpleProps, 'glass'>

export const ButtonGlass = forwardRef<TamaguiElement, ButtonGlassProps>(
  ({ glassTint, theme, ...props }, ref) => {
    const themeContext = useTheme()

    // auto-derive glassTint from theme if not explicitly provided
    const derivedTint =
      glassTint ?? (theme === 'accent' ? themeContext.color9?.val : undefined)

    console.info('ButtonGlass', { theme, derivedTint, color9: themeContext.color9?.val })

    return (
      <ButtonSimple
        ref={ref}
        glass
        glassTint={derivedTint || 'red'}
        theme={theme}
        {...props}
      />
    )
  }
)
