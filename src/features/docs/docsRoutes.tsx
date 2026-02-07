export type DocsPage = {
  title: string
  route: string
  pending?: boolean
  pro?: boolean
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
      { title: 'Get Started', route: '/docs/get-started' },
      { title: 'Changelog', route: '/docs/changelog' },
      { title: 'Roadmap', route: '/docs/roadmap' },
    ],
  },

  {
    title: 'Overview',
    pages: [
      { title: 'One', route: '/docs/one' },
      { title: 'Tamagui', route: '/docs/tamagui' },
      { title: 'Agents', route: '/docs/agents' },
    ],
  },

  {
    title: 'Data',
    pages: [
      { title: 'Database', route: '/docs/database' },
      { title: 'Zero', route: '/docs/zero' },
    ],
  },

  {
    title: 'Deployment',
    pages: [
      { title: 'Overview', route: '/docs/deployment-overview' },
      { title: 'Releasing', route: '/docs/releasing', pro: true },
    ],
  },

  {
    title: 'Use Cases',
    pages: [{ title: 'Static Starter', route: '/docs/static-starter', pro: true }],
  },

  {
    title: 'Reference',
    pages: [
      { title: 'Testing', route: '/docs/testing' },
      { title: 'Conventions', route: '/docs/conventions' },
      { title: 'FAQ', route: '/docs/faq' },
    ],
  },
]

export const allDocsRoutes = docsRoutes.flatMap((x) => x.pages || [])
export const allNotPending = allDocsRoutes.filter((x) => !(x as any)['pending'])
