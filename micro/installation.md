# Installation

Install and set up the gomicro microservices project.

## Installation Methods

### Using Git Clone

```bash
git clone https://github.com/afteracademy/gomicro.git
cd gomicro
```

## Dependencies

The project includes the following services and dependencies:

### Services
- **Kong API Gateway** - API routing and authentication
- **NATS** - Inter-service messaging
- **PostgreSQL** - Auth service database
- **MongoDB** - Blog service database
- **Redis** - Caching for both services

### Go Dependencies
- **goserve micro framework** - Core microservices framework
- **Kong Go plugin** - Custom API key authentication
- **NATS Go client** - Service communication
- **PostgreSQL driver** - Auth service database
- **MongoDB driver** - Blog service database
- **Redis client** - Caching operations

## Environment Setup

### 1. Generate RSA Keys

```bash
go run .tools/rsa/keygen.go
```

### 2. Create Environment Files

```bash
go run .tools/copy/envs.go
```

### 3. Configure Environment Variables

Edit the `.env` file with your settings:

```bash
# ===========================================
# KONG CONFIGURATION
# ===========================================
KONG_ADMIN_PORT=8000
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/kong/kong.yml

# ===========================================
# AUTH SERVICE CONFIGURATION
# ===========================================
AUTH_SERVICE_PORT=8001
AUTH_DB_HOST=postgres
AUTH_DB_PORT=5432
AUTH_DB_NAME=gomicro
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=password
AUTH_REDIS_HOST=redis
AUTH_REDIS_PORT=6379

# ===========================================
# BLOG SERVICE CONFIGURATION
# ===========================================
BLOG_SERVICE_PORT=8002
BLOG_DB_HOST=mongo
BLOG_DB_PORT=27017
BLOG_DB_NAME=gomicro
BLOG_REDIS_HOST=redis
BLOG_REDIS_PORT=6379

# ===========================================
# NATS CONFIGURATION
# ===========================================
NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=gomicro

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_HOURS=24

# ===========================================
# SHARED CONFIGURATION
# ===========================================
GO_ENV=development
LOG_LEVEL=info
```

## Running with Docker

### Standard Deployment

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build
```

### Load Balanced Deployment

```bash
# Start with load balancing
docker compose -f docker-compose-load-balanced.yml up --build
```

### Service Ports

- **Kong API Gateway**: `http://localhost:8000`
- **Auth Service**: `http://localhost:8001` (internal)
- **Blog Service**: `http://localhost:8002` (internal)
- **PostgreSQL**: `localhost:5432`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`
- **NATS**: `localhost:4222`

## Running Locally

### Prerequisites

- Go 1.21+
- PostgreSQL 14+
- MongoDB 5+
- Redis 6+
- NATS Server

### Setup Steps

```bash
# 1. Install and start NATS
go install github.com/nats-io/nats-server@v2.9.0
nats-server

# 2. Start databases locally or via Docker
# PostgreSQL
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14

# MongoDB
docker run -d --name mongo -p 27017:27017 mongo:5

# Redis
docker run -d --name redis -p 6379:6379 redis:6

# 3. Update .env for local connections
DB_HOST=localhost
REDIS_HOST=localhost
NATS_URL=nats://localhost:4222

# 4. Run services individually
# Terminal 1: Auth service
cd auth_service
go run cmd/main.go

# Terminal 2: Blog service
cd blog_service
go run cmd/main.go
```

## Kong Setup

### Custom Plugin Installation

The project includes a custom Kong plugin for API key authentication. The plugin is automatically loaded from the `kong/` directory.

### Kong Configuration

The `kong/kong.yml` file contains:

```yaml
services:
  - name: auth-service
    url: http://auth:8001
    routes:
      - paths: ["/auth"]
        methods: ["POST", "GET"]

  - name: blog-service
    url: http://blog:8002
    routes:
      - paths: ["/blog"]
        methods: ["GET", "POST", "PUT", "DELETE"]
```

## Database Initialization

### PostgreSQL Setup

Auth service database is initialized with:

- `users` table for authentication
- `roles` table for authorization
- `api_keys` table for service access

### MongoDB Setup

Blog service database includes:

- `blogs` collection for blog posts
- `comments` collection for blog comments
- Indexes for performance optimization

## Testing

### Run Tests

```bash
# Test auth service
docker exec -t gomicro_auth-service_1 go test -v ./...

# Test blog service
docker exec -t gomicro_blog-service_1 go test -v ./...
```

### Integration Testing

```bash
# Test full system integration
docker exec -t gomicro_kong_1 curl http://localhost:8000/health
```

## Code Generation

### Generate New Features

```bash
# Generate in auth service
cd auth_service
go run ../.tools/apigen.go your-feature-name

# Generate in blog service
cd blog_service
go run ../.tools/apigen.go your-feature-name
```

## Troubleshooting

### Service Startup Issues

```bash
# Check service logs
docker logs gomicro_kong_1
docker logs gomicro_auth-service_1
docker logs gomicro_blog-service_1

# Check service health
curl http://localhost:8000/health
```

### Database Connection Issues

```bash
# Check database connectivity
docker exec -it gomicro_postgres_1 psql -U postgres -d gomicro -c "SELECT 1;"
docker exec -it gomicro_mongo_1 mongo --eval "db.runCommand('ping')"
```

### NATS Communication Issues

```bash
# Check NATS status
docker exec -it gomicro_nats_1 nats-top

# Test NATS connectivity
docker exec -it gomicro_nats_1 nats pub test.subject "test message"
```

## Performance Tuning

### Scaling Services

```bash
# Scale auth service
docker compose up -d --scale auth-service=3

# Scale blog service
docker compose up -d --scale blog-service=2
```

### Resource Limits

Update `docker-compose.yml` with appropriate resource limits:

```yaml
services:
  auth-service:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Security Considerations

### API Key Management

- Rotate API keys regularly
- Use environment variables for sensitive keys
- Monitor API key usage

### Network Security

- Services communicate only within Docker network
- External access only through Kong gateway
- Use HTTPS in production

## Next Steps

- ✅ Installation complete? Start with [Getting Started](/micro/getting-started)
- 🏗️ Learn about [Architecture](/micro/architecture)
- ⚙️ Configure your setup: [Configuration Guide](/micro/configuration)
- 📚 Check the [API Reference](/micro/api-reference)