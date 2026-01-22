# Getting Started

Get up and running with the goserve example API server in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Docker & Docker Compose** - [Install Guide](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (for local development without Docker)

- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
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

The repository includes example API keys in the database initialization. For testing, use:

```
x-api-key: GCMUDiuY56h2
```

### 2. Create a User Account

```bash
curl -X POST http://localhost:8080/auth/signup/basic \
  -H "x-api-key: GCMUDiuY56h2" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "roleCode": "AUTHOR"
  }'
```

Response:
```json
{
  "status": "success",
  "message": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@example.com",
      "name": "John Doe",
      "roles": [{"code": "AUTHOR"}]
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 3. Sign In

```bash
curl -X POST http://localhost:8080/auth/signin/basic \
  -H "x-api-key: GCMUDiuY56h2" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Create a Blog Post

Use the `accessToken` from signup/signin:

```bash
curl -X POST http://localhost:8080/blog/author \
  -H "x-api-key: GCMUDiuY56h2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "description": "This is an example blog post",
    "draftText": "Full content of the blog post goes here...",
    "slug": "my-first-blog-post",
    "imgUrl": "https://example.com/image.jpg",
    "tags": ["TECH", "GOLANG"]
  }'
```

## Running Tests

Execute the test suite:

```bash
# If using Docker
docker exec -t goserve_example_api_server_postgres go test -v ./...

# If running locally
go test -v ./...
```

## Development Workflow

### Using Docker (Recommended)

1. Make code changes
2. Restart the container:
   ```bash
   docker compose restart api
   ```

### Running Locally

1. Keep PostgreSQL and Redis containers running:
   ```bash
   docker compose up postgres redis
   ```

2. Update `.env` file:
   ```bash
   DB_HOST=localhost
   REDIS_HOST=localhost
   ```

3. Run the application:
   ```bash
   go run cmd/main.go
   ```

### Using VS Code

The project includes VS Code debug configurations. Press `F5` to start debugging.

## Common Issues

### Port Already in Use

If port 8080, 5432, or 6379 is occupied:

```bash
# Change in .env file
SERVER_PORT=8081
DB_PORT=5433
REDIS_PORT=6380
```

### Docker Permission Denied

On Linux, add your user to the docker group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### RSA Key Errors

Regenerate keys if you see JWT signing errors:

```bash
rm keys/private.pem keys/public.pem
go run .tools/rsa/keygen.go
```

## Project Structure Overview

```
goserve-example-api-server-postgres/
├── api/              # API features (auth, blog, user, etc.)
├── cmd/              # Application entry point
├── common/           # Shared utilities
├── config/           # Configuration management
├── startup/          # Server initialization
├── tests/            # Integration tests
├── .tools/           # Code generators
└── docker-compose.yml
```

## Next Steps

- **Understand the Architecture**: Read [Project Architecture](/postgres/architecture)
- **Learn Core Concepts**: Explore [Core Concepts](/postgres/core-concepts)
- **View API Reference**: Check out the [API Reference](/postgres/api-reference)
- **Configure Your Setup**: Review [Configuration](/postgres/configuration)

## Need Help?

- 💬 Ask questions on [GitHub Discussions](https://github.com/afteracademy/goserve-example-api-server-postgres/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/afteracademy/goserve-example-api-server-postgres/issues)
