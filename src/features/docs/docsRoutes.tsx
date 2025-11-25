export const docsRoutes = [
  {
    pages: [
      { title: 'Introduction', route: '/docs/introduction' },
      { title: 'Getting Started', route: '/docs/getting-started' },
      { title: 'Installation', route: '/docs/installation' },
    ],
  },

  {
    title: 'Core Concepts',
    pages: [
      { title: 'Architecture', route: '/docs/architecture' },
      { title: 'over-zero', route: '/docs/over-zero' },
      { title: 'Authentication', route: '/docs/authentication' },
      { title: 'Database', route: '/docs/database' },
    ],
  },

  {
    title: 'Development',
    pages: [
      { title: 'Development Workflow', route: '/docs/development-workflow' },
      { title: 'Scripts & CLI', route: '/docs/scripts-cli' },
      { title: 'Testing', route: '/docs/testing' },
      { title: 'Environment', route: '/docs/environment' },
    ],
  },

  {
    title: 'Deployment',
    pages: [
      { title: 'Overview', route: '/docs/deployment-overview' },
      { title: 'SST (AWS)', route: '/docs/deployment-sst', pending: true },
      { title: 'Uncloud', route: '/docs/deployment-uncloud', pending: true },
      { title: 'Migrations', route: '/docs/deployment-migrations', pending: true },
    ],
  },

  {
    title: 'Features',
    pages: [
      { title: 'Real-Time Sync', route: '/docs/features-realtime-sync', pending: true },
      { title: 'Cross-Platform', route: '/docs/features-cross-platform', pending: true },
      { title: 'Analytics', route: '/docs/features-analytics', pending: true },
      { title: 'File Upload', route: '/docs/features-file-upload', pending: true },
    ],
  },

  {
    title: 'Guides',
    pages: [
      { title: 'Adding a Feature', route: '/docs/guides-adding-feature', pending: true },
      {
        title: 'Creating Mutations',
        route: '/docs/guides-creating-mutations',
        pending: true,
      },
      { title: 'Writing Queries', route: '/docs/guides-writing-queries', pending: true },
      { title: 'Custom Scripts', route: '/docs/guides-custom-scripts', pending: true },
    ],
  },

  {
    title: 'Reference',
    pages: [
      { title: 'Tech Stack', route: '/docs/reference-tech-stack', pending: true },
      {
        title: 'Project Structure',
        route: '/docs/reference-project-structure',
        pending: true,
      },
      {
        title: 'Available Scripts',
        route: '/docs/reference-available-scripts',
        pending: true,
      },
      {
        title: 'Environment Variables',
        route: '/docs/reference-environment-variables',
        pending: true,
      },
    ],
  },

  {
    title: 'Help',
    pages: [
      { title: 'Troubleshooting', route: '/docs/help-troubleshooting', pending: true },
      { title: 'Common Issues', route: '/docs/help-common-issues', pending: true },
      { title: 'FAQ', route: '/docs/help-faq', pending: true },
    ],
  },
]

export const allDocsRoutes = docsRoutes.flatMap((x) => x.pages || [])
export const allNotPending = allDocsRoutes.filter((x) => !(x as any)['pending'])
