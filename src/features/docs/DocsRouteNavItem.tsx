import { SizableText, Spacer, XStack } from 'tamagui'

import { Link } from '~/interface/app/Link'
import { ArrowSquareOutIcon } from '~/interface/icons/phosphor/ArrowSquareOutIcon'

import type { NavItemProps } from './types'

export const DocsRouteNavItem = function DocsRouteNavItem({
  children,
  active,
  href,
  pending,
  external,
}: NavItemProps) {
  const isExternal = external || href.startsWith('http')

  return (
    <Link
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      href={href as any}
    >
      <XStack
        data-nav-item
        className="docs-nav-item"
        items="center"
        py="1-5"
        px="2"
        rounded="3"
        opacity={pending ? 0.35 : 1}
        pointerEvents={pending ? 'none' : ('inherit' as any)}
        transition="web:background-color 100ms"
        bg="hover:color2 press:color2"
      >
        <SizableText
          size="4"
          cursor="pointer"
          select="none"
          color={active ? 'color12' : 'color10 hover:color12'}
          fontWeight={active ? '600' : '400'}
        >
          {children}
        </SizableText>

        {isExternal && (
          <XStack opacity={0.5} ml="2">
            <ArrowSquareOutIcon size={10} />
          </XStack>
        )}

        {pending && (
          <>
            <Spacer flex={1} />
            <SizableText size="1" color="color9">
              WIP
            </SizableText>
          </>
        )}
      </XStack>
    </Link>
  )
}
