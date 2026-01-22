---
layout: home

hero:
  name: goserve Example API
  text: Production-Ready Go Backend Architecture
  tagline: Build scalable REST APIs with PostgreSQL, Redis, JWT auth, and clean modular design
  image:
    src: /hero-image.svg
    alt: goserve
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/afteracademy/goserve-example-api-server-postgres

features:
  - icon: 🏗️
    title: Modular Architecture
    details: Feature-based organization with clean separation of controllers, services, models, and DTOs for maintainable code.
  
  - icon: 🔐
    title: Complete Authentication
    details: JWT-based authentication with RSA signing, refresh tokens, and role-based authorization (LEARNER, AUTHOR, EDITOR, ADMIN).
  
  - icon: ⚡
    title: High Performance
    details: Redis caching layer, PostgreSQL connection pooling, and optimized queries for blazing-fast API responses.
  
  - icon: 🐳
    title: Docker Ready
    details: Complete Docker Compose setup with PostgreSQL, Redis, and application containers for easy development and deployment.
  
  - icon: 🧪
    title: Comprehensive Testing
    details: Unit tests and integration tests included with helper utilities for testing authentication and authorization flows.
  
  - icon: 📝
    title: API Key Protection
    details: All endpoints protected with API key middleware, ensuring secure access control at the infrastructure level.
  
  - icon: 🔄
    title: Code Generation
    details: Built-in CLI tools to generate new API features with proper structure, saving development time and ensuring consistency.
  
  - icon: 🎯
    title: Production Ready
    details: Best practices for error handling, validation, logging, and security built-in from day one.
---

## Why goserve?

The **goserve framework** provides a robust foundation for building production-ready REST APIs in Go. This example project demonstrates:

- **Clean Architecture**: Feature-based modules that scale as your application grows
- **Security First**: JWT authentication, API keys, role-based access control
- **Performance**: Redis caching, database connection pooling, efficient queries
- **Developer Experience**: Code generators, Docker setup, comprehensive tests

## Quick Example

```go
// Create a new blog post
POST /blog/author
Authorization: Bearer <jwt_token>
x-api-key: your-api-key

{
  "title": "My First Blog",
  "description": "A great blog post",
  "draftText": "Full blog content here...",
  "slug": "my-first-blog",
  "imgUrl": "https://example.com/image.jpg",
  "tags": ["TECH", "GOLANG"]
}
```

## What You'll Build

This example demonstrates a **complete blog service** with:

- User authentication (signup, signin, token refresh)
- Role-based authorization (author, editor, admin)
- Blog CRUD operations with draft/submit/publish workflows
- Full-text search for similar blogs
- Paginated blog listings by tag or latest
- Contact form submission

## Technology Stack

- **Go** - Modern, efficient programming language
- **goserve v2** - Backend framework with batteries included
- **Gin** - Fast HTTP web framework
- **PostgreSQL** - Robust relational database
- **Redis** - High-performance caching
- **JWT** - Secure token-based authentication
- **Docker** - Containerization for easy deployment

## Community

- [GitHub Repository](https://github.com/afteracademy/goserve-example-api-server-postgres)
- [goserve Framework](https://github.com/afteracademy/goserve)
- [YouTube Channel](https://www.youtube.com/@afteracad)
- [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)

## Next Steps

<div class="vp-doc">

**New to the project?** Start with [Getting Started](/getting-started) to set up your development environment.

**Understand the architecture?** Check out [Core Concepts](/core-concepts) to learn how goserve works.

**Ready to code?** Follow the [Contributing Guide](/contributing) to add new features.

</div>
