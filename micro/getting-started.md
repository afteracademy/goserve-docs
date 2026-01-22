# Getting Started with gomicro

Get up and running with the goserve microservices architecture in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Docker & Docker Compose** - [Install Guide](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (for local development)

- **PostgreSQL 14+** - For auth service database
- **MongoDB 5+** - For blog service database
- **Redis 6+** - For caching

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/afteracademy/gomicro.git
cd gomicro
```

### 2. Generate RSA Keys

The services use RSA keys for JWT token signing:

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

### 4. Start Services

Choose your deployment mode:

#### Standard Mode (Single Instance)

```bash
docker compose up --build
```

#### Load Balanced Mode (Multiple Instances)

```bash
docker compose -f docker-compose-load-balanced.yml up --build
```

### 5. Verify Installation

Check that all services are running:

```bash
# Health check
curl http://localhost:8000/health

# Should return: {"status": "ok"}
```

## Service Architecture

gomicro runs multiple services:

- **Kong API Gateway**: `http://localhost:8000`
- **Auth Service**: `http://localhost:8001` (internal)
- **Blog Service**: `http://localhost:8002` (internal)
- **PostgreSQL**: `localhost:5432`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`
- **NATS**: `localhost:4222`

## Your First API Request

### 1. Get an API Key

The system uses API keys for initial access. Check the database initialization scripts for default keys.

### 2. Create a User Account

```bash
curl -X POST http://localhost:8000/auth/signup/basic \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 3. Sign In

```bash
curl -X POST http://localhost:8000/auth/signin/basic \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

Save the returned `access_token`.

### 4. Create a Blog Post

```bash
curl -X POST http://localhost:8000/blog/author \
  -H "x-api-key: your-api-key" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog",
    "description": "A great blog post",
    "draftText": "Full blog content here...",
    "slug": "my-first-blog",
    "imgUrl": "https://example.com/image.jpg",
    "tags": ["TECH", "GOLANG"]
  }'
```

## Understanding the Flow

### Request Flow

```
Client Request
    ↓
Kong API Gateway (Port 8000)
    ↓ Custom API Key Plugin
    ↓ Validates API key via auth-service
    ↓ Routes to appropriate service
┌─────────────────┐    NATS Messaging    ┌─────────────────┐
│  auth-service   │◄──────────────────►│  blog-service   │
│   (Port 8001)   │                     │   (Port 8002)   │
└─────────────────┘                     └─────────────────┘
        ↓                                       ↓
   PostgreSQL + Redis                    MongoDB + Redis
```

### Authentication Flow

1. **API Key Validation**: Kong calls `auth-service:8000/verify/apikey`
2. **JWT Validation**: Services validate JWT tokens via NATS calls to auth-service
3. **Role Authorization**: Services check user roles via NATS calls to auth-service

## Development Workflow

### Running Tests

```bash
# Run tests for all services
docker exec -t gomicro_auth-service_1 go test -v ./...
docker exec -t gomicro_blog-service_1 go test -v ./...
```

### Service Logs

```bash
# View logs for specific services
docker logs -f gomicro_kong_1
docker logs -f gomicro_auth-service_1
docker logs -f gomicro_blog-service_1
```

### Local Development

For local development without Docker:

1. Start PostgreSQL, MongoDB, Redis, and NATS locally
2. Update `.env` files to point to `localhost` instead of service names
3. Run services individually:

```bash
# Terminal 1: Auth service
cd auth_service
go run cmd/main.go

# Terminal 2: Blog service
cd blog_service
go run cmd/main.go
```

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Check what's using ports
lsof -i :8000  # Kong
lsof -i :8001  # Auth service
lsof -i :8002  # Blog service
lsof -i :5432  # PostgreSQL
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis
lsof -i :4222  # NATS

# Update docker-compose.yml ports or stop conflicting services
```

### Service Connection Issues

```bash
# Check service health
curl http://localhost:8000/health

# Check individual services
curl http://localhost:8001/health  # Auth service
curl http://localhost:8002/health  # Blog service
```

### Database Connection Issues

```bash
# Check database containers
docker ps | grep -E "(postgres|mongo|redis)"

# Connect to databases
docker exec -it gomicro_postgres_1 psql -U postgres -d gomicro
docker exec -it gomicro_mongo_1 mongo
```

### NATS Connection Issues

```bash
# Check NATS status
docker exec -it gomicro_nats_1 nats-top
```

## Code Generation

### Generate New API Features

```bash
# Generate new features in services
cd auth_service
go run ../.tools/apigen.go your-feature-name

cd ../blog_service
go run ../.tools/apigen.go your-feature-name
```

## Advanced Configuration

### Load Balancing Setup

Use the load-balanced Docker Compose file:

```bash
docker compose -f docker-compose-load-balanced.yml up --build
```

This creates multiple instances of each service with load balancing.

### Custom Kong Configuration

Modify `kong/kong.yml` for custom routing rules and plugins.

### Service Discovery

Services register with NATS for automatic discovery.

## Next Steps

- [Architecture Details](/micro/architecture) - Deep dive into microservices design
- [Configuration Guide](/micro/configuration) - Environment setup and options
- [API Reference](/micro/api-reference) - Complete endpoint documentation