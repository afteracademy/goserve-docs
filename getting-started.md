---
title: Getting Started with goserve - Go REST API Framework
description: Quick start guide for goserve - a robust Go framework for building REST APIs with PostgreSQL, MongoDB, JWT authentication, and microservices support.
---

# Getting Started with goserve

Get up and running with the goserve framework in minutes.

## What is goserve?

**goserve** is a robust Go backend architecture framework that provides a performant and scalable foundation for building REST APIs. It emphasizes feature separation, clean code, and testability with built-in JWT authentication and role-based authorization.

## Choose Your Path

- **Production-ready example**: [PostgreSQL example](/postgres/)
- **Document database**: [MongoDB example](/mongo/)
- **Distributed system**: [gomicro](/micro/) - Kong + NATS + Postgres + Mongo + Redis
- **Build from templates**: Follow the installation steps below

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Docker** - [Download](https://www.docker.com/get-started) (for containerized development)

### Verify Installation

```bash
# Check Go version
go version
# Should output: go version go1.21.x or higher

# Check Git
git --version
```

## Quick Start

### 1. Run goservergen CLI to generate a new project
More details: [goservegen](https://github.com/afteracademy/goservegen)

The goservegen CLI can generate a boilerplate REST API server project with either PostgreSQL or MongoDB as the database.
> goservegen `[project directory path]` `[project module]` `[Database Type - mongo/postgres]`

Run the either of the following command in your terminal:

**1. Postgres Project**
```bash
go run github.com/afteracademy/goservegen/v2@latest ~/Downloads/my_project github.com/yourusername/example postgres
```

**2. Mongo Project**
```bash
go run github.com/afteracademy/goservegen/v2@latest ~/Downloads/my_project github.com/yourusername/example mongo
```

> It will generate project named `my_project` located at `~/Downloads` and module `github.com/yourusername/example`

### Run the project using Docker
Go to the project directory
```bash
cd ~/Downloads/my_project	
```
Build and run the Docker containers
```bash
docker compose up --build
```

Check the health endpoint
```bash
curl http://localhost:8080/health
```

Response
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "timestamp": "2026-01-25T06:45:17.228713387Z",
    "status": "OK"
  }
}
```

### Now Open the generated project in your IDE/editor of choice
> Have fun developing your REST API server!

### Generated Project Structure
```
.
├── Dockerfile
├── api
│   ├── health
│   │   ├── controller.go
│   │   ├── dto
│   │   │   └── health_check.go
│   │   └── service.go
│   └── message
│       ├── controller.go
│       ├── dto
│       │   └── create_message.go
│       ├── model
│       │   └── message.go
│       └── service.go
├── cmd
│   └── main.go
├── config
│   └── env.go
├── docker-compose.yml
├── go.mod
├── go.sum
├── keys
│   ├── private.pem
│   └── public.pem
├── migrations
├── startup
│   ├── module.go
│   ├── server.go
│   └── testserver.go
└── utils
    ├── convertor.go
    └── file.go
```

## Framework Components

goserve provides several key components organized in a layered architecture:

### Network Layer
- **Controllers** - HTTP request handlers with built-in auth
- **Middleware** - JWT authentication, role authorization, etc.
- **Module** - Dependency injection setup
- **Router** - Spin Gin for routing
- **Utilities** - Request/response helpers

### Database Layer
- **PostgreSQL** - Advanced pgx driver with connection pooling
- **MongoDB** - Native Go driver support
- **Redis** - Caching with type-safe operations

### Business Logic Layer
- **Services** - Business logic with caching and transactions
- **Models** - Database schema representations
- **DTOs** - Type-safe request/response objects
- **Validation** - Struct-based input/output validation

### Security & Authentication
- **JWT Authentication** - RSA-signed tokens (access + refresh)
- **Role-Based Authorization** - Hierarchical permissions
- **API Keys** - Edge authentication

## Example Projects

Learn by exploring complete, production-ready implementations:

### 1. [PostgreSQL Example](/postgres/)
Complete REST API with:
- PostgreSQL database with pgx driver
- Redis caching
- JWT authentication (RSA)
- Role-based authorization
- Comprehensive test suite
- Docker setup

### 2. [MongoDB Example](/mongo/)
REST API with MongoDB:
- MongoDB native driver
- Redis caching
- JWT authentication
- API key management
- Docker setup

### 3. [Microservices (gomicro)](/micro/)
Distributed architecture with:
- Kong API gateway
- NATS messaging
- Multiple services (auth, blog)
- PostgreSQL + MongoDB + Redis
- Load balancing support

## Next Steps

- **Understand the Architecture**: Read [Framework Architecture](/architecture) to learn goserve's layered design
- **Learn Core Concepts**: Explore [Core Concepts](/core-concepts) for JWT auth, services, DTOs, and caching
- **See a Complete Example**: Check out the [PostgreSQL Example](/postgres/) with full authentication and blog features

## Need Help?

- 💬 Ask questions on [GitHub Discussions](https://github.com/afteracademy/goserve/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/afteracademy/goserve/issues)
- 📺 Watch tutorials on [YouTube Channel](https://www.youtube.com/@afteracad)
- 📖 Read the [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)
