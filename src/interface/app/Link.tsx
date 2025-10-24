import { ExternalLink } from '@tamagui/lucide-icons'
import { router, useLinkTo, type Href, type LinkProps as OneLinkProps } from 'one'
import { Text, type TextProps } from 'tamagui'
import { wrapWithTooltip, type TooltipWrapperProps } from '../tooltip/TooltipSimple'

export type LinkProps = OneLinkProps<Href> &
  TextProps & {
    delayNavigation?: number | boolean

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
  linkMeta,
  tooltip,
  tooltipDelayed,
  tooltipPlacement,
  target,
  children,
  ...props
}: LinkProps) => {
  const linkProps = useLinkTo({ href: href as string, replace })

  if (passThrough) {
    return children
  }

  const childrenElements =
    target === '_blank' ? (
      <>
        {children}

        {target === '_blank' && (
          <ExternalLink size={12} opacity={0.5} display="inline-flex" ml={4} />
        )}
      </>
    ) : (
      children
    )

  const linkElement = (
    <Text
      tag="a"
      target={target}
      disabled={!!disabled}
      // always except-style
      asChild={asChild ? 'except-style' : false}
      className="t_Link"
      cursor="pointer"
      $platform-web={{
        color: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontFamily: 'inherit',
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
      onPress={(e) => {
        props.onPress?.(e)

        if (e.defaultPrevented) {
          return
        }

        if (delayNavigation) {
          e.preventDefault()
          setTimeout(() => {
            router.navigate(href)
          }, 50)
        } else {
          linkProps.onPress(e)
        }
      }}
    >
      {childrenElements}
    </Text>
  )

  return wrapWithTooltip(linkElement, {
    tooltip,
    tooltipDelayed,
    tooltipPlacement,
  })
}
