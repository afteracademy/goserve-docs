# Framework Configuration

Configure the goserve framework components for your application.

## Overview

goserve uses a flexible configuration system that supports environment variables, configuration files, and programmatic setup. The framework components can be configured independently based on your needs.

## Network Configuration

### Basic Router Setup

```go
import (
    "github.com/gin-gonic/gin"
    "github.com/afteracademy/goserve/network"
)

func main() {
    // Set Gin mode
    gin.SetMode(gin.ReleaseMode) // or gin.DebugMode
    
    router := gin.Default()
    
    // Create controller with base path
    controller := network.NewController("/api", nil, nil)
    controller.MountRoutes(router)
    
    router.Run(":8080")
}
```

### Controller Configuration

```go
type ControllerConfig struct {
    BasePath           string
    AuthProvider       network.AuthenticationProvider
    AuthorizeProvider  network.AuthorizationProvider
    Middleware         []gin.HandlerFunc
}

controller := network.NewController(
    "/api/v1",
    authProvider,
    authorizeProvider,
)
```

## PostgreSQL Configuration

### Connection Pool Setup

```go
import "github.com/afteracademy/goserve/postgres"

type PostgresConfig struct {
    Host     string
    Port     int
    Database string
    User     string
    Password string
    MaxConns int
    MinConns int
}

config := PostgresConfig{
    Host:     "localhost",
    Port:     5432,
    Database: "mydb",
    User:     "user",
    Password: "password",
    MaxConns: 25,
    MinConns: 5,
}

pool, err := postgres.NewConnectionPool(config)
if err != nil {
    log.Fatal(err)
}
defer pool.Close()
```

### Environment Variables

```bash
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=user
DB_PASSWORD=password
DB_MAX_CONNECTIONS=25
DB_MIN_CONNECTIONS=5
DB_MAX_CONN_LIFETIME=300s
DB_MAX_CONN_IDLE_TIME=30s
```

### Connection Pool Options

- **MaxConns**: Maximum number of connections in the pool
- **MinConns**: Minimum number of connections to maintain
- **MaxConnLifetime**: Maximum lifetime of a connection
- **MaxConnIdleTime**: Maximum idle time before closing a connection

## MongoDB Configuration

### Client Setup

```go
import "github.com/afteracademy/goserve/mongo"

type MongoConfig struct {
    URI      string
    Database string
    Options  *options.ClientOptions
}

config := MongoConfig{
    URI:      "mongodb://localhost:27017",
    Database: "mydb",
}

client, err := mongo.NewClient(config)
if err != nil {
    log.Fatal(err)
}
defer client.Disconnect(context.Background())
```

### Environment Variables

```bash
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=mydb
MONGO_MAX_POOL_SIZE=100
MONGO_MIN_POOL_SIZE=10
```

## Redis Configuration

### Client Setup

```go
import "github.com/afteracademy/goserve/redis"

type RedisConfig struct {
    Host     string
    Port     int
    Password string
    DB       int
}

config := RedisConfig{
    Host:     "localhost",
    Port:     6379,
    Password: "", // Optional
    DB:       0,
}

client := redis.NewClient(config)
defer client.Close()
```

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10
REDIS_MIN_IDLE_CONNS=5
```

## Middleware Configuration

### Authentication Middleware

```go
import "github.com/afteracademy/goserve/middleware"

// JWT Authentication
authProvider := middleware.NewJWTProvider(
    middleware.JWTConfig{
        SecretKey:     "your-secret-key",
        SigningMethod: "HS256",
        TokenExpiry:   time.Hour * 24,
    },
)

// Use in controller
controller := network.NewController(
    "/api",
    authProvider,
    nil,
)
```

### CORS Configuration

```go
corsConfig := middleware.CORSConfig{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
}

router.Use(middleware.CORS(corsConfig))
```

### Logging Middleware

```go
loggerConfig := middleware.LoggerConfig{
    Format:      "json", // or "text"
    Output:     os.Stdout,
    SkipPaths:  []string{"/health"},
    TimeFormat: time.RFC3339,
}

router.Use(middleware.Logger(loggerConfig))
```

## Validation Configuration

### Validator Setup

```go
import "github.com/go-playground/validator/v10"

validator := validator.New()

// Register custom validators
validator.RegisterValidation("customtag", customValidationFunc)

// Use in DTOs
type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}
```

## Environment-Based Configuration

### Using Viper

```go
import "github.com/spf13/viper"

// Set config file
viper.SetConfigName("config")
viper.SetConfigType("yaml")
viper.AddConfigPath(".")

// Read environment variables
viper.AutomaticEnv()

// Read config file
if err := viper.ReadInConfig(); err != nil {
    log.Fatal(err)
}

// Access values
dbHost := viper.GetString("database.host")
dbPort := viper.GetInt("database.port")
```

### Configuration File Example

```yaml
# config.yaml
server:
  host: "0.0.0.0"
  port: 8080
  mode: "release"

database:
  postgres:
    host: "localhost"
    port: 5432
    database: "mydb"
    user: "user"
    password: "password"
  
  redis:
    host: "localhost"
    port: 6379

middleware:
  cors:
    allow_origins:
      - "http://localhost:3000"
    allow_methods:
      - "GET"
      - "POST"
      - "PUT"
      - "DELETE"
```

## Configuration Best Practices

1. **Use Environment Variables for Secrets**
   - Never commit secrets to version control
   - Use `.env` files for local development
   - Use environment variables in production

2. **Separate Configuration by Environment**
   - Development: `.env.development`
   - Testing: `.env.test`
   - Production: Environment variables or secrets manager

3. **Validate Configuration on Startup**
   - Check required values
   - Validate formats (URLs, ports, etc.)
   - Set sensible defaults

4. **Use Type-Safe Configuration**
   - Define configuration structs
   - Use validation tags
   - Provide clear error messages

5. **Centralize Configuration**
   - Single source of truth
   - Easy to update and maintain
   - Clear documentation

## Example: Complete Configuration

```go
package config

import (
    "os"
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
}

type ServerConfig struct {
    Host string
    Port int
    Mode string
}

type DatabaseConfig struct {
    Host     string
    Port     int
    Database string
    User     string
    Password string
}

type RedisConfig struct {
    Host string
    Port int
}

func Load() (*Config, error) {
    viper.AutomaticEnv()
    
    config := &Config{
        Server: ServerConfig{
            Host: getEnv("SERVER_HOST", "0.0.0.0"),
            Port: getEnvInt("SERVER_PORT", 8080),
            Mode: getEnv("GO_MODE", "debug"),
        },
        Database: DatabaseConfig{
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnvInt("DB_PORT", 5432),
            Database: getEnv("DB_NAME", "mydb"),
            User:     getEnv("DB_USER", "user"),
            Password: getEnv("DB_PASSWORD", ""),
        },
        Redis: RedisConfig{
            Host: getEnv("REDIS_HOST", "localhost"),
            Port: getEnvInt("REDIS_PORT", 6379),
        },
    }
    
    return config, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    // Implementation for integer env vars
    return defaultValue
}
```

## Next Steps

- Learn about [Framework Architecture](/architecture) for overall structure
- Review [Core Concepts](/core-concepts) for implementation patterns
- Check the [PostgreSQL Example](/postgres/) for a complete configuration example
