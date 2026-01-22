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
      {
        text: 'MongoDB Example',
        link: '/mongo/',
        activeMatch: '/mongo/'
      },
      {
        text: 'gomicro Microservices',
        link: '/micro/',
        activeMatch: '/micro/'
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
            { text: 'PostgreSQL Example', link: '/postgres/' },
            { text: 'MongoDB Example', link: '/mongo/' }
          ]
        },
        {
          text: 'Microservices',
          items: [
            { text: 'gomicro Guide', link: '/micro/' }
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
      ],
      '/mongo/': [
        {
          text: 'MongoDB Example',
          items: [
            { text: 'Overview', link: '/mongo/' },
            { text: 'Getting Started', link: '/mongo/getting-started' },
            { text: 'Installation', link: '/mongo/installation' },
            { text: 'Architecture', link: '/mongo/architecture' },
            { text: 'Core Concepts', link: '/mongo/core-concepts' },
            { text: 'Configuration', link: '/mongo/configuration' },
            { text: 'API Reference', link: '/mongo/api-reference' }
          ]
        }
      ],
      '/micro/': [
        {
          text: 'gomicro Microservices',
          items: [
            { text: 'Overview', link: '/micro/' },
            { text: 'Getting Started', link: '/micro/getting-started' },
            { text: 'Installation', link: '/micro/installation' },
            { text: 'Architecture', link: '/micro/architecture' },
            { text: 'Core Concepts', link: '/micro/core-concepts' },
            { text: 'Configuration', link: '/micro/configuration' },
            { text: 'API Reference', link: '/micro/api-reference' }
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
