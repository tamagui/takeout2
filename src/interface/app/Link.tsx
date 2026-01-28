import {
  router,
  useLinkTo,
  useNavigation,
  type Href,
  type LinkProps as OneLinkProps,
} from 'one'
import { isWeb, SizableText, useDebounce, View, type SizableTextProps } from 'tamagui'

import { ArrowUpRightIcon } from '~/interface/icons/phosphor/ArrowUpRightIcon'

import { wrapWithTooltip, type TooltipWrapperProps } from '../tooltip/Tooltip'

type ResetStackConfig = {
  index?: number
  routes: Array<{ key: string; name: string; params?: any }>
}

export type LinkProps = OneLinkProps<Href> &
  SizableTextProps & {
    delayNavigation?: number | boolean
    resetStack?: boolean | ResetStackConfig // reset navigation stack with custom routes (native only)
    hideExternalIcon?: boolean // hide the external link icon for target="_blank" links

    // allows us to attach data to the last navigated link
    linkMeta?: LinkMeta
  } & Omit<TooltipWrapperProps, 'popover'>

export type LinkMeta =
  | { type: 'none' }
  | {
      type: 'open-thread'
      threadId: string
    }

let lastLinkMeta: LinkMeta = { type: 'none' }
let lastLinkMetaAt = 0

export function getLastLinkMeta() {
  return {
    ...lastLinkMeta,
    at: lastLinkMetaAt,
    get recent() {
      return Date.now() - lastLinkMetaAt < 2000
    },
  }
}

export const Link = ({
  href,
  replace,
  asChild,
  disabled,
  passThrough,
  delayNavigation,
  resetStack,
  hideExternalIcon,
  linkMeta,
  tooltip,
  tooltipDelayed,
  tooltipPlacement,
  target,
  children,
  ...props
}: LinkProps) => {
  const linkProps = useLinkTo({ href: href as string, replace })
  const navigation = useNavigation()

  // use debounce to avoid multiple presses on accident that can cause navigation issues
  const handlePress = useDebounce(
    (e) => {
      props.onPress?.(e)

      if (e.defaultPrevented) {
        return
      }

      // case 1: reset stack for native (most specific navigation behavior)
      if (resetStack && !isWeb) {
        e.preventDefault()

        if (typeof resetStack === 'object') {
          // use custom reset configuration
          navigation.reset({
            index: resetStack.index ?? 0,
            routes: resetStack.routes as any,
          })
        } else {
          // default behavior: reset to the href route
          const routeName = href.toString().replace(/^\//, '')
          navigation.reset({
            index: 0,
            routes: [{ key: routeName, name: routeName } as any],
          })
        }
        return
      }

      // case 2: delayed navigation (with replace support)
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

      // case 3: replace navigation
      if (replace) {
        e.preventDefault()
        router.replace(href)
        return
      }

      // case 4: default behavior using linkProps
      linkProps.onPress(e)
    },
    1000,
    {
      leading: true,
    }
  )

  if (passThrough) {
    return children
  }

  const childrenElements =
    target === '_blank' && !hideExternalIcon ? (
      <>
        {children}

        <View
          render="span"
          ml={4}
          opacity={0.7}
          $platform-web={{ display: 'inline-flex', marginRight: -5, y: -9, x: -2 }}
        >
          <ArrowUpRightIcon size={8} />
        </View>
      </>
    ) : (
      children
    )

  const linkElement = (
    <SizableText
      render="a"
      target={target}
      disabled={!!disabled}
      // always except-style
      asChild={asChild ? 'except-style' : false}
      className="t_Link"
      cursor="pointer"
      $platform-web={{
        color: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
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
      onPressIn={() => {
        lastLinkMeta = linkMeta || { type: 'none' }
        lastLinkMetaAt = Date.now()
      }}
      onPress={handlePress}
    >
      {childrenElements}
    </SizableText>
  )

  return wrapWithTooltip(linkElement, {
    tooltip,
    tooltipDelayed,
    tooltipPlacement,
  })
}
