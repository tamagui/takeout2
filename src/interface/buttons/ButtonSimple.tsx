import { IS_SAFARI, isAndroid, isWeb, sleep } from '@take-out/helpers'
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

import { GlassView } from '../effects/GlassView'
import Glint from '../effects/Glint'
import { closeOpenTooltips } from '../tooltip/closeOpenTooltips'
import { type TooltipWrapperProps, wrapWithTooltip } from '../tooltip/TooltipSimple'
import { wrapChildrenInText } from './wrapChildrenInText'

import type { IconProps } from '@tamagui/helpers-icon'
import type { FontFamilyTokens, RadiusTokens } from 'tamagui'

type ButtonSimpleAdditionalProps = {
  delayPress?: boolean
  disableGlint?: boolean
  disableBackground?: boolean
  fixedWidth?: boolean
  fontFamily?: string
  glass?: boolean
  glassTint?: string
  glow?: boolean
  icon?: any
  iconAfter?: boolean
  iconProps?: IconProps
  isInteractive?: boolean
  keepTooltipOpen?: boolean
  scaleIcon?: number
} & TooltipWrapperProps

type ButtonSizes = 'small' | 'medium' | 'large' | 'square' | 'tiny'

type ButtonVariants =
  | 'accent'
  | 'default'
  | 'transparent'
  | 'subtle'
  | 'floating'
  | 'outlined'

const context = createStyledContext({
  active: false,
  cursor: 'default',
  size: 'medium' as ButtonSizes,
  fontFamily: '$mono' as FontFamilyTokens,
  circular: false,
  variant: 'default' as ButtonVariants,
})

const useContext = context.useStyledContext

const buttonBorderRadius: Record<ButtonSizes, RadiusTokens> = {
  small: '$4',
  medium: '$5',
  large: '$6',
  tiny: '$3',
  square: 0,
}

const buttonWidths: Record<ButtonSizes, number> = {
  small: 30,
  medium: 36,
  large: 42,
  tiny: 16,
  square: 36,
}

const iconSizes: Record<ButtonSizes, number> = {
  large: 16,
  medium: 14,
  small: 12,
  tiny: 10,
  square: 14,
}

const ButtonFrame = styled(XStack, {
  context,
  render: 'button',
  focusable: true,
  role: 'button',
  group: 'button',
  bg: 'transparent',
  containerType: 'normal',
  tabIndex: 0,
  borderWidth: 0,
  items: 'center',
  justify: 'center',
  gap: '$2.5',
  minH: 32,
  minW: 36,
  px: '$2.5',
  rounded: '$5',
  cursor: 'default',
  position: 'relative',

  pressStyle: {
    opacity: 0.5,
  },

  focusVisibleStyle: {
    outlineWidth: 1,
    outlineStyle: 'solid',
    outlineColor: '$color02',
  },

  variants: {
    disabled: {
      true: {
        pointerEvents: 'none',
      },
    },

    elevated: {
      true: {
        hoverStyle: {
          bg: '$color3',
        },
        pressStyle: {
          bg: '$color1',
        },
      },
    },

    active: {
      true: {},
    },

    variant: {
      default: {},
      floating: {},
      outlined: {},
      transparent: {},
      subtle: {},
    },

    size: {
      small: {
        minH: 26,
        minW: buttonWidths.small,
        rounded: buttonBorderRadius.small,
        gap: '$2',
        px: '$2.5',
      },
      large: {
        minH: 50,
        minW: buttonWidths.large,
        rounded: buttonBorderRadius.large,
        gap: '$3',
        px: '$4',
      },
      medium: {
        minW: buttonWidths.medium,
        rounded: buttonBorderRadius.medium,
      },
      square: {
        width: buttonWidths.square,
        height: 32,
        rounded: buttonBorderRadius.square,
        items: 'center',
        justify: 'center',
      },
      tiny: {
        minH: 24,
        minW: buttonWidths.tiny,
        rounded: buttonBorderRadius.tiny,
        gap: '$1',
        px: '$2',
      },
    },

    circular: {
      true: (_, { props }) => {
        const sizeProp = (props as any).size as ButtonSizes
        const size = buttonWidths[sizeProp || 'medium']
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
        bg: '$color1',
        hoverStyle: {
          bg: '$color5',
        },

        pressStyle: {
          bg: '$color1',
          opacity: 1,
        },

        focusVisibleStyle: {
          outlineWidth: 3,
          outlineStyle: 'solid',
          outlineColor: '$background04',
        },
      },
    },
  } as const,
})

