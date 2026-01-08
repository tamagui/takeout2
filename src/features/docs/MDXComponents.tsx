import { H1, H2, H3, H4, H5, Paragraph, styled, YStack } from 'tamagui'

import { Link } from '~/interface/app/Link'

import { CodeInline } from './Code'
import { DocsCodeBlock } from './DocsCodeBlock'
import { SimpleTable } from './SimpleTable'

const BaseParagraph = styled(Paragraph, {
  size: '$6',
  my: '$2',
})

const scrollMargin = { scrollMarginTop: 100 }

const components = {
  h1: (props: any) => <H1 mb="$4" data-heading style={scrollMargin} {...props} />,
  h2: (props: any) => <H2 mb="$3" pt="$5" data-heading style={scrollMargin} {...props} />,
  h3: (props: any) => <H3 mt="$5" mb="$2" data-heading style={scrollMargin} {...props} />,
  h4: (props: any) => <H4 mt="$4" mb="$2" data-heading style={scrollMargin} {...props} />,
  h5: (props: any) => <H5 mt="$3" mb="$2" data-heading style={scrollMargin} {...props} />,

  p: (props: any) => <BaseParagraph {...props} />,

  strong: (props: any) => (
    <Paragraph
      tag="strong"
      fontWeight="700"
      $platform-web={{
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
      {...props}
    />
  ),

  ul: (props: any) => <YStack tag="ul" mt="$0" mb="$3" ml="$5" {...props} />,
  ol: (props: any) => <YStack tag="ol" mt="$0" mb="$3" ml="$5" {...props} />,
  li: (props: any) => <BaseParagraph tag="li" display="list-item" mt={0} {...props} />,

  a: ({ href, children, ...props }: any) => {
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

  code: (props: any) => {
    const { className, children } = props
    if (!className) {
      return <CodeInline>{children}</CodeInline>
    }
    return <DocsCodeBlock className={className}>{children}</DocsCodeBlock>
  },

  pre: ({ children }: any) => <>{children}</>,

  blockquote: (props: any) => (
    <YStack
      tag="blockquote"
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
      tag="img"
      maxWidth="100%"
      height="auto"
      my="$4"
      borderRadius="$3"
      {...props}
    />
  ),

  SimpleTable,
}

export { components }
