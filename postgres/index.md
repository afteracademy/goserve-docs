---
layout: doc
---

# goserve Example API - PostgreSQL

[![Docker Compose CI](https://github.com/afteracademy/goserve-example-api-server-postgres/actions/workflows/docker_compose.yml/badge.svg)](https://github.com/afteracademy/goserve-example-api-server-postgres/actions/workflows/docker_compose.yml)
[![Architechture](https://img.shields.io/badge/Framework-blue?label=View&logo=go)](https://github.com/afteracademy/goserve)
[![Starter Project](https://img.shields.io/badge/Starter%20Project%20CLI-red?label=Get&logo=go)](https://github.com/afteracademy/goservegen)
[![Download](https://img.shields.io/badge/Download-Starter%20Project%20Postgres%20Zip-green.svg)](https://github.com/afteracademy/goservegen/raw/main/starter-project-postgres.zip)

**Production-Ready Go Backend Architecture**

Build scalable REST APIs with PostgreSQL, Redis, JWT auth, and clean modular design.

## Quick Links

<div class="vp-doc">

- [🚀 Get Started](/postgres/getting-started) - Set up your development environment
- [📚 API Reference](/postgres/api-reference) - Complete endpoint documentation
- [🏗️ Architecture](/postgres/architecture) - Understand the project structure
- [⚙️ Configuration](/postgres/configuration) - Configure your setup

</div>

## Key Features

### 🏗️ Modular Architecture
Feature-based organization with clean separation of controllers, services, models, and DTOs for maintainable code.

### 🔐 Complete Authentication
JWT-based authentication with RSA signing, refresh tokens, and role-based authorization (LEARNER, AUTHOR, EDITOR, ADMIN).

### ⚡ High Performance
Redis caching layer, PostgreSQL connection pooling, and optimized queries for blazing-fast API responses.

### 🐳 Docker Ready
Complete Docker Compose setup with PostgreSQL, Redis, and application containers for easy development and deployment.

### 🧪 Comprehensive Testing
Unit tests and integration tests included with helper utilities for testing authentication and authorization flows.

### 📝 API Key Protection
All endpoints protected with API key middleware, ensuring secure access control at the infrastructure level.

### 🔄 Code Generation
Built-in CLI tools to generate new API features with proper structure, saving development time and ensuring consistency.

### 🎯 Production Ready
Best practices for error handling, validation, logging, and security built-in from day one.

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

## Community

- [GitHub Repository](https://github.com/afteracademy/goserve-example-api-server-postgres)
- [goserve Framework](https://github.com/afteracademy/goserve)
- [YouTube Channel](https://www.youtube.com/@afteracad)
- [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)

---

## Related Topics

**Explore More Examples:**
- [MongoDB Example →](/mongo/) - Document database architecture
- [Microservices (gomicro) →](/micro/) - Distributed systems with Kong
- [Compare Architectures →](/compare) - Choose the right approach

**Learn the Framework:**
- [Core Concepts](/core-concepts) - Understanding goserve fundamentals
- [Architecture Guide](/architecture) - Framework design principles
- [Configuration Reference](/configuration) - Complete config options

**Additional Resources:**
- [Troubleshooting →](/troubleshooting) - Common issues and solutions
- [Getting Started Guide](/getting-started) - Framework installation
- [API Documentation](https://documenter.getpostman.com/view/1552895/2sBXVihVLg) - Try the API
