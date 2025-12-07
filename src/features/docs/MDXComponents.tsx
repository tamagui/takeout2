import { Link } from 'one'
import { H1, H2, H3, H4, H5, Paragraph, YStack } from 'tamagui'

import { CodeInline } from './Code'
import { DocsCodeBlock } from './DocsCodeBlock'

const components = {
  h1: (props: any) => <H1 mb="$4" {...props} />,
  h2: (props: any) => (
    <H2
      mt="$6"
      mb="$3"
      pt="$4"
      borderBottomWidth={1}
      borderBottomColor="$color4"
      {...props}
    />
  ),
  h3: (props: any) => <H3 mt="$5" mb="$2" {...props} />,
  h4: (props: any) => <H4 mt="$4" mb="$2" {...props} />,
  h5: (props: any) => <H5 mt="$3" mb="$2" {...props} />,

  p: (props: any) => <Paragraph size="$5" lineHeight="$6" my="$3" {...props} />,

  strong: (props: any) => (
    <Paragraph tag="strong" fontWeight="700" fontSize="inherit" {...props} />
  ),

  ul: (props: any) => <YStack tag="ul" my="$3" ml="$5" {...props} />,
  ol: (props: any) => <YStack tag="ol" my="$3" ml="$5" {...props} />,
  li: (props: any) => (
    <Paragraph tag="li" display="list-item" size="$5" mb="$1" {...props} />
  ),

  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith('http')) {
      return (
        <Paragraph
          tag="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          color="$blue10"
          textDecorationLine="underline"
          fontSize="inherit"
          {...props}
        >
          {children}
        </Paragraph>
      )
    }
    return (
      <Link href={href} asChild>
        <Paragraph
          tag="a"
          color="$blue10"
          textDecorationLine="underline"
          fontSize="inherit"
          cursor="pointer"
          {...props}
        >
          {children}
        </Paragraph>
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
}

export { components }
