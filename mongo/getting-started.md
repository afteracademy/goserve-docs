# Getting Started

Get up and running with the goserve MongoDB example API server in minutes.

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

The repository includes example API keys. For testing, use:

```
x-api-key: your-api-key-here
```

### 2. Create a Sample Document

```bash
curl -X POST http://localhost:8080/sample \
  -H "x-api-key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "Hello MongoDB!",
    "status": true
  }'
```

### 3. Get All Samples

```bash
curl http://localhost:8080/samples \
  -H "x-api-key: your-api-key-here"
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
├── api/                    # API feature modules
│   └── sample/            # Sample feature
│       ├── dto/           # Data Transfer Objects
│       ├── model/         # MongoDB document models
│       ├── controller.go  # HTTP handlers
│       └── service.go     # Business logic
├── cmd/                   # Application entry point
│   └── main.go           # Main function
├── common/                # Shared utilities
├── config/                # Configuration
├── startup/               # Server initialization
│   ├── server.go         # Server setup
│   ├── module.go         # Dependency injection
│   └── indexes.go        # Database indexes
├── tests/                 # Integration tests
├── .tools/                # Code generation tools
└── keys/                  # RSA keys for JWT
```

## Development Workflow

### Running Tests

```bash
# Run all tests
docker exec -t goserve_example_api_server_mongo go test -v ./...

# Run specific test
docker exec -t goserve_example_api_server_mongo go test -v ./tests/
```

### Code Generation

Generate new API features:

```bash
go run .tools/apigen.go your-feature-name
```

This creates the complete directory structure and skeleton files for a new feature.

### Local Development

For local development without Docker:

1. Start MongoDB and Redis locally
2. Update `.env` and `.test.env`:
   ```
   DB_HOST=localhost
   REDIS_HOST=localhost
   ```
3. Run the application:
   ```bash
   go run cmd/main.go
   ```

## Next Steps

- [API Reference](/mongo/api-reference) - Complete endpoint documentation
- [Architecture Details](/mongo/architecture) - Deep dive into the project structure
- [Configuration Guide](/mongo/configuration) - Environment setup and options