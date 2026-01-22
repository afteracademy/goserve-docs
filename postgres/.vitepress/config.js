import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'goserve Example API',
  description: 'Production-ready Go backend REST API with PostgreSQL, Redis, and JWT authentication',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference' },
      { text: 'GitHub', link: 'https://github.com/afteracademy/goserve-example-api-server-postgres' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Installation', link: '/installation' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Project Architecture', link: '/architecture' },
          { text: 'Core Concepts', link: '/core-concepts' },
          { text: 'Configuration', link: '/configuration' }
        ]
      },
      {
        text: 'API Documentation',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Examples', link: '/examples' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Testing', link: '/testing' },
          { text: 'Deployment', link: '/deployment' },
          { text: 'Contributing', link: '/contributing' }
        ]
      },
      {
        text: 'Resources',
        items: [
          { text: 'FAQ', link: '/faq' },
          { text: 'Glossary', link: '/appendices/glossary' },
          { text: 'Diagrams', link: '/appendices/diagrams' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/afteracademy/goserve-example-api-server-postgres' }
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2024-present AfterAcademy'
    },

    search: {
      provider: 'local'
    }
  },

  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true
  }
})
