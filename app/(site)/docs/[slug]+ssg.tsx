import { getMDXComponent } from 'mdx-bundler/client'
import { createRoute, useLoader } from 'one'
import { useMemo } from 'react'
import { H1, Paragraph } from 'tamagui'

import { components } from '~/features/docs/MDXComponents'
import { HeadInfo } from '~/interface/app/HeadInfo'

const route = createRoute<'/(site)/docs/[slug]'>()

export async function generateStaticParams() {
  const { getAllFrontmatter } = await import('@vxrn/mdx')
  const frontmatters = getAllFrontmatter('src/features/site/docs')
  const paths = frontmatters.map(({ slug }) => ({
    slug: slug.replace(/.*docs\//, ''),
  }))
  return paths
}

export async function loader({ params }: { params: { slug: string } }) {
  const { getMDXBySlug } = await import('@vxrn/mdx')
  const { frontmatter, code } = await getMDXBySlug('src/features/site/docs', params.slug)
  return {
    frontmatter,
    code,
  }
}

export function DocsSlugPage() {
  const { code, frontmatter } = useLoader(loader)
  const Component = useMemo(() => getMDXComponent(code), [code])

  const nbspLastWord = (text: string) => {
    if (!text) return text
    const words = text.split(' ')
    if (words.length <= 1) return text
    return words.slice(0, -1).join(' ') + '\u00A0' + words[words.length - 1]
  }

  return (
    <>
      <HeadInfo title={frontmatter.title} description={frontmatter.description} />
      <H1
        mb="$4"
        mt="$2"
        size="$10"
        $platform-web={{
          textWrap: 'balance',
        }}
      >
        {nbspLastWord(frontmatter.title)}
      </H1>
      {!!frontmatter.description && (
        <Paragraph size="$6" color="$color11" mb="$6" lineHeight="$7">
          {nbspLastWord(frontmatter.description || '')}
        </Paragraph>
      )}
      <Component components={components} />
    </>
  )
}
