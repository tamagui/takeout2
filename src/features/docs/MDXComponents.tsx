import { H1, H2, H3, H4, H5, Paragraph, styled, XStack, YStack } from 'tamagui'

import { Link } from '~/interface/app/Link'

import { CodeInline } from './Code'
import { DocsCodeBlock } from './DocsCodeBlock'
import { ProBadge } from './ProBadge'
import { RouteTree } from './RouteTree'
import { SimpleTable } from './SimpleTable'
import { WIPBadge } from './WIPBadge'

const BaseParagraph = styled(Paragraph, {
  size: '$5',
  my: '$2',
})

const scrollMargin = { scrollMarginTop: 100 }

const TableFrame = styled(YStack, {
  my: '$4',
  borderWidth: 1,
  borderColor: '$color4',
  rounded: '$4',
  overflow: 'hidden',
})

const TableRow = styled(XStack, {
  borderBottomWidth: 1,
  borderBottomColor: '$color4',
})

const TableCell = styled(YStack, {
  px: '$3',
  py: '$2',
  flex: 1,
})

const TableHeaderCell = styled(YStack, {
  px: '$3',
  py: '$2',
  flex: 1,
  bg: '$color2',
})

const components = {
  h1: (props: any) => (
    <H1 size="$9" mb="$4" data-heading style={scrollMargin} {...props} />
  ),
  h2: (props: any) => (
    <H2 size="$8" mb="$2" pt="$4" data-heading style={scrollMargin} {...props} />
  ),
  h3: (props: any) => (
    <H3 size="$6" mt="$3" mb="$2" data-heading style={scrollMargin} {...props} />
  ),
  h4: (props: any) => (
    <H4 size="$6" mt="$4" mb="$2" data-heading style={scrollMargin} {...props} />
  ),
  h5: (props: any) => (
    <H5 size="$5" mt="$3" mb="$2" data-heading style={scrollMargin} {...props} />
  ),

  p: (props: any) => <BaseParagraph {...props} />,

  strong: (props: any) => (
    <Paragraph
      render="strong"
      fontWeight="700"
      $platform-web={{
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
      {...props}
    />
  ),

  ul: (props: any) => <YStack render="ul" mt="$3" mb="$3" ml="$2" {...props} />,
  ol: (props: any) => <YStack render="ol" mt="$3" mb="$3" ml="$2" {...props} />,
  li: (props: any) => <BaseParagraph render="li" display="list-item" mt={0} {...props} />,

  a: ({ href, children }: any) => {
    const isExternal = href?.startsWith('http')
    return (
      <Link
        href={href}
        {...(isExternal && {
          target: '_blank',
        })}
      >
        {children}
      </Link>
    )
  },

  code: ({ children }: any) => <CodeInline>{children}</CodeInline>,

  pre: ({ children }: any) => {
    // children is the <code> element for fenced blocks
    const className = children?.props?.className
    const content = children?.props?.children
    return <DocsCodeBlock className={className}>{content}</DocsCodeBlock>
  },

  blockquote: (props: any) => (
    <YStack
      render="blockquote"
      my="$4"
      px="$4"
      py="$3"
      ml="$3"
      borderLeftWidth={3}
      borderLeftColor="$color6"
      bg="$color2"
      borderRadius="$3"
      {...props}
    />
  ),

  hr: () => <YStack height={1} bg="$color4" my="$6" />,

  img: (props: any) => (
    <YStack
      render="img"
      maxWidth="100%"
      height="auto"
      my="$4"
      borderRadius="$3"
      {...props}
    />
  ),

  table: (props: any) => <TableFrame {...props} />,
  thead: (props: any) => <YStack {...props} />,
  tbody: (props: any) => <YStack {...props} />,
  tr: ({ children, ...props }: any) => (
    <TableRow {...props} style={{ borderBottomWidth: 1 }}>
      {children}
    </TableRow>
  ),
  th: (props: any) => (
    <TableHeaderCell>
      <Paragraph size="$4" fontWeight="600" {...props} />
    </TableHeaderCell>
  ),
  td: (props: any) => (
    <TableCell>
      <Paragraph size="$4" {...props} />
    </TableCell>
  ),

  ProBadge,
  RouteTree,
  SimpleTable,
  WIPBadge,
}

export { components }
