import { IS_SAFARI, IS_ANDROID, IS_WEB, sleep } from '@take-out/helpers'
import { createElement, forwardRef, isValidElement } from 'react'
import { Platform } from 'react-native'
import {
  createStyledContext,
  type GetProps,
  styled,
  type TamaguiElement,
  Text,
  View,
  withStaticProperties,
  XStack,
} from 'tamagui'

import { IS_NATIVE } from '~/constants/platform'

import { GlassView } from '../effects/GlassView'
import { Glint } from '../effects/Glint'
import {
  heavyImpact,
  lightImpact,
  mediumImpact,
  rigidImpact,
  softImpact,
} from '../haptics/haptics'
import { closeOpenTooltips } from '../tooltip/closeOpenTooltips'
import { type TooltipWrapperProps, wrapWithTooltip } from '../tooltip/Tooltip'
import { wrapChildrenInText } from './wrapChildrenInText'

import type { HapticStyle } from '../haptics/haptics'
import type { IconProps } from '@tamagui/helpers-icon'
import type { RadiusTokens } from 'tamagui'

type ButtonAdditionalProps = {
  delayPress?: boolean
  disableGlint?: boolean
  disableBackground?: boolean
  fixedWidth?: boolean
  fontFamily?: string
  glass?: boolean
  glassTint?: string
  glow?: boolean
  haptic?: HapticStyle
  icon?: any
  iconAfter?: boolean
  iconProps?: IconProps
  isInteractive?: boolean
  keepTooltipOpen?: boolean
  scaleIcon?: number
} & TooltipWrapperProps

type ButtonSizes = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'square' | 'tiny'

type ButtonVariants =
  | 'action'
  | 'default'
  | 'transparent'
  | 'subtle'
  | 'floating'
  | 'outlined'

const context = createStyledContext({
  active: false,
  cursor: 'pointer',
  size: 'medium' as ButtonSizes,
  fontFamily: 'mono',
  circular: false,
  variant: 'default' as ButtonVariants,
})

const useContext = context.useStyledContext

const buttonBorderRadius: Record<ButtonSizes, RadiusTokens> = {
  small: IS_WEB ? '4' : '5',
  medium: IS_WEB ? '5' : '6',
  large: IS_WEB ? '6' : '7',
  xl: IS_WEB ? '7' : '8',
  xxl: IS_WEB ? '9' : '8',
  tiny: IS_WEB ? '3' : '4',
  square: '0',
}

// = minW and height
const buttonSizes: Record<ButtonSizes, number> = {
  small: IS_WEB ? 30 : 40,
  medium: IS_WEB ? 38 : 44,
  large: IS_WEB ? 46 : 52,
  xl: IS_WEB ? 52 : 60,
  xxl: IS_WEB ? 60 : 72,
  tiny: IS_WEB ? 16 : 32,
  square: IS_WEB ? 36 : 44,
}

const iconSizes: Record<ButtonSizes, number> = {
  large: 16,
  xl: 20,
  xxl: 30,
  medium: 14,
  small: 12,
  tiny: 10,
  square: 14,
}

const ButtonFrame = styled(XStack, {
  context,
  render: 'button',
  position: 'relative',
  group: 'button',
  bg: 'transparent',
  containerType: 'normal',
  borderWidth: 0,
  items: 'center',
  justify: 'center',
  gap: '2-5',
  px: '2-5',
  rounded: '5',
  cursor: 'default',
  opacity: 'press:0.5',
  outlineWidth: 'focus-visible:1px',
  outlineStyle: 'focus-visible:solid',
  outlineColor: 'focus-visible:outline-color',
  role: 'button',
  tabIndex: 0,
  variants: {
    disabled: {
      true: {
        pointerEvents: 'none',
      },
    },

    elevated: {
      true: {
        bg: 'hover:color3 press:color1',
      },
    },

    active: {
      true: {},
    },

    variant: {
      action: {},
      default: {},
      floating: {},
      outlined: {},
      transparent: {},
      subtle: {},
    },

    size: {
      small: {
        minH: buttonSizes.small,
        minW: buttonSizes.small,
        rounded: buttonBorderRadius.small,
        gap: '2',
        px: `${IS_WEB ? '2-5' : '4'}`,
      },
      large: {
        minH: buttonSizes.large,
        minW: buttonSizes.large,
        rounded: buttonBorderRadius.large,
        gap: '3',
        px: `${IS_WEB ? '4' : '5'}`,
      },
      xl: {
        minH: buttonSizes.xl,
        minW: buttonSizes.xl,
        rounded: buttonBorderRadius.xl,
        gap: '3-5',
        px: `${IS_WEB ? '5' : '6'}`,
      },
      xxl: {
        minH: buttonSizes.xxl,
        minW: buttonSizes.xxl,
        rounded: buttonBorderRadius.xxl,
        gap: '4',
        px: `${IS_WEB ? '6' : '7'}`,
      },
      medium: {
        minH: buttonSizes.medium,
        minW: buttonSizes.medium,
        rounded: buttonBorderRadius.medium,
        px: `${IS_WEB ? '2-5' : '4'}`,
      },
      square: {
        w: buttonSizes.square,
        h: buttonSizes.square,
        rounded: buttonBorderRadius.square,
        items: 'center',
        justify: 'center',
      },
      tiny: {
        minH: buttonSizes.tiny,
        minW: buttonSizes.tiny,
        rounded: buttonBorderRadius.tiny,
        gap: '1',
        px: '2',
      },
    },

    circular: {
      true: (
        _: boolean,
        { props }: { props: { width?: number; height?: number; size?: ButtonSizes } },
      ) => {
        const size = props.width || props.height || buttonSizes[props.size || 'medium']
        return {
          padding: 0,
          rounded: 100,
          width: size,
          height: size,
          maxWidth: size,
          maxHeight: size,
          minWidth: size,
          minHeight: size,
        }
      },
    },

    isAccent: {
      true: {
        bg: 'color1 hover:color1 press:color1',
        opacity: 'press:0.6',
        outlineWidth: 'focus-visible:3px',
        outlineStyle: 'focus-visible:solid',
        outlineColor: 'focus-visible:outline-color',
      },
    },
  } as const,
})