const ButtonText = styled(Text, {
  context,
  color: '$color',
  cursor: 'default',
  fontFamily: '$mono',
  fontWeight: '500',
  select: 'none',
  y: IS_SAFARI ? 1 : 0,

  '$group-button-press': {
    color: '$color8',
  },

  variants: {
    active: {
      true: {
        // '$theme-light': {
        //   color: '$color1',
        // },
      },
    },

    variant: {
      ':string': (val: string, { props }: any) => {
        if (val === 'outlined') {
          if (props.active) {
            return {
              // '$theme-light': {
              //   color: '$color11',
              // },
            }
          }

          return {
            // '$theme-light': {
            //   color: '$color11',
            // },
          }
        }
      },
    },

    size: {
      small: {
        fontSize: '$3',
        lineHeight: '$3',
      },

      medium: {
        fontSize: '$4',
        lineHeight: '$4',
      },

      large: {
        fontSize: '$5',
        lineHeight: '$5',
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

export type ButtonSimpleProps = GetProps<typeof ButtonFrame> & ButtonSimpleAdditionalProps

const ButtonComponent = forwardRef<TamaguiElement, ButtonSimpleProps>(
  (
    {
      children,
      delayPress,
      disabled,
      disableGlint,
      disableBackground,
      fontFamily = '$mono',
      glass,
      glassTint,
      glow,
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
    ref
  ) => {
    // avoid de-structuring which messes up style order from parents
    const variant = rest.variant

    // legacy icon support
    const iconElement = icon ? (
      <ButtonIcon
        icon={icon}
        iconSize={iconSizes[rest.size || 'medium']}
        scaleIcon={scaleIcon}
        iconOpacity={theme === 'accent' ? 1 : 0.5}
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
      if ((isWeb || isAndroid) && glass) return true

      // on native, don't show glint with glass
      return !glass
    }

    const buttonElement = (
      <ButtonFrame
        size="medium"
        ref={ref}
        theme={theme}
        isAccent={theme === 'accent'}
        disabled={disabled}
        className={glow ? 'path-glow' : ''}
        {...(disabled && {
          opacity: 0.1,
          pointerEvents: 'none',
          cursor: 'not-allowed',
        })}
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
        {shouldShowGlint() && <ButtonGlint bottomShadow />}

        {variant !== 'outlined' && !disableBackground && !glass && <ButtonBackground />}
        {variant === 'outlined' && <ButtonOutline />}

        {!iconAfter && iconElement}

        {/* avoid gap on text when passed like <ButtonSimple>name {name}</ButtonSimple> */}
        {wrapChildrenInText(ButtonText, { children }, { fontFamily })}

        {iconAfter && iconElement}
      </ButtonFrame>
    )

    // wrap with glass view if requested (not supported on web)
    const glassWrappedElement = glass ? (
      <GlassView
        glassEffectStyle="clear"
        isInteractive={isInteractive}
        borderRadius={rest.circular ? 100 : undefined}
        tintColor={glassTint}
        containerStyle={
          rest.circular
            ? {
                width: buttonWidths[rest.size || 'medium'],
                height: buttonWidths[rest.size || 'medium'],
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
  }
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
  bg: '$color1',
  opacity: 0.4,

  '$group-button-hover': {
    bg: '$color4',
    opacity: 0.4,
  },

  '$group-button-press': {
    bg: '$color12',
    opacity: 0.05,
  },

  '$theme-light': {
    borderWidth: 1,
    borderColor: '$color5',
  },

  variants: {
    ...buttonFrameVariants,

    active: {
      true: {
        // inset: 2, // inset 2 looks better on messagebottombar, this is better on buttonActive
        bg: '$color4',
        opacity: 0.5,

        '$group-button-hover': {
          bg: '$color4',
          opacity: 1,

          '$theme-light': {
            bg: '$color11',
            opacity: 1,
          },
        },

        '$group-button-press': {
          bg: '$color2',
          opacity: 0.5,
        },
      },
    },

    variant: {
      transparent: {
        bg: 'transparent',
        opacity: 0,

        '$group-button-hover': {
          opacity: 0.2,
        },

        '$group-button-press': {
          opacity: 0,
          bg: 'transparent',
        },
      },

      subtle: {
        bg: '$color4',
        opacity: 0,

        '$group-button-hover': {
          opacity: 0.2,
        },
      },

      floating: {
        opacity: 1,
        bg: '$color4',
        shadowColor: '$shadow2',
        shadowRadius: 5,
        shadowOffset: { height: 2, width: 0 },

        '$group-button-hover': {
          opacity: 1,
          bg: '$color5',
        },

        '$group-button-press': {
          opacity: 1,
          bg: '$color3',
        },
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
  borderColor: '$color2',

  '$group-button-hover': {
    borderColor: '$color3',
  },

  '$group-button-press': {
    borderColor: '$color1',
  },

  variants: {
    ...buttonFrameVariants,

    active: {
      true: {
        borderColor: '$color8',

        '$group-button-hover': {
          borderColor: '$color8',
        },

        '$group-button-press': {
          borderColor: '$color8',
        },
      },
    },
  } as const,
})

const ButtonGlint = styled(Glint, {
  context,
  bottomShadow: true,
  variants: buttonFrameVariants,
})

export const ButtonSimple = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
  Icon: ButtonIcon,
})
