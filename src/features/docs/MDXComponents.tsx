import {
  Children,
  isValidElement,
  type ComponentProps,
  type ElementType,
  type ReactNode,
} from 'react'
import { html, Paragraph, styled, XStack, YStack } from 'tamagui'
import type { MDXComponents } from 'mdx/types'

import { Link } from '~/interface/app/Link'
import { H1, H2, H3, H4, H5 } from '~/interface/text/Headings'

import { CodeInline } from './Code'
import { DocsCodeBlock } from './DocsCodeBlock'
import { ProBadge } from './ProBadge'
import { RouteTree } from './RouteTree'
import { SimpleTable } from './SimpleTable'
import { WIPBadge } from './WIPBadge'

const BaseParagraph = styled(html.p, {
  fontFamily: 'body',
  fontSize: '5',
  lineHeight: '5',
  my: '2',
})

const TableFrame = styled(YStack, {
  my: '4',
  borderWidth: 1,
  borderColor: 'color4',
  rounded: '4',
  overflow: 'hidden',
})

const TableRow = styled(XStack, {
  borderBottomWidth: 1,
  borderBottomColor: 'color4',
})

const TableCell = styled(YStack, {
  px: '3',
  py: '2',
  flex: 1,
})

const TableHeaderCell = styled(YStack, {
  px: '3',
  py: '2',
  flex: 1,
  bg: 'color2',
})

type ContentProps<Component extends ElementType> = Pick<
  ComponentProps<Component>,
  Extract<'children' | 'className' | 'id', keyof ComponentProps<Component>>
>

const components = {
  h1: ({ children, className, id }: ContentProps<typeof H1>) => (
    <H1 fontSize="9" lineHeight="9" mb="4" data-heading className={className} id={id}>
      {children}
    </H1>
  ),
  h2: ({ children, className, id }: ContentProps<typeof H2>) => (
    <H2
      fontSize="8"
      lineHeight="8"
      mb="2"
      pt="4"
      data-heading
      className={className}
      id={id}
    >
      {children}
    </H2>
  ),
  h3: ({ children, className, id }: ContentProps<typeof H3>) => (
    <H3
      fontSize="6"
      lineHeight="6"
      mt="3"
      mb="2"
      data-heading
      className={className}
      id={id}
    >
      {children}
    </H3>
  ),
  h4: ({ children, className, id }: ContentProps<typeof H4>) => (
    <H4
      fontSize="6"
      lineHeight="6"
      mt="4"
      mb="2"
      data-heading
      className={className}
      id={id}
    >
      {children}
    </H4>
  ),
  h5: ({ children, className, id }: ContentProps<typeof H5>) => (
    <H5
      fontSize="5"
      lineHeight="5"
      mt="3"
      mb="2"
      data-heading
      className={className}
      id={id}
    >
      {children}
    </H5>
  ),

  p: ({ children, className, id }: ContentProps<typeof BaseParagraph>) => (
    <BaseParagraph className={className} id={id}>
      {children}
    </BaseParagraph>
  ),

  strong: ({ children, className, id }: ContentProps<typeof html.strong>) => (
    <html.strong fontWeight="700" className={className} id={id}>
      {children}
    </html.strong>
  ),

  ul: ({ children, className, id }: ContentProps<typeof html.ul>) => (
    <html.ul mt="3" mb="3" ml="2" pl={40} className={className} id={id}>
      {children}
    </html.ul>
  ),
  ol: ({ children, className, id }: ContentProps<typeof html.ol>) => (
    <html.ol mt="3" mb="3" ml="2" pl={40} className={className} id={id}>
      {children}
    </html.ol>
  ),
  li: ({ children, className, id }: ContentProps<typeof html.li>) => (
    <html.li className={className} id={id}>
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <html.span>{child}</html.span>
        ) : (
          child
        ),
      )}
    </html.li>
  ),

  a: ({ href, children }: Pick<ComponentProps<typeof html.a>, 'children' | 'href'>) => {
    if (!href) {
      return <>{children}</>
    }
    const isExternal = href.startsWith('http')
    return (
      <Link
        href={href as ComponentProps<typeof Link>['href']}
        target={isExternal ? '_blank' : undefined}
      >
        {children}
      </Link>
    )
  },

  code: ({ children }: Pick<ComponentProps<typeof CodeInline>, 'children'>) => (
    <CodeInline>{children}</CodeInline>
  ),

  pre: ({ children }: { children?: ReactNode }) => {
    // children is the <code> element for fenced blocks
    const code = isValidElement<{ className?: string; children?: ReactNode }>(children)
      ? children
      : undefined
    const className = code?.props.className
    const content = code?.props.children
    return <DocsCodeBlock className={className}>{content}</DocsCodeBlock>
  },

  blockquote: ({ children, className, id }: ContentProps<typeof html.blockquote>) => (
    <html.blockquote
      my="4"
      px="4"
      py="3"
      ml="3"
      borderLeftWidth={3}
      borderLeftColor="color6"
      bg="color2"
      rounded="3"
      className={className}
      id={id}
    >
      {children}
    </html.blockquote>
  ),

  hr: () => <html.hr h={1} bg="color4" my="6" />,

  img: ({ alt, src }: Partial<Pick<ComponentProps<typeof html.img>, 'alt' | 'src'>>) => (
    <html.img maxW="100%" h="auto" my="4" rounded="3" alt={alt} src={src} />
  ),

  table: ({ children, className, id }: ContentProps<typeof TableFrame>) => (
    <TableFrame className={className} id={id}>
      {children}
    </TableFrame>
  ),
  thead: ({ children, className, id }: ContentProps<typeof YStack>) => (
    <YStack className={className} id={id}>
      {children}
    </YStack>
  ),
  tbody: ({ children, className, id }: ContentProps<typeof YStack>) => (
    <YStack className={className} id={id}>
      {children}
    </YStack>
  ),
  tr: ({ children, className, id }: ContentProps<typeof TableRow>) => (
    <TableRow borderBottomWidth={1} className={className} id={id}>
      {children}
    </TableRow>
  ),
  th: ({ children, className, id }: ContentProps<typeof Paragraph>) => (
    <TableHeaderCell>
      <Paragraph size="4" fontWeight="600" className={className} id={id}>
        {children}
      </Paragraph>
    </TableHeaderCell>
  ),
  td: ({ children, className, id }: ContentProps<typeof Paragraph>) => (
    <TableCell>
      <Paragraph size="4" className={className} id={id}>
        {children}
      </Paragraph>
    </TableCell>
  ),

  ProBadge,
  RouteTree,
  SimpleTable,
  WIPBadge,
} satisfies MDXComponents

export { components }
