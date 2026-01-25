# Getting Started

Get up and running with the goserve MongoDB example API server. 

**The project includes the following dependencies (automatically managed):**

- **goserve** - Go backend framework
- **Gin** - HTTP web framework
- **MongoDB Driver** - Official MongoDB driver
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

- **MongoDB 5+** - [Download](https://www.mongodb.com/try/download/community)
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
git clone https://github.com/afteracademy/goserve-example-api-server-mongo.git
cd goserve-example-api-server-mongo
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build -d
curl -H http://localhost:8080/health
```

If you need the details, continue below.

### 1. Clone the Repository

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-mongo.git
cd goserve-example-api-server-mongo
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

Launch all services (MongoDB, Redis, and the API server):

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

Note: API_KEY `1D3F2DD1A5DE725DD4DF1D82BBB37` is created as default by this project through mongo init scripts.

If your database is empty, create an entry in the `api_keys` collection.

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
            "_id": "66784450751bd4db00490891",
            "email": "ali@afteracademy.com",
            "name": "Janishar Ali",
            "roles": [
                {
                    "_id": "66784418b8c142336899ea79",
                    "code": "LEARNER"
                }
            ]
        },
        "tokens": {
            "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkuZ29zZXJ2ZS51bnVzdWFsY29kZS5vcmciLCJzdWIiOiI2Njc4NDQ1MDc1MWJkNGRiMDA0OTA4OTEiLCJhdWQiOlsiZ29zZXJ2ZS51bnVzdWFsY29kZS5vcmciXSwiZXhwIjoxNzE5MzMwNjQwLCJuYmYiOjE3MTkxNTc4NDAsImlhdCI6MTcxOTE1Nzg0MCwianRpIjoiODdjYTI3NTU1YjdiM2FmZjJmYjAzM2JiNTliYjc4MDUzZmM4OWRjNWNjNGQ3ODUzYzIzNTBiMjU0MDI2Yjk5ZiJ9.FSwh3PPNlJ3KtNx86mSCbnxJFrDPeD3G4Y3cOBNa_vu4LP_RuDdZNstsLa5Hi822oFycK2EmXmhbLvBR50oO6K-8_HcdilXn_B_isPei49OlhmBWb8fQx1umI-2uNjb5zSolZzzUXZsgF0QeGuQ0NlyAMOJlk1LBcrgZpcTOOpc9gOodBbulqWIEOOgrvSDispnWMBzSJY0xeNBNHKOVPodQOslAslS_8213w8i0l6e_Wn1r0cGywYl5Hgg9GfXJWijZcynpznyO8XUQiRI97WrAEyQ6se8vV-LaEl6aTp_gJfVhad3Fxf54a8MrLOfGoAZDbH2x5POo_z39I5qgHg",
            "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkuZ29zZXJ2ZS51bnVzdWFsY29kZS5vcmciLCJzdWIiOiI2Njc4NDQ1MDc1MWJkNGRiMDA0OTA4OTEiLCJhdWQiOlsiZ29zZXJ2ZS51bnVzdWFsY29kZS5vcmciXSwiZXhwIjoxNzE5NzYyNjQwLCJuYmYiOjE3MTkxNTc4NDAsImlhdCI6MTcxOTE1Nzg0MCwianRpIjoiMDdiY2JiYmI2MDFmYThiMjY2NTMwZTg0MmRhYzIzMWVhNDBhZWNlZWZiNDE2YzU4MmE3YjRlODhlYWU5YTY3NSJ9.jyNzy8wf4CYTjI9SXU3ISZj-BRK35FN_aj9q3CslZ98VhdCKrdbrFO-XXLd0ZoTdKX8nyYg16aqvgu70VA8zF8fCiW9hw5-jxR1-nQOTtoZ4Ej3O2GcauLK1zSLBPH57v5VclRdSkE8VZznfM-OI5ZQ4vo8cqku_ZHRxIP6LfW7nn07BSB8CeJcIJHXYzUaFiTcw4LXW_JqGf_vpe76iEgbUKZetBtiKdAc_iP7B-CrfSAwkOafyxt8EoHzw5ip00RJSs4-PVGMs_sJJN7xkeYDWkaEDZNb7Wkf7_Jk9h-0WwihRrlsirIo4L7m3kN1GlLcH7Bvt2jeadgAAIZZwpA"
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
            "_id": "697600e406eab070d0d29518",
            "email": "admin@afteracademy.com",
            "name": "Admin",
            "roles": [
                {
                    "_id": "697600e406eab070d0d29514",
                    "code": "LEARNER"
                },
                {
                    "_id": "697600e406eab070d0d29515",
                    "code": "AUTHOR"
                },
                {
                    "_id": "697600e406eab070d0d29516",
                    "code": "EDITOR"
                },
                {
                    "_id": "697600e406eab070d0d29517",
                    "code": "ADMIN"
                }
            ]
        },
        "tokens": {
            "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkuZ29zZXJ2ZS5hZnRlcmFjYWRlbXkuY29tIiwic3ViIjoiNjk3NjAwZTQwNmVhYjA3MGQwZDI5NTE4IiwiYXVkIjpbImdvc2VydmUuYWZ0ZXJhY2FkZW15LmNvbSJdLCJleHAiOjE3Njk1MTM5ODcsIm5iZiI6MTc2OTM0MTE4NywiaWF0IjoxNzY5MzQxMTg3LCJqdGkiOiIwNDZhMzY1M2Y3OGUyMzgzYjA0OGZkMTRhZDcyNzdkM2NiN2RjYmQzNjVkMjMxYjkxMGE3ZGU1NDdkOTQzOTU2In0.En172q_qCEW2G9PuKH-yDHBMEs5UxSZXph9ZDluA0W3wT0MSVy0QZPzOM2grzbGEPNuAXnBQBNCoGO7em1tR8pT1hJnEo9irdcgsjXboIORapa004ME942kB_k2R5R3I1SGm0rVHu2_WWemY0qgnpp7FhG0SXbG9GWnk1IrGgywgTCgbAp9u9x2Q7IkrINUdZgtuoKIbIlN22Z3vk3mSYqk5n1JSEGPH-qWKuDqXB6lsyW5Up2-qaEiLQD4BN7kpoPOfkGCDZHqdppzyQeuYwBG4005-AE20mrOiDkP9ezGBZAZj2mU49Dh4jxUPfSVkkNvLxokxHj6umDYADSOsJg",
            "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkuZ29zZXJ2ZS5hZnRlcmFjYWRlbXkuY29tIiwic3ViIjoiNjk3NjAwZTQwNmVhYjA3MGQwZDI5NTE4IiwiYXVkIjpbImdvc2VydmUuYWZ0ZXJhY2FkZW15LmNvbSJdLCJleHAiOjE3Njk5NDU5ODcsIm5iZiI6MTc2OTM0MTE4NywiaWF0IjoxNzY5MzQxMTg3LCJqdGkiOiJjYjljZGU3OTkzOGEwMTQ4NjExYzc3ZjcwMmMxYmQ1OTEzMjM1MzgwNzdjZmVhZWVmZjQ5MmRkMTI0YmZmZjlkIn0.QROG1v6N7u5yrrI2fJmIQRd_EV3aiadKmgRt4XfeEloPrqL-e7AOBVT9p1rgnC07GRKehSfE6Fau7fMuidG0ugNxOWtWqK-gNwAlZyRnLeiM-D5Nvqucdy9SbNkHHcC87dQU2hv31fnxztZEbSUAB3tT276EfyYnp5CmHUS6W0AqhyipW7DORhq6HemD5QxOq71rWVOnD67hHfFD1aTCLJyhpm0vXBgaM67jK3LYbBjdeRQCImDtHoXNKlUjq3DDRilT-tIR97T83CNIHJ3tQc2ZBqmKLw-So_tLERKRMN_pE2v6NIFfAJmxqSUjA2K_g5va0TyFsUXeHfs4Mdxpqw"
        }
    }
}
```

## Roles
You must assign appropriate roles to users in the database to access protected routes. You can do this by directly updating the `users` collection in MongoDB. You will find the roles defined in the `api/user/model/role.go` collection.

```go
type RoleCode string

const (
	RoleCodeLearner RoleCode = "LEARNER"
	RoleCodeAdmin   RoleCode = "ADMIN"
	RoleCodeAuthor  RoleCode = "AUTHOR"
	RoleCodeEditor  RoleCode = "EDITOR"
)

type Role struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Code      RoleCode           `bson:"code" validate:"required,rolecode"`
	Status    bool               `bson:"status" validate:"required"`
	CreatedAt time.Time          `bson:"createdAt" validate:"required"`
	UpdatedAt time.Time          `bson:"updatedAt" validate:"required"`
}

const RolesCollectionName = "roles"
```

## Architecture Overview

This example demonstrates goserve's architecture with MongoDB:

### Key Components

- **MongoDB**: Document-based NoSQL database for flexible data storage
- **Redis**: High-performance caching layer
- **JWT Authentication**: RSA-signed tokens for secure authentication
- **API Key Protection**: Infrastructure-level security
- **Feature-Based Structure**: Organized by business domains

### Directory Structure

```
goserve-example-api-server-mongo/
├── api/                   # API feature modules
│   └── sample/            # Sample feature
│       ├── dto/           # Data Transfer Objects
│       ├── model/         # MongoDB document models
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
- Tests: `docker exec -t goserver-mongo go test -v ./...`
- Health: `curl http://localhost:8080/health`
- Seed reminder: ensure at least one API key exists before hitting protected routes.

### Running Tests

```bash
# Run all tests
docker exec -t goserver-mongo go test -v ./...

# Run specific test
docker exec -t goserver-mongo go test -v ./tests/
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
2. Start MongoDB and Redis locally (or via Docker).
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

### MongoDB Connection Issues

```bash
# Check MongoDB status
docker ps | grep mongo

# Connect to MongoDB
docker exec -it <mongo_container> mongo

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