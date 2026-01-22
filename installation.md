# Installation

Install and set up the goserve framework in your Go project.

## Installation Methods

### Using go get

```bash
go get github.com/afteracademy/goserve
```

### Using go.mod

Add to your `go.mod` file:

```go
module your-project

go 1.21

require (
    github.com/afteracademy/goserve v2.1.1
)
```

Then run:

```bash
go mod tidy
```

## Version Selection

Check available versions:

```bash
go list -m -versions github.com/afteracademy/goserve
```

Install a specific version:

```bash
go get github.com/afteracademy/goserve@v2.1.1
```

## Dependencies

goserve includes the following dependencies (automatically managed):

- **Gin** - HTTP web framework
- **pgx** - PostgreSQL driver (for PostgreSQL support)
- **go.mongodb.org/mongo-driver** - MongoDB driver (for MongoDB support)
- **github.com/redis/go-redis** - Redis client (for Redis support)
- **github.com/go-playground/validator** - Validation library
- **github.com/spf13/viper** - Configuration management
- **golang.org/x/crypto** - Cryptographic utilities

## Verify Installation

Check if goserve is installed:

```bash
go list -m github.com/afteracademy/goserve
```

You should see output like:

```
github.com/afteracademy/goserve v2.1.1
```

## Import in Your Code

```go
import (
    "github.com/afteracademy/goserve/network"
    "github.com/afteracademy/goserve/postgres"  // For PostgreSQL
    "github.com/afteracademy/goserve/mongo"     // For MongoDB
    "github.com/afteracademy/goserve/redis"    // For Redis
    "github.com/afteracademy/goserve/middleware" // For middleware
)
```

## Project Setup

### 1. Initialize Go Module

```bash
mkdir my-project
cd my-project
go mod init my-project
```

### 2. Install goserve

```bash
go get github.com/afteracademy/goserve
```

### 3. Create Basic Structure

```
my-project/
├── cmd/
│   └── main.go
├── api/
│   └── (your features)
├── config/
│   └── config.go
└── go.mod
```

## Database Drivers (Optional)

### PostgreSQL

If you need PostgreSQL support:

```bash
go get github.com/afteracademy/goserve/postgres
```

### MongoDB

If you need MongoDB support:

```bash
go get github.com/afteracademy/goserve/mongo
```

### Redis

If you need Redis support:

```bash
go get github.com/afteracademy/goserve/redis
```

## Troubleshooting

### Module Not Found

If you get "module not found" errors:

```bash
# Clean module cache
go clean -modcache

# Download dependencies
go mod download

# Verify modules
go mod verify
```

### Version Conflicts

If you encounter version conflicts:

```bash
# Update all dependencies
go get -u ./...

# Or update specific package
go get -u github.com/afteracademy/goserve@latest
```

### Go Version

Ensure you're using Go 1.21 or higher:

```bash
go version
```

If you need to update Go, visit [golang.org/dl](https://golang.org/dl/)

## Next Steps

- ✅ Installation complete? Start with [Getting Started](/getting-started)
- 🏗️ Learn about [Framework Architecture](/architecture)
- 🔧 Configure your setup: [Configuration Guide](/configuration)
