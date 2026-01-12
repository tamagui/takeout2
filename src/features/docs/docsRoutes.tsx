export type DocsPage = {
  title: string
  route: string
  pending?: boolean
}

export type DocsSection = {
  title?: string
  pages?: DocsPage[]
}

export const docsRoutes: DocsSection[] = [
  {
    pages: [
      { title: 'Introduction', route: '/docs/introduction' },
      { title: 'Highlights', route: '/docs/highlights' },
    ],
  },

  {
    title: 'Overview',
    pages: [
      { title: 'One', route: '/docs/one' },
      { title: 'Data', route: '/docs/data' },
      { title: 'Tamagui', route: '/docs/tamagui' },
      { title: 'Agents', route: '/docs/agents' },
    ],
  },

  {
    title: 'Deployment',
    pages: [{ title: 'Overview', route: '/docs/deployment-overview' }],
  },

  {
    title: 'Use Cases',
    pages: [{ title: 'Static Websites', route: '/docs/static-websites' }],
  },
]

export const allDocsRoutes = docsRoutes.flatMap((x) => x.pages || [])
export const allNotPending = allDocsRoutes.filter((x) => !(x as any)['pending'])