const ButtonText = styled(Text, {
  context,
  color: 'color12 group-press/button:color8',
  cursor: 'default',
  fontFamily: 'mono',
  fontWeight: '600',
  select: 'none',
  y: IS_SAFARI ? 1 : 0,
  ellipsis: true,
  variants: {
    size: {
      small: {
        fontSize: '3',
        lineHeight: '3',
      },

      medium: {
        fontSize: '4',
        lineHeight: '4',
      },

      large: {
        fontSize: '5',
        lineHeight: '5',
      },

      xl: {
        fontSize: '7',
        lineHeight: '7',
      },
    },
  } as const,
  defaultVariants: {
    size: 'medium',
  },
})

type ButtonIconProps = {
  icon?: any
  iconSize?: number
  iconOpacity?: number
  scaleIcon?: number
} & IconProps

const ButtonIcon = ({
  icon,
  iconSize: iconSizeProp,
  scaleIcon = 1,
  iconOpacity = 0.5,
  ...iconProps
}: ButtonIconProps) => {
  const context = useContext()
  const iconSize = iconSizeProp ?? iconSizes[context.size || 'medium']

  if (!icon) {
    return null
  }

  const iconElement = isValidElement(icon)
    ? icon
    : createElement(icon, {
        size: iconSize * scaleIcon,
        opacity: iconOpacity,
        ...iconProps,
      })

  return iconElement
}

export type ButtonProps = Omit<
  GetProps<typeof ButtonFrame>,
  keyof ButtonAdditionalProps
> &
  ButtonAdditionalProps

