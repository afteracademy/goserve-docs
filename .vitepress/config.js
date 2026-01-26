import { defineConfig } from "vitepress";

export default defineConfig({
  srcDir: ".",
  srcExclude: ["README.md"],
  base: "/",
  title: "Official documentation for goserve",
  description:
    "Official documentation for goserve - Production-ready Go framework for building REST APIs with PostgreSQL, MongoDB, microservices, JWT authentication, Redis caching, and clean architecture. Complete guides, examples, and tutorials.",

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
          ],
        },
        {
          text: "Framework Guide",
          items: [
            { text: "Framework Architecture", link: "/architecture" },
            { text: "Core Concepts", link: "/core-concepts" },
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
            { text: "Architecture", link: "/micro/architecture" },
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
    // GTM Tag
    [
      "script",
      {},
      `(function(w,d,s,l,i){w[l]=w[l]||[];
w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KTM6GP5F');`,
    ],
    // Primary Meta Tags
    [
      "meta",
      {
        name: "description",
        content:
          "Official documentation for goserve - Production-ready Go framework for building REST APIs with PostgreSQL, MongoDB, microservices, JWT authentication, Redis caching, and clean architecture. Complete guides, examples, and tutorials.",
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "go, golang, rest api, backend framework, postgresql, mongodb, microservices, jwt authentication, redis, docker, gin, clean architecture, rbac, api documentation, go framework, backend development",
      },
    ],
    ["meta", { name: "author", content: "AfterAcademy" }],

    // Open Graph / Facebook
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      { property: "og:url", content: "https://goserve.afteracademy.com" },
    ],
    ["meta", { property: "og:site_name", content: "goserve Documentation" }],
    [
      "meta",
      {
        property: "og:title",
        content: "goserve - Production-Ready Go REST API Framework",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Build scalable REST APIs with Go. Complete framework with PostgreSQL, MongoDB, microservices, JWT auth, Redis caching, and comprehensive examples. Start building production-ready APIs today.",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: "https://goserve.afteracademy.com/images/cover-goserve.png",
      },
    ],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    [
      "meta",
      { property: "og:image:alt", content: "goserve - Go REST API Framework" },
    ],
    ["meta", { property: "og:locale", content: "en_US" }],

    // Twitter Card
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      { name: "twitter:url", content: "https://goserve.afteracademy.com" },
    ],
    ["meta", { name: "twitter:site", content: "@afteracad" }],
    ["meta", { name: "twitter:creator", content: "@afteracad" }],
    [
      "meta",
      {
        name: "twitter:title",
        content: "goserve - Production-Ready Go REST API Framework",
      },
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Build scalable REST APIs with Go 🚀 PostgreSQL, MongoDB & microservices support. JWT auth, Redis caching, clean architecture. Complete guides & examples included.",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://goserve.afteracademy.com/images/cover-goserve.png",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image:alt",
        content: "goserve Framework - Build Go REST APIs with ease",
      },
    ],

    // Additional Meta Tags
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { name: "language", content: "English" }],
    ["meta", { name: "revisit-after", content: "7 days" }],
    ["meta", { name: "theme-color", content: "#00ADD8" }],

    // Canonical Link
    ["link", { rel: "canonical", href: "https://goserve.afteracademy.com" }],
    ["link", { rel: "icon", type: "image/webp", href: "/images/logo.webp" }],
  ],

  markdown: {
    lineNumbers: true,
  },
});
