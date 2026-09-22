import { nbspLastWord } from '@take-out/helpers'
import { getMDXComponent } from 'mdx-bundler/client'
import { createRoute, useLoader } from 'one'
import { useMemo } from 'react'
import { html } from 'tamagui'

import { components } from '~/features/docs/MDXComponents'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { H1 } from '~/interface/text/Headings'

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

      <H1 mb="2" mt="2" textWrap="web:balance">
        {nbspLastWord(frontmatter.title)}
      </H1>

      {!!frontmatter.description && (
        <html.p fontSize="7" lineHeight="7" color="color8" mb="3">
          {nbspLastWord(frontmatter.description || '')}
        </html.p>
      )}

      <Component components={components} />
    </>
  )
}
