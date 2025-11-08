import { createElement, useRef } from 'react'
import { SizableText, Spacer, XStack, YStack } from 'tamagui'
import { Link } from '~/interface/app/Link'
import { ExternalIcon } from '~/interface/icons/ExternalIcon'
import type { NavItemProps } from './types'

export const DocsRouteNavItem = function DocsRouteNavItem({
  children,
  active,
  href,
  icon,
  pending,
  inMenu,
  index,
  external,
}: NavItemProps & {
  icon?: any
  inMenu?: boolean
  index: number
}) {
  const isExternal = external || href.startsWith('http')
  const ref = useRef<any>(null)

  return (
    <Link
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      href={href as any}
    >
      <XStack
        ref={ref}
        className="docs-nav-item"
        alignItems="center"
        justifyContent="flex-end"
        px="$4"
        py="$1"
        opacity={pending ? 0.25 : 1}
        pressStyle={{
          bg: '$background04',
        }}
        pointerEvents={pending ? 'none' : ('inherit' as any)}
        position="relative"
        $sm={{
          py: '$1.5',
        }}
        {...(inMenu &&
          ({
            justifyContent: 'flex-start',
          } as any))}
        {...({} as any)}
      >
        {!inMenu && (
          <YStack
            className="sidebar-indicator"
            opacity={active ? 1 : 0}
            position="absolute"
            t={0}
            b={0}
            l={0}
            borderRadius="$2"
            width={2}
            bg={active ? '$color10' : '$backgroundHover'}
            {...({} as any)}
          />
        )}
        <SizableText
          size="$5"
          lineHeight="$5"
          cursor="pointer"
          select="none"
          color="$color12"
          opacity={active ? 1 : 0.65}
          width="100%"
          hoverStyle={{
            opacity: 0.85,
          }}
          {...(active && {
            fontWeight: '700',
            opacity: 1,
          })}
        >
          {children}
          {!!icon && (
            <>
              &nbsp;
              {createElement(icon, {
                size: 12,
              })}
            </>
          )}
        </SizableText>
        {isExternal && (
          <XStack opacity={0.5}>
            <Spacer size="$2" />
            <ExternalIcon />
          </XStack>
        )}
        {pending ? (
          <>
            <XStack flex={1} />
            <SizableText size="$1" px="$2" py="$1" bg="$background" rounded="$3">
              WIP
            </SizableText>
          </>
        ) : null}
      </XStack>
    </Link>
  )
}
