import { nbspLastWord } from '@take-out/helpers'
import { getMDXComponent } from 'mdx-bundler/client'
import { createRoute, useLoader } from 'one'
import { useMemo } from 'react'
import { H1, Paragraph } from 'tamagui'

import { components } from '~/features/docs/MDXComponents'
import { HeadInfo } from '~/interface/app/HeadInfo'

export const sitemap = {
  priority: 0.8,
  changefreq: 'weekly',
}

const route = createRoute<'/(site)/docs/[slug]'>()

export async function generateStaticParams() {
  const { getAllFrontmatter } = await import('@vxrn/mdx')
  const frontmatters = getAllFrontmatter('src/features/site/docs')
  return frontmatters.map(({ slug }) => ({
    slug: slug.replace(/.*docs\//, ''),
  }))
}

export const loader = route.createLoader(async ({ params }) => {
  const { getMDXBySlug } = await import('@vxrn/mdx')
  const { frontmatter, code } = await getMDXBySlug('src/features/site/docs', params.slug)
  return {
    frontmatter,
    code,
  }
})

export function DocsSlugPage() {
  const { code, frontmatter } = useLoader(loader)
  const Component = useMemo(() => getMDXComponent(code), [code])

  const ogImageUrl = `${process.env.ONE_SERVER_URL}/api/og?type=blog&title=${encodeURIComponent(frontmatter.title || '')}`

  return (
    <>
      <HeadInfo
        title={frontmatter.title}
        description={frontmatter.description}
        openGraph={{
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        }}
      />

      <H1
        mb="$2"
        mt="$2"
        $platform-web={{
          textWrap: 'balance',
        }}
      >
        {nbspLastWord(frontmatter.title)}
      </H1>

      {!!frontmatter.description && (
        <Paragraph size="$7" color="$color8" mb="$3">
          {nbspLastWord(frontmatter.description || '')}
        </Paragraph>
      )}

      <Component components={components} />
    </>
  )
}
