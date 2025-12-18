export const docsRoutes = [
  {
    pages: [{ title: 'Introduction', route: '/docs/introduction' }],
  },

  {
    title: 'Overview',
    pages: [
      { title: 'One', route: '/docs/one', pending: true },
      { title: 'Zero', route: '/docs/zero', pending: true },
      { title: 'Tamagui', route: '/docs/tamagui', pending: true },
      { title: 'Agents', route: '/docs/agents', pending: true },
    ],
  },

  {
    title: 'Deployment',
    pages: [{ title: 'Overview', route: '/docs/deployment-overview' }],
  },
]

export const allDocsRoutes = docsRoutes.flatMap((x) => x.pages || [])
export const allNotPending = allDocsRoutes.filter((x) => !(x as any)['pending'])
