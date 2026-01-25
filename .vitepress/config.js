import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/",
  title: "goserve docs",
  description:
    "A robust Go backend architecture framework emphasizing feature separation, clean code, and testability",

  themeConfig: {
    logo: "/images/logo.webp",

    nav: [
      { text: "Home", link: "/" },
      { text: "Postgres", link: "/postgres" },
      { text: "Mongo", link: "/mongo" },
      { text: "Microservices", link: "/micro" },
      { text: "GitHub", link: "https://github.com/afteracademy/goserve" },
      {
        text: "AfterAcademy",
        link: "https://afteracademy.com",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    ],

    sidebar: {
      "/": [
        {
          text: "Introduction",
          items: [
            { text: "Overview", link: "/" },
            { text: "Getting Started", link: "/getting-started" },
            { text: "Installation", link: "/installation" },
          ],
        },
        {
          text: "Framework Guide",
          items: [
            { text: "Framework Architecture", link: "/architecture" },
            { text: "Core Concepts", link: "/core-concepts" },
            { text: "Configuration", link: "/configuration" },
          ],
        },
        {
          text: "Resources",
          items: [
            { text: "Compare Architectures", link: "/compare" },
            { text: "Troubleshooting", link: "/troubleshooting" },
          ],
        },
        {
          text: "Examples",
          items: [
            { text: "PostgreSQL Example", link: "/postgres/" },
            { text: "MongoDB Example", link: "/mongo/" },
            { text: "Microservices (gomicro)", link: "/micro/" },
          ],
        },
      ],
      "/postgres/": [
        {
          text: "PostgreSQL Example",
          items: [
            { text: "Overview", link: "/postgres/" },
            { text: "Getting Started", link: "/postgres/getting-started" },
            { text: "Architecture", link: "/postgres/architecture" },
            { text: "Core Concepts", link: "/postgres/core-concepts" },
            { text: "Configuration", link: "/postgres/configuration" },
            { text: "API Reference", link: "/postgres/api-reference" },
          ],
        },
      ],
      "/mongo/": [
        {
          text: "MongoDB Example",
          items: [
            { text: "Overview", link: "/mongo/" },
            { text: "Getting Started", link: "/mongo/getting-started" },
            { text: "Architecture", link: "/mongo/architecture" },
            { text: "Core Concepts", link: "/mongo/core-concepts" },
            { text: "Configuration", link: "/mongo/configuration" },
            { text: "API Reference", link: "/mongo/api-reference" },
          ],
        },
      ],
      "/micro/": [
        {
          text: "gomicro Microservices",
          items: [
            { text: "Overview", link: "/micro/" },
            { text: "Getting Started", link: "/micro/getting-started" },
            { text: "Installation", link: "/micro/installation" },
            { text: "Architecture", link: "/micro/architecture" },
            { text: "Core Concepts", link: "/micro/core-concepts" },
            { text: "Configuration", link: "/micro/configuration" },
            { text: "API Reference", link: "/micro/api-reference" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "/images/logo.webp",
        link: "https://afteracademy.com",
        ariaLabel: "AfterAcademy Website",
      },
      { icon: "github", link: "https://github.com/afteracademy/goserve" },
    ],

    footer: {
      message: "Released under the Apache 2.0 License",
      copyright: "Copyright © 2026 AfterAcademy",
    },

    search: {
      provider: "local",
    },
  },

  head: [
    ['meta', { name: 'description', content: 'goserve - Production-ready Go backend framework with PostgreSQL, MongoDB, and microservices examples. Build scalable REST APIs with clean architecture.' }],
    ['meta', { property: 'og:title', content: 'goserve Documentation' }],
    ['meta', { property: 'og:description', content: 'Complete guide to building Go REST APIs with goserve framework - JWT auth, Redis caching, role-based access control' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'keywords', content: 'go, golang, rest api, backend framework, postgresql, mongodb, microservices, jwt, redis, docker' }],
    ['link', { rel: 'icon', type: 'image/webp', href: '/images/logo.webp' }],
  ],

  markdown: {
    lineNumbers: true,
  },
});