const ButtonComponent = forwardRef<TamaguiElement, ButtonProps>(
  (
    {
      children,
      delayPress,
      disabled,
      disableGlint,
      disableBackground,
      fontFamily = 'mono',
      glass,
      glassTint,
      glow,
      haptic,
      icon,
      iconAfter,
      iconProps,
      isInteractive,
      keepTooltipOpen,
      popover,
      scaleIcon = 1,
      theme,
      tooltip,
      tooltipDelayed,
      tooltipPlacement,
      ...rest
    },
    ref,
  ) => {
    const handleHaptic = () => {
      if (!haptic) return
      if (haptic === true || haptic === 'light') {
        lightImpact()
      } else if (haptic === 'medium') {
        mediumImpact()
      } else if (haptic === 'heavy') {
        heavyImpact()
      } else if (haptic === 'soft') {
        softImpact()
      } else if (haptic === 'rigid') {
        rigidImpact()
      }
    }
    // avoid de-structuring which messes up style order from parents
    const variant = rest.variant
    const isAction = variant === 'action'
    // action variant defaults to accent theme, but can be overridden
    const resolvedTheme = isAction && !theme ? 'accent' : theme

    // legacy icon support
    const sizeKey: ButtonSizes =
      typeof rest.size === 'string' && rest.size in iconSizes
        ? (rest.size as ButtonSizes)
        : 'medium'

    const iconElement = icon ? (
      <ButtonIcon
        icon={icon}
        iconSize={iconSizes[sizeKey]}
        scaleIcon={scaleIcon}
        iconOpacity={resolvedTheme === 'accent' ? 1 : 0.5}
        {...iconProps}
      />
    ) : null

    // determine if glint should be shown
    const shouldShowGlint = () => {
      // TODO(nate) getting an error "Exception in HostFunction: TypeError: expected dynamic type 'int/double...' but had type object"
      if (Platform.OS === 'ios') return false
      if (disableGlint) return false
      if (rest.size === 'square') return false
      if (variant === 'transparent' || variant === 'subtle') return false

      // on web, show glint even with glass
      if ((IS_WEB || IS_ANDROID) && glass) return true

      // on native, don't show glint with glass
      return !glass
    }

    const buttonElement = (
      <ButtonFrame
        size="medium"
        ref={ref}
        theme={resolvedTheme}
        isAccent={resolvedTheme === 'accent'}
        disabled={disabled}
        className={glow ? 'path-glow' : ''}
        {...(disabled && {
          opacity: 0.5,
          pointerEvents: 'none',
          cursor: 'not-allowed',
        })}
        onPressIn={(e) => {
          handleHaptic()
          rest.onPressIn?.(e)
        }}
        onPressOut={() => {
          if (!keepTooltipOpen) {
            closeOpenTooltips()
          }
        }}
        {...rest}
        {...(delayPress && {
          async onPress(e) {
            // just a bit of time
            // some form inputs for selecting files freeze on the press style
            // this lets you show the unpress before opening the system dialog
            await sleep(20)
            rest.onPress?.(e)
          },
        })}
      >
        {shouldShowGlint() && <ButtonGlint data-testid="button-glint" bottomShadow />}

        {variant !== 'outlined' && !disableBackground && !glass && <ButtonBackground />}
        {variant === 'outlined' && <ButtonOutline />}

        {!iconAfter && iconElement}

        {/* avoid gap on text when passed like <Button>name {name}</Button> */}
        {wrapChildrenInText(ButtonText, { children }, { fontFamily })}

        {iconAfter && iconElement}
      </ButtonFrame>
    )

    // wrap with glass view if requested (not supported on web)
    const glassWrappedElement =
      glass && IS_NATIVE ? (
        <GlassView
          glassEffectStyle="clear"
          isInteractive={isInteractive}
          borderRadius={rest.circular ? 100 : undefined}
          tintColor={glassTint}
          containerStyle={
            rest.circular
              ? {
                  width: buttonSizes[sizeKey],
                  height: buttonSizes[sizeKey],
                }
              : ({
                  flex: rest.flex,
                  flexGrow: rest.grow,
                  flexShrink: rest.shrink,
                  alignSelf: rest.self,
                } as any)
          }
        >
          {buttonElement}
        </GlassView>
      ) : (
        buttonElement
      )

    return wrapWithTooltip(glassWrappedElement, {
      tooltip,
      tooltipDelayed,
      tooltipPlacement,
      popover,
    })
  },
)

const buttonFrameVariants = {
  circular: {
    true: {
      rounded: 100,
    },
  },

  variant: {
    subtle: {
      display: 'none',
    },
  },

  size: {
    tiny: {
      rounded: buttonBorderRadius.tiny,
    },
    small: {
      rounded: buttonBorderRadius.small,
    },
    medium: {
      rounded: buttonBorderRadius.medium,
    },
    large: {
      rounded: buttonBorderRadius.large,
    },
    xl: {
      rounded: buttonBorderRadius.xl,
    },
    square: {
      rounded: 5,
      opacity: 0,
    },
  },
} as const

const ButtonBackground = styled(View, {
  context,
  position: 'absolute',
  pointerEvents: 'none',
  inset: 0,
  z: -1,
  bg: 'color1 group-hover/button:color4 group-press/button:color12',
  opacity: '0.4 group-hover/button:0.4 group-press/button:0.05',
  borderWidth: 'light:1px',
  borderColor: 'light:color5',
  variants: {
    ...buttonFrameVariants,

    active: {
      true: {
        // inset: 2, // inset 2 looks better on messagebottombar, this is better on buttonActive
        bg: 'color4 group-hover/button:color4 group-hover/button:light:color11 group-press/button:color2',
        opacity:
          '0.5 group-hover/button:1 group-hover/button:light:1 group-press/button:0.5',
      },
    },

    variant: {
      transparent: {
        bg: 'transparent group-press/button:transparent',
        opacity: '0 group-hover/button:0.2 group-press/button:0',
      },

      subtle: {
        bg: 'color4',
        opacity: '0 group-hover/button:0.2',
      },

      floating: {
        opacity: '1 group-hover/button:1 group-press/button:1',
        bg: 'color4 group-hover/button:color5 group-press/button:color3',
        shadowColor: 'shadow-color',
        shadowRadius: 5,
        shadowOffset: { height: 2, width: 0 },
      },
    },
  } as const,
})

const ButtonOutline = styled(View, {
  context,
  position: 'absolute',
  pointerEvents: 'none',
  inset: 0,
  z: 0,
  borderWidth: 2,
  borderColor: 'color2 group-hover/button:color3 group-press/button:color1',
  variants: {
    ...buttonFrameVariants,

    active: {
      true: {
        borderColor: 'color8 group-hover/button:color8 group-press/button:color8',
      },
    },
  } as const,
})

const ButtonGlint = styled(Glint, {
  context,
  bottomShadow: true,
  variants: buttonFrameVariants,
})

export const Button = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
  Icon: ButtonIcon,
})
