// import { getMDXComponent } from 'mdx-bundler/client'
// import { useMemo } from 'react'
// import { H1, Paragraph } from 'tamagui'
// import { useLoader } from 'one'
// import { components } from '~/features/docs/MDXComponents'
// import type { Frontmatter } from '~/features/docs/types'

// export async function generateStaticParams() {
//   const { getAllFrontmatter } = await import('@vxrn/mdx')
//   const frontmatters = getAllFrontmatter('data/docs')
//   const paths = frontmatters.map(({ slug }) => ({
//     slug: slug.replace(/.*docs\//, ''),
//   }))
//   return paths
// }

// export async function loader({ params }: { params: { slug: string } }) {
//   const { getMDXBySlug } = await import('@vxrn/mdx')
//   const { frontmatter, code } = await getMDXBySlug('data/docs', params.slug)
//   return {
//     frontmatter: frontmatter as Frontmatter,
//     code,
//   }
// }

export default function DocPage() {
  return null
  // const { code, frontmatter } = useLoader(loader)
  // const Component = useMemo(() => getMDXComponent(code), [code])

  // return (
  //   <>
  //     {!frontmatter.hideTitle && (
  //       <>
  //         <H1 mb="$4" mt="$2" size="$10">
  //           {frontmatter.title}
  //         </H1>
  //         {!!frontmatter.description && (
  //           <Paragraph size="$6" mb="$4" color="$color11">
  //             {frontmatter.description}
  //           </Paragraph>
  //         )}
  //       </>
  //     )}
  //     <Component components={components as any} />
  //   </>
  // )
}
