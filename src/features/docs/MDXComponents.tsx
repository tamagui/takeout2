import { html, Paragraph, styled, XStack, YStack } from 'tamagui'

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

const components = {
  h1: (props: any) => <H1 fontSize="9" lineHeight="9" mb="4" data-heading {...props} />,
  h2: (props: any) => (
    <H2 fontSize="8" lineHeight="8" mb="2" pt="4" data-heading {...props} />
  ),
  h3: (props: any) => (
    <H3 fontSize="6" lineHeight="6" mt="3" mb="2" data-heading {...props} />
  ),
  h4: (props: any) => (
    <H4 fontSize="6" lineHeight="6" mt="4" mb="2" data-heading {...props} />
  ),
  h5: (props: any) => (
    <H5 fontSize="5" lineHeight="5" mt="3" mb="2" data-heading {...props} />
  ),

  p: (props: any) => <BaseParagraph {...props} />,

  strong: (props: any) => <html.strong fontWeight="700" {...props} />,

  ul: (props: any) => <html.ul mt="3" mb="3" ml="2" pl={40} {...props} />,
  ol: (props: any) => <html.ol mt="3" mb="3" ml="2" pl={40} {...props} />,
  li: (props: any) => <html.li display="list-item" {...props} />,

  a: ({ href, children }: any) => {
    const isExternal = href?.startsWith('http')
    return (
      <Link href={href} target={isExternal ? '_blank' : undefined}>
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
    <html.blockquote
      my="4"
      px="4"
      py="3"
      ml="3"
      borderLeftWidth={3}
      borderLeftColor="color6"
      bg="color2"
      rounded="3"
      {...props}
    />
  ),

  hr: () => <html.hr h={1} bg="color4" my="6" />,

  img: (props: any) => <html.img maxW="100%" h="auto" my="4" rounded="3" {...props} />,

  table: (props: any) => <TableFrame {...props} />,
  thead: (props: any) => <YStack {...props} />,
  tbody: (props: any) => <YStack {...props} />,
  tr: ({ children, ...props }: any) => (
    <TableRow {...props} borderBottomWidth={1}>
      {children}
    </TableRow>
  ),
  th: (props: any) => (
    <TableHeaderCell>
      <Paragraph size="4" fontWeight="600" {...props} />
    </TableHeaderCell>
  ),
  td: (props: any) => (
    <TableCell>
      <Paragraph size="4" {...props} />
    </TableCell>
  ),

  ProBadge,
  RouteTree,
  SimpleTable,
  WIPBadge,
}

export { components }
