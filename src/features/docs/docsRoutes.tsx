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
      { title: 'Zero Sync', route: '/docs/zero-sync' },
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
      { title: 'SST (AWS)', route: '/docs/deployment-sst' },
      { title: 'Uncloud', route: '/docs/deployment-uncloud' },
      { title: 'Migrations', route: '/docs/deployment-migrations' },
    ],
  },

  {
    title: 'Features',
    pages: [
      { title: 'Real-Time Sync', route: '/docs/features-realtime-sync' },
      { title: 'Cross-Platform', route: '/docs/features-cross-platform' },
      { title: 'Analytics', route: '/docs/features-analytics' },
      { title: 'File Upload', route: '/docs/features-file-upload' },
    ],
  },

  {
    title: 'Guides',
    pages: [
      { title: 'Adding a Feature', route: '/docs/guides-adding-feature' },
      { title: 'Creating Mutations', route: '/docs/guides-creating-mutations' },
      { title: 'Writing Queries', route: '/docs/guides-writing-queries' },
      { title: 'Custom Scripts', route: '/docs/guides-custom-scripts' },
    ],
  },

  {
    title: 'Reference',
    pages: [
      { title: 'Tech Stack', route: '/docs/reference-tech-stack' },
      { title: 'Project Structure', route: '/docs/reference-project-structure' },
      { title: 'Available Scripts', route: '/docs/reference-available-scripts' },
      { title: 'Environment Variables', route: '/docs/reference-environment-variables' },
    ],
  },

  {
    title: 'Help',
    pages: [
      { title: 'Troubleshooting', route: '/docs/help-troubleshooting' },
      { title: 'Common Issues', route: '/docs/help-common-issues' },
      { title: 'FAQ', route: '/docs/help-faq' },
    ],
  },
]

export const allDocsRoutes = docsRoutes.flatMap((x) => x.pages || [])
export const allNotPending = allDocsRoutes.filter((x) => !(x as any)['pending'])
