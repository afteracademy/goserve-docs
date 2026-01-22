# Installation

Complete installation guide for various environments.

## Docker Installation (Recommended)

The fastest way to get started with all dependencies pre-configured.

### Step 1: Clone Repository

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
```

### Step 2: Generate RSA Keys

```bash
go run .tools/rsa/keygen.go
```

This generates `keys/private.pem` and `keys/public.pem` for JWT token signing.

### Step 3: Create Environment Files

```bash
go run .tools/copy/envs.go
```

This creates:
- `.env` - Main application configuration
- `.test.env` - Test environment configuration

### Step 4: Start Services

```bash
docker compose up --build
```

This starts:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- API server (port 8080)

### Step 5: Verify Installation

```bash
# Check if services are running
docker compose ps

# Test API endpoint
curl http://localhost:8080/health
```

### Step 6: Run Tests

```bash
docker exec -t goserve_example_api_server_postgres go test -v ./...
```

## Local Development Setup

Run the application natively on your machine for faster development cycles.

### Prerequisites

Install the following on your system:

1. **Go 1.21+**
   ```bash
   # macOS
   brew install go
   
   # Linux
   wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
   export PATH=$PATH:/usr/local/go/bin
   
   # Verify
   go version
   ```

2. **PostgreSQL 14+**
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql-14
   sudo systemctl start postgresql
   
   # Verify
   psql --version
   ```

3. **Redis 6+**
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis
   
   # Verify
   redis-cli ping  # Should return PONG
   ```

### Installation Steps

#### 1. Clone and Setup

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
```

#### 2. Generate Keys and Config

```bash
# Generate RSA keys
go run .tools/rsa/keygen.go

# Create environment files
go run .tools/copy/envs.go
```

#### 3. Configure Database

Create database and user:

```bash
# Connect to PostgreSQL
psql postgres

# Run these commands
CREATE DATABASE goserve_db;
CREATE USER goserve_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE goserve_db TO goserve_user;
\q
```

#### 4. Update Environment Variables

Edit `.env` file:

```bash
# Server
GO_MODE=debug
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database
DB_HOST=localhost
DB_NAME=goserve_db
DB_PORT=5432
DB_USER=goserve_user
DB_USER_PWD=your_password
DB_MIN_POOL_SIZE=5
DB_MAX_POOL_SIZE=20
DB_QUERY_TIMEOUT_SEC=30

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# RSA Keys
RSA_PRIVATE_KEY_PATH=keys/private.pem
RSA_PUBLIC_KEY_PATH=keys/public.pem

# JWT Tokens
ACCESS_TOKEN_VALIDITY_SEC=3600
REFRESH_TOKEN_VALIDITY_SEC=2592000
TOKEN_ISSUER=goserve-api
TOKEN_AUDIENCE=goserve-client
```

#### 5. Initialize Database Schema

```bash
# Apply database migrations (if using migrations tool)
# Or import the schema from .extra/init-scripts/
psql -U goserve_user -d goserve_db -f .extra/init-scripts/01-schema.sql
psql -U goserve_user -d goserve_db -f .extra/init-scripts/02-seed.sql
```

#### 6. Install Dependencies

```bash
go mod download
go mod tidy
```

#### 7. Run the Application

```bash
# Using Make
make run

# Or directly with Go
go run cmd/main.go
```

The server should start on `http://localhost:8080`

## Hybrid Setup

Use Docker for databases but run the app locally for faster iteration.

### 1. Start Only Infrastructure Services

```bash
# Start PostgreSQL and Redis in Docker
docker compose up postgres redis
```

### 2. Configure Local Connection

Update `.env`:

```bash
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Run Application Locally

```bash
go run cmd/main.go
```

This gives you:
- ✅ Fast compilation and restart
- ✅ Easy debugging
- ✅ Isolated database services

## VS Code Setup

The project includes VS Code configurations for debugging.

### 1. Open in VS Code

```bash
code .
```

### 2. Install Recommended Extensions

When prompted, install:
- Go (official Go extension)
- Docker (Docker extension)

### 3. Use Debug Configurations

Press `F5` or go to Run → Start Debugging

Available configurations:
- **Launch Server** - Start the API server
- **Attach to Docker** - Debug running container
- **Run Tests** - Execute test suite

## Environment Variables Reference

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GO_MODE` | Application mode (debug/release) | `debug` |
| `SERVER_HOST` | Server bind address | `0.0.0.0` |
| `SERVER_PORT` | HTTP port | `8080` |

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `postgres` |
| `DB_NAME` | Database name | `goserve_db` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `goserve_user` |
| `DB_USER_PWD` | Database password | - |
| `DB_MIN_POOL_SIZE` | Min connections | `5` |
| `DB_MAX_POOL_SIZE` | Max connections | `20` |
| `DB_QUERY_TIMEOUT_SEC` | Query timeout | `30` |

### Redis Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | Empty |
| `REDIS_DB` | Redis database number | `0` |

### Security Configuration

| Variable | Description |
|----------|-------------|
| `RSA_PRIVATE_KEY_PATH` | Path to RSA private key |
| `RSA_PUBLIC_KEY_PATH` | Path to RSA public key |
| `ACCESS_TOKEN_VALIDITY_SEC` | Access token lifetime (seconds) |
| `REFRESH_TOKEN_VALIDITY_SEC` | Refresh token lifetime (seconds) |
| `TOKEN_ISSUER` | JWT issuer claim |
| `TOKEN_AUDIENCE` | JWT audience claim |

## Troubleshooting

### Port Conflicts

**Problem**: Port already in use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in .env
SERVER_PORT=8081
```

### Database Connection Failed

**Problem**: Cannot connect to PostgreSQL

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Or locally
pg_isready -U goserve_user -d goserve_db

# Check connection
psql -U goserve_user -d goserve_db -h localhost

# Verify credentials in .env match database
```

### Redis Connection Failed

**Problem**: Cannot connect to Redis

```bash
# Check if Redis is running
docker compose ps redis

# Or locally
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379
```

### RSA Key Errors

**Problem**: JWT signing fails

```bash
# Regenerate keys
rm keys/private.pem keys/public.pem
go run .tools/rsa/keygen.go

# Verify files exist
ls -la keys/
```

### Dependency Issues

**Problem**: Go module errors

```bash
# Clean module cache
go clean -modcache

# Re-download dependencies
go mod download
go mod tidy

# Verify modules
go mod verify
```

### Docker Build Fails

**Problem**: Docker image build errors

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache

# Check logs
docker compose logs api
```

## Next Steps

- ✅ Installation complete? Learn about [Project Architecture](/architecture)
- 🔧 Configure your environment: [Configuration Guide](/configuration)
- 🚀 Start building: [Examples](/examples)
