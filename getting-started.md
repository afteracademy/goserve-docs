# Getting Started with goserve

Get up and running with the goserve framework in minutes.

## Pick Your Starting Point
- **Use the production-ready sample**: [PostgreSQL example](/postgres/) (recommended to see auth, roles, Redis, tests)
- **Document DB flavor**: [MongoDB example](/mongo/) (JWT + API keys + Redis)
- **Distributed system**: [gomicro](/micro/) (Kong + NATS + Postgres + Mongo + Redis)
- **Build from scratch**: Follow the quick steps below in your own repo

## What is goserve?

**goserve** is a robust Go backend architecture framework that provides a performant and scalable foundation for building REST APIs. It emphasizes feature separation, clean code, and testability with built-in JWT authentication and role-based authorization.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (depending on your use case)

- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/) (for PostgreSQL support)
- **Redis 6+** - [Download](https://redis.io/download) (for caching and sessions)

### Verify Installation

```bash
# Check Go version
go version
# Should output: go version go1.21.x or higher

# Check Git
git --version
```

## Installation

Install goserve in your Go project:

```bash
go get github.com/afteracademy/goserve
```

Or add it to your `go.mod`:

```go
require github.com/afteracademy/goserve v2.1.1
```

Then run:

```bash
go mod tidy
```

### Alternative: Use the PostgreSQL Example as Starting Point

For a complete, production-ready starting point:

```bash
# Clone the PostgreSQL example
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git my-api
cd my-api

# Install dependencies
go mod download

# Copy environment file
cp .tools/copy/env/.env.example .env

# Edit environment variables
nano .env

# Run the application
go run cmd/main.go
```

## Quick Start

### 1. Create a New Project

```bash
mkdir my-goserve-app
cd my-goserve-app
go mod init my-goserve-app
go get github.com/afteracademy/goserve
```

### 2. Scaffold a Feature (fastest path)

Use the PostgreSQL example’s generator pattern: create `api/feature/controller.go`, `service.go`, `dto`, `model`, and register in `startup/module.go`. See [Extend a feature](/core-concepts#extend-a-feature) for the minimal steps.

### 3. Server Setup

The goserve framework uses a structured startup system. Based on the PostgreSQL example, the actual server initialization involves:

- **Environment Configuration**: Loading database credentials, JWT keys, etc.
- **Database Connections**: PostgreSQL and Redis connection pools
- **Dependency Injection**: Module system for wiring components
- **Server Startup**: Structured initialization via `startup.Server()`

For a complete working example, see the **[PostgreSQL Example](/postgres/)** which demonstrates the full server setup pattern.

### 3. Run the PostgreSQL Example

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
go run .tools/rsa/keygen.go
go run .tools/copy/envs.go
docker compose up --build
```

Your API will be available at `http://localhost:8080`

### 4. Smoke-test the running API

```bash
export API_KEY=dev-$(openssl rand -hex 6)
docker compose exec postgres \
	psql -U goserve_example_user -d goserve_example_db \
	-c "INSERT INTO api_keys (key, permissions, comments, version) VALUES ('$API_KEY', '{\"GENERAL\"}', '{\"docs\"}', 1);"
curl -H "x-api-key: $API_KEY" http://localhost:8080/health
```

More options and guidance: [API key setup](/api-keys).

### Fast checks (recommended)
- Run tests: `go test ./...`
- Health: `curl -H "x-api-key: $API_KEY" http://localhost:8080/health`
- Seed reminder: ensure at least one API key exists before calling auth/blog routes.

## Framework Components

goserve provides several key components organized in a layered architecture:

### Network Layer (Controllers & Routing)
- **Base Controllers** - HTTP request handlers with built-in auth
- **Middleware System** - JWT authentication, role authorization, CORS
- **Route Groups** - Feature-based route organization
- **Error Handling** - Structured error responses

### Database Layer
- **PostgreSQL** - Advanced pgx driver with connection pooling
- **Redis** - Caching with type-safe generics

### Business Logic Layer
- **Services** - Business logic with caching and transactions
- **Models** - Database schema representations
- **DTOs** - Type-safe request/response objects
- **Validation** - Struct-based input validation

### Security & Authentication
- **JWT Authentication** - RSA-signed tokens
- **Role-Based Authorization** - Hierarchical permissions
- **Password Hashing** - Secure password storage

## Example Projects

The best way to learn goserve is through example projects:

1. **[PostgreSQL Example](/postgres/)** - Complete REST API with PostgreSQL, Redis, JWT authentication, role-based authorization, and comprehensive testing

## Learn by Example

The best way to understand goserve is through the **[PostgreSQL Example](/postgres/)**, which demonstrates:
- Complete server setup with environment configuration
- JWT authentication and role-based authorization
- PostgreSQL integration with connection pooling
- Redis caching with type-safe generics
- Structured error handling and validation
- Unit and integration testing patterns

**Start with the PostgreSQL example** to see goserve in action!

Test it:

```bash
curl -H "x-api-key: $API_KEY" http://localhost:8080/hello
```

## Observability
- Health endpoint: `GET /health` (port 8080 in the Postgres example)
- Logs: use `docker compose logs -f api` or your local process output

## Next Steps

- **Understand the Architecture**: Read [Framework Architecture](/architecture) to learn goserve's layered design
- **Learn Core Concepts**: Explore [Core Concepts](/core-concepts) for JWT auth, services, DTOs, and caching
- **See a Complete Example**: Check out the [PostgreSQL Example](/postgres/) with full authentication and blog features
- **Configure Your Setup**: Review [Configuration](/configuration) for environment variables and database setup

## Need Help?

- 💬 Ask questions on [GitHub Discussions](https://github.com/afteracademy/goserve/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/afteracademy/goserve/issues)
- 📺 Watch tutorials on [YouTube Channel](https://www.youtube.com/@afteracad)
- 📖 Read the [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)
