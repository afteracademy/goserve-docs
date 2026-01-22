import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'goserve Documentation',
  description: 'A robust Go backend architecture framework emphasizing feature separation, clean code, and testability',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'PostgreSQL Example',
        link: '/postgres/',
        activeMatch: '/postgres/'
      },
      { text: 'Framework GitHub', link: 'https://github.com/afteracademy/goserve' },
      { text: 'Example GitHub', link: 'https://github.com/afteracademy/goserve-example-api-server-postgres' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'Installation', link: '/installation' }
          ]
        },
        {
          text: 'Framework Guide',
          items: [
            { text: 'Framework Architecture', link: '/architecture' },
            { text: 'Core Concepts', link: '/core-concepts' },
            { text: 'Configuration', link: '/configuration' }
          ]
        },
        {
          text: 'Examples',
          items: [
            { text: 'PostgreSQL Example', link: '/postgres/' }
          ]
        }
      ],
      '/postgres/': [
        {
          text: 'PostgreSQL Example',
          items: [
            { text: 'Overview', link: '/postgres/' },
            { text: 'Getting Started', link: '/postgres/getting-started' },
            { text: 'Installation', link: '/postgres/installation' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Project Architecture', link: '/postgres/architecture' },
            { text: 'Core Concepts', link: '/postgres/core-concepts' },
            { text: 'Configuration', link: '/postgres/configuration' }
          ]
        },
        {
          text: 'API Documentation',
          items: [
            { text: 'API Reference', link: '/postgres/api-reference' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/afteracademy/goserve' }
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
