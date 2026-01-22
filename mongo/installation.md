# Installation

Install and set up the goserve MongoDB example project.

## Installation Methods

### Using Git Clone

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-mongo.git
cd goserve-example-api-server-mongo
```

## Dependencies

The project includes the following dependencies (automatically managed):

- **goserve** - Go backend framework
- **Gin** - HTTP web framework
- **MongoDB Driver** - Official MongoDB driver
- **go-redis** - Redis client
- **JWT** - JSON Web Tokens for authentication
- **Validator** - Request validation
- **Viper** - Configuration management
- **Crypto** - Cryptographic utilities

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

Edit `.env` file with your settings:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=27017
DB_NAME=goserve_mongo
DB_USER=
DB_PASSWORD=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
GO_ENV=development

# API Configuration
API_BASE_URL=http://localhost:8080
```

## Running with Docker

### Prerequisites

- Docker
- Docker Compose

### Quick Start

```bash
# Clone and setup
git clone https://github.com/afteracademy/goserve-example-api-server-mongo.git
cd goserve-example-api-server-mongo

# Generate keys and env files
go run .tools/rsa/keygen.go
go run .tools/copy/envs.go

# Start services
docker compose up --build
```

### Access the API

```
http://localhost:8080
```

## Running Locally

### Prerequisites

- Go 1.21+
- MongoDB 5+
- Redis 6+

### Setup

```bash
# Install dependencies
go mod tidy

# Start MongoDB and Redis
# (Use Docker or local installations)

# Update environment variables in .env
DB_HOST=localhost
REDIS_HOST=localhost

# Run the application
go run cmd/main.go
```

## Testing

### Run Tests

```bash
# With Docker
docker exec -t goserve_example_api_server_mongo go test -v ./...

# Locally
go test -v ./...
```

## Troubleshooting

### Port Conflicts

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

## Code Generation

### Generate New API Features

```bash
go run .tools/apigen.go your-feature-name
```

This creates:
- `api/your-feature-name/` directory
- Model, DTO, controller, and service files
- Basic CRUD operations

## Next Steps

- ✅ Installation complete? Start with [Getting Started](/mongo/getting-started)
- 🏗️ Learn about [Architecture](/mongo/architecture)
- ⚙️ Configure your setup: [Configuration Guide](/mongo/configuration)
- 📚 Check the [API Reference](/mongo/api-reference)