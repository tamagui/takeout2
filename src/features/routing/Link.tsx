import {
  router,
  useLinkTo,
  useNavigation,
  type Href,
  type LinkProps as OneLinkProps,
} from 'one'
import { isWeb, Text, useDebounce, type TextProps } from 'tamagui'
import {
  wrapWithTooltip,
  type TooltipWrapperProps,
} from '~/interface/tooltip/TooltipSimple'

type ResetStackConfig = {
  index?: number
  routes: Array<{ key: string; name: string; params?: any }>
}

export type LinkProps = OneLinkProps<Href> &
  TextProps & {
    delayNavigation?: number | boolean
    resetStack?: boolean | ResetStackConfig // Reset navigation stack with custom routes (native only)
  } & Omit<TooltipWrapperProps, 'popover'>

export const Link = ({
  href,
  replace,
  asChild,
  disabled,
  passThrough,
  delayNavigation,
  resetStack,
  tooltip,
  tooltipDelayed,
  tooltipPlacement,
  ...props
}: LinkProps) => {
  const linkProps = useLinkTo({ href: href as string, replace })
  const navigation = useNavigation()

  // use debounce ton avoid multiple presses on accident that can cause navigation issues
  const handlePress = useDebounce(
    (e) => {
      props.onPress?.(e)

      if (e.defaultPrevented) {
        return
      }

      // Case 1: Reset stack for native (most specific navigation behavior)
      if (resetStack && !isWeb) {
        e.preventDefault()

        if (typeof resetStack === 'object') {
          // Use custom reset configuration
          navigation.reset({
            index: resetStack.index ?? 0,
            routes: resetStack.routes as any,
          })
        } else {
          // Default behavior: reset to the href route
          const routeName = href.toString().replace(/^\//, '')
          navigation.reset({
            index: 0,
            routes: [{ key: routeName, name: routeName } as any],
          })
        }
        return
      }

      // Case 2: Delayed navigation (with replace support)
      if (delayNavigation) {
        e.preventDefault()
        setTimeout(
          () => {
            if (replace) {
              router.replace(href)
            } else {
              router.navigate(href)
            }
          },
          typeof delayNavigation === 'number' ? delayNavigation : 50
        )
        return
      }

      // Case 3: Replace navigation
      if (replace) {
        e.preventDefault()
        router.replace(href)
        return
      }

      // Case 4: Default behavior using linkProps
      linkProps.onPress(e)
    },
    1000,
    {
      leading: true,
    }
  )

  if (passThrough) {
    return props.children
  }

  const linkElement = (
    <Text
      tag="a"
      disabled={!!disabled}
      // always except-style
      asChild={asChild ? 'except-style' : false}
      className="t_Link"
      cursor="pointer"
      $platform-web={{
        color: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
      }}
      focusVisibleStyle={{
        outlineWidth: 2,
        outlineColor: '$color02',
        outlineOffset: 1,
        outlineStyle: 'solid',
        rounded: '$4',
      }}
      {...props}
      {...linkProps}
      onPress={handlePress}
    />
  )

  return wrapWithTooltip(linkElement, {
    tooltip,
    tooltipDelayed,
    tooltipPlacement,
  })
}
