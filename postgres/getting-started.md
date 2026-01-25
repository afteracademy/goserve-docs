# Getting Started

Get up and running with the goserve PostgreSQL example API server. 

**The project includes the following dependencies (automatically managed):**

- **goserve** - Go backend framework
- **Gin** - HTTP web framework
- **PostgreSQL Driver** - pgx driver for PostgreSQL
- **go-redis** - Redis client
- **JWT** - JSON Web Tokens for authentication
- **Validator** - Request validation
- **Viper** - Configuration management
- **Crypto** - Cryptographic utilities

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Docker & Docker Compose** - [Install Guide](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (for local development without Docker)

- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Redis 6+** - [Download](https://redis.io/download)

### Verify Installation

```bash
# Check Go version
go version
# Should output: go version go1.21.x or higher

# Check Docker
docker --version
docker compose version

# Check Git
git --version
```

## Quick Start

Fastest way to run and ping the API:

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build -d
curl -H http://localhost:8080/health
```

If you need the details, continue below.

### 1. Clone the Repository

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
```

### 2. Generate RSA Keys

The application uses RSA keys for JWT token signing:

```bash
go run .tools/rsa/keygen.go
```

This creates `keys/private.pem` and `keys/public.pem`.

### 3. Create Environment Files

Copy example environment files:

```bash
go run .tools/copy/envs.go
```

This creates `.env` and `.test.env` from their example templates.

### 4. Start with Docker Compose

Launch all services (PostgreSQL, Redis, and the API server):

```bash
docker compose up --build
```

The API will be available at: `http://localhost:8080`

### 5. Verify the Installation

Check the health of your API:

```bash
curl http://localhost:8080/health
```

## Your First API Request

### 1. Get an API Key

Set an API key in your environment, then reuse it:

```bash
export API_KEY=your-api-key
```

Note: API_KEY `1D3F2DD1A5DE725DD4DF1D82BBB37` is created as default by this project through postgres seed sql scripts.

If your database is empty, create an entry in the `api_keys` table.

See [API key setup](/api-keys) for more details.

### 2. Sign Up

```bash
curl --location 'http://localhost:8000/auth/signup/basic' \
--header 'x-api-key: 1D3F2DD1A5DE725DD4DF1D82BBB37' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "ali@afteracademy.com",
    "password": "123456",
    "name": "Janishar Ali"
}'
```

Response:

```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "id": "17c8077b-d5c2-42d8-a42b-9a0469c54209",
          "code": "LEARNER"
        }
      ]
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### 2. Sign In

```bash
curl --location 'http://localhost:8000/auth/signin/basic' \
--header 'x-api-key: 1D3F2DD1A5DE725DD4DF1D82BBB37' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "ali@afteracademy.com",
    "password": "123456"
}'
```
### You must provide Roles to this user in the database to access protected routes.
You can use the default admin user seeded in the database:
```bash
curl --location 'http://localhost:8000/auth/signin/basic' \
--header 'x-api-key: 1D3F2DD1A5DE725DD4DF1D82BBB37' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "admin@afteracademy.com",
    "password": "changeit"
}'
```
Resonpse
```json
{
    "code": "10000",
    "status": 200,
    "message": "success",
    "data": {
        "user": {
            "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
            "email": "admin@afteracademy.com",
            "name": "Admin",
            "roles": [
                {
                    "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
                    "code": "LEARNER"
                },
                {
                    "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
                    "code": "AUTHOR"
                },
                {
                    "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
                    "code": "EDITOR"
                },
                {
                    "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
                    "code": "ADMIN"
                }
            ]
        },
        "tokens": {
            "accessToken": "...",
            "refreshToken": "..."
        }
    }
}
```

## Roles
You must assign appropriate roles to users in the database to access protected routes. You can do this by directly updating the `users` table in PostgresSQL Database. You will find the roles defined in the `api/user/model/role.go` table.

```go
const RolesTableName = "roles"

type RoleCode string

const (
	RoleCodeLearner RoleCode = "LEARNER"
	RoleCodeAdmin   RoleCode = "ADMIN"
	RoleCodeAuthor  RoleCode = "AUTHOR"
	RoleCodeEditor  RoleCode = "EDITOR"
)

type Role struct {
	ID        uuid.UUID
	Code      RoleCode
	Status    bool
	CreatedAt time.Time
	UpdatedAt time.Time
}
```

## Architecture Overview

This example demonstrates goserve's architecture with Postgres:

### Key Components

- **Postgres**: Relational database for structured data storage
- **Redis**: High-performance caching layer
- **JWT Authentication**: RSA-signed tokens for secure authentication
- **API Key Protection**: Infrastructure-level security
- **Feature-Based Structure**: Organized by business domains

### Directory Structure

```
goserve-example-api-server-postgres/
├── api/                   # API feature modules
│   └── sample/            # Sample feature
│       ├── dto/           # Data Transfer Objects
│       ├── model/         # Postgres document models
│       ├── controller.go  # HTTP handlers
│       └── service.go     # Business logic
├── cmd/                   # Application entry point
│   └── main.go            # Main function
├── common/                # Shared utilities
├── config/                # Configuration
├── startup/               # Server initialization
│   ├── server.go          # Server setup
│   ├── module.go          # Dependency injection
│   └── indexes.go         # Database indexes
├── tests/                 # Integration tests
├── .tools/                # Code generation tools
└── keys/                  # RSA keys for JWT
```

## Development Workflow

### Fast checks (recommended)
- Tests: `docker exec -t goserver-postgres go test -v ./...`
- Health: `curl http://localhost:8080/health`
- Seed reminder: ensure at least one API key exists before hitting protected routes.

### Running Tests

```bash
# Run all tests
docker exec -t goserver-postgres go test -v ./...

# Run specific test
docker exec -t goserver-postgres go test -v ./tests/
```

### Code Generation

Generate new API features:

```bash
go run .tools/apigen.go your-feature-name
```

This creates the complete directory structure and skeleton files for a new feature.

## Local Development

For local development without Docker:

1. Install dependencies:
	```bash
	go mod tidy
	```
2. Start Postgres and Redis locally (or via Docker).
3. Update `.env` and `.test.env`:
   ```
   DB_HOST=localhost
   REDIS_HOST=localhost
   ```
4. Run the application:
   ```bash
   go run cmd/main.go
   ```
If ports are already in use:

```bash
# Check what's using the ports
lsof -i :8080
lsof -i :27017
lsof -i :6379

# Update .env file with different ports
SERVER_PORT=8081
DB_PORT=27018
REDIS_PORT=6380
```

### Postgres Connection Issues

```bash
# Check Postgres status
docker ps | grep postgres

# Connect to Postgres
docker exec -it <postgres_container> postgres

# Verify connection
go run cmd/main.go
```

### Permission Issues

```bash
# Fix file permissions
chmod +x .tools/rsa/keygen.go
chmod +x .tools/copy/envs.go
```

## Observability
- Health endpoint: `GET /health` on port 8080
- Logs: `docker compose logs -f api` or the local process output