# Framework Configuration

Configure the goserve framework components for your application.

## Overview

goserve uses a comprehensive configuration system that supports environment variables, configuration files, and type-safe configuration structs. The framework is designed for production deployments with secure credential management and database connection pooling.

### Operations quick reference
- **Health**: `GET /health` (liveness) is available in all sample repos; use for k8s/Docker healthchecks.
- **Readiness**: wait for DB + Redis to be up before routing traffic; in Docker Compose examples, rely on `depends_on` and retriable connections in startup.
- **Profiles**: docker-compose supports standard and load-balanced (gomicro) files; pick the file that matches your topology.
- **Secrets**: store JWT keys and passwords outside the repo; samples generate RSA keys via `.tools/rsa/keygen.go` and copy envs via `.tools/copy/envs.go`.

### Environment matrix (quick reference)

| Mode | DB_HOST | REDIS_HOST | SERVER_PORT | Notes |
| --- | --- | --- | --- | --- |
| Docker Compose (examples) | postgres / mongo / auth-service | redis | 8080 (mono), 8000 (gomicro) | Use service names from compose files |
| Local development | localhost | localhost | 8080 | Keep DB/Redis running (containers or local installs) |
| CI / tests | pipeline-specific | pipeline-specific | configurable | Mirror `.test.env`; ensure services are reachable from runners |

## Network Configuration

### Controller Configuration

goserve uses a structured startup system. Controllers are configured through the dependency injection system rather than direct Gin router setup. See the PostgreSQL example for the complete configuration pattern.

## PostgreSQL Configuration

### PostgreSQL Configuration (Production-Ready)

goserve uses advanced PostgreSQL configuration with connection pooling, health checks, and timeout management:

```go
import "github.com/afteracademy/goserve/postgres"

type PostgresConfig struct {
    User        string        // Database user
    Pwd         string        // Database password
    Host        string        // Database host
    Port        string        // Database port
    Name        string        // Database name
    MinPoolSize int           // Minimum pool size
    MaxPoolSize int           // Maximum pool size
    Timeout     time.Duration // Query timeout
}

config := PostgresConfig{
    User:        "myuser",
    Pwd:         "secure_password",
    Host:        "localhost",
    Port:        "5432",
    Name:        "goserve_db",
    MinPoolSize: 5,
    MaxPoolSize: 25,
    Timeout:     30 * time.Second,
}

db := postgres.NewDatabase(context.Background(), config)
db.Connect()
defer db.Close()

// Get the connection pool for services
pool := db.Pool()
```

### Environment Variables (Complete Set)

```bash
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_USER=myuser
DB_USER_PWD=secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=goserve_db
DB_MIN_POOL_SIZE=5
DB_MAX_POOL_SIZE=25
DB_QUERY_TIMEOUT=30s

# ===========================================
# REDIS CONFIGURATION
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET_KEY_PATH=keys/jwtRS256.key
JWT_PUBLIC_KEY_PATH=keys/jwtRS256.key.pub
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_HOURS=24

# ===========================================
# SERVER CONFIGURATION
# ===========================================
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
GO_ENV=production
LOG_LEVEL=info

# ===========================================
# CACHE CONFIGURATION
# ===========================================
BLOG_CACHE_TTL_MINUTES=60
USER_CACHE_TTL_MINUTES=30

# ===========================================
# EMAIL CONFIGURATION (for notifications)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com

# ===========================================
# API CONFIGURATION
# ===========================================
API_BASE_URL=https://api.yourapp.com
API_VERSION=v1
CORS_ALLOWED_ORIGINS=https://yourapp.com,https://app.yourapp.com
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# ===========================================
# MICROSERVICES CONFIGURATION
# ===========================================
KONG_ADMIN_URL=http://localhost:8001
SERVICE_NAME=blog-service
SERVICE_PORT=8002
```

### Connection Pool Options

- **MaxConns**: Maximum number of connections in the pool
- **MinConns**: Minimum number of connections to maintain
- **MaxConnLifetime**: Maximum lifetime of a connection
- **MaxConnIdleTime**: Maximum idle time before closing a connection


## Redis Configuration

### Redis Configuration with Type-Safe Caching

goserve provides Redis integration with connection pooling and type-safe generic caching:

```go
import "github.com/afteracademy/goserve/redis"

// Redis store for connection management
store := redis.NewStore(&redis.Options{
    Addr:     "localhost:6379",
    Password: "", // Optional
    DB:       0,
})

// Type-safe cache for specific data types
type BlogCache struct {
    ID          uuid.UUID `json:"id"`
    Title       string    `json:"title"`
    Slug        string    `json:"slug"`
    PublishedAt time.Time `json:"publishedAt"`
}

blogCache := redis.NewCache[BlogCache](store)

// Usage in services
func (s *service) getBlogCache(id uuid.UUID) (*BlogCache, error) {
    return s.blogCache.Get(id.String())
}

func (s *service) setBlogCache(id uuid.UUID, data *BlogCache) error {
    return s.blogCache.Set(id.String(), data, time.Hour)
}
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
REDIS_MAX_CONN_AGE=30m
REDIS_IDLE_TIMEOUT=5m
```

## Middleware Configuration

### JWT Authentication with RSA Keys

goserve uses RSA key pairs for secure JWT authentication:

```go
import "github.com/afteracademy/goserve/network"

// Authentication provider with RSA keys
authProvider := &authenticationProvider{
    common.ContextPayload{},
    authService,
    userService,
}

// Authorization provider with role checking
authorizeProvider := &authorizationProvider{
    common.ContextPayload{},
}

// Create controller with both auth providers
controller := network.NewController(
    "/api/blog",
    authProvider,
    authorizeProvider,
)

// Use in route mounting
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes
    group.GET("/public", c.getPublicBlogs)

    // Authenticated routes
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
        protected.POST("/", c.createBlog)

        // Role-based routes
        author := protected.Group("/author")
        author.Use(c.AuthorizeProvider.RequireRole("author", "admin"))
        {
            author.POST("/", c.createBlog)
        }
    }
}
```

### RSA Key Generation for JWT

```bash
# Generate RSA key pair for JWT signing
go run .tools/rsa/main.go

# This creates:
# - keys/jwtRS256.key (private key)
# - keys/jwtRS256.key.pub (public key)
```

### JWT Configuration

```go
// JWT service configuration
jwtConfig := &auth.JWTConfig{
    PrivateKeyPath:    "keys/jwtRS256.key",
    PublicKeyPath:     "keys/jwtRS256.key.pub",
    AccessExpiry:      15 * time.Minute,
    RefreshExpiry:     24 * time.Hour,
    Issuer:           "goserve-api",
}

jwtService := auth.NewJWTService(jwtConfig)
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

## Complete Environment Configuration

goserve uses a comprehensive environment configuration pattern as seen in the PostgreSQL example:

```go
package config

import (
    "os"
    "strconv"
    "time"
)

// Env holds all environment configuration
type Env struct {
    // Database
    DBUser        string
    DBUserPwd     string
    DBHost        string
    DBPort        string
    DBName        string
    DBMinPoolSize int
    DBMaxPoolSize int
    DBQueryTimeout time.Duration

    // Redis
    RedisHost     string
    RedisPort     int
    RedisPassword string
    RedisDB       int

    // JWT
    JWTSecretKeyPath  string
    JWTPublicKeyPath  string
    JWTAccessTokenExpiryMinutes int
    JWTRefreshTokenExpiryHours  int

    // Server
    ServerHost string
    ServerPort int
    GoEnv      string
    LogLevel   string

    // Cache TTL
    BlogCacheTTLMinutes int
    UserCacheTTLMinutes int

    // Email (optional)
    SMTPHost     string
    SMTPPort     int
    SMTPUser     string
    SMTPPassword string
    FromEmail    string
}

// Load reads environment variables with defaults
func Load() *Env {
    return &Env{
        // Database Configuration
        DBUser:        getEnv("DB_USER", "postgres"),
        DBUserPwd:     getEnv("DB_USER_PWD", "password"),
        DBHost:        getEnv("DB_HOST", "localhost"),
        DBPort:        getEnv("DB_PORT", "5432"),
        DBName:        getEnv("DB_NAME", "goserve"),
        DBMinPoolSize: getEnvInt("DB_MIN_POOL_SIZE", 5),
        DBMaxPoolSize: getEnvInt("DB_MAX_POOL_SIZE", 25),
        DBQueryTimeout: getEnvDuration("DB_QUERY_TIMEOUT", 30*time.Second),

        // Redis Configuration
        RedisHost:     getEnv("REDIS_HOST", "localhost"),
        RedisPort:     getEnvInt("REDIS_PORT", 6379),
        RedisPassword: getEnv("REDIS_PASSWORD", ""),
        RedisDB:       getEnvInt("REDIS_DB", 0),

        // JWT Configuration
        JWTSecretKeyPath:  getEnv("JWT_SECRET_KEY_PATH", "keys/jwtRS256.key"),
        JWTPublicKeyPath:  getEnv("JWT_PUBLIC_KEY_PATH", "keys/jwtRS256.key.pub"),
        JWTAccessTokenExpiryMinutes: getEnvInt("JWT_ACCESS_TOKEN_EXPIRY_MINUTES", 15),
        JWTRefreshTokenExpiryHours:  getEnvInt("JWT_REFRESH_TOKEN_EXPIRY_HOURS", 24),

        // Server Configuration
        ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
        ServerPort: getEnvInt("SERVER_PORT", 8000),
        GoEnv:      getEnv("GO_ENV", "development"),
        LogLevel:   getEnv("LOG_LEVEL", "info"),

        // Cache Configuration
        BlogCacheTTLMinutes: getEnvInt("BLOG_CACHE_TTL_MINUTES", 60),
        UserCacheTTLMinutes: getEnvInt("USER_CACHE_TTL_MINUTES", 30),

        // Email Configuration (optional)
        SMTPHost:     getEnv("SMTP_HOST", ""),
        SMTPPort:     getEnvInt("SMTP_PORT", 587),
        SMTPUser:     getEnv("SMTP_USER", ""),
        SMTPPassword: getEnv("SMTP_PASSWORD", ""),
        FromEmail:    getEnv("FROM_EMAIL", ""),
    }
}

// Helper functions
func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
    if value := os.Getenv(key); value != "" {
        if duration, err := time.ParseDuration(value); err == nil {
            return duration
        }
    }
    return defaultValue
}
```

### Environment File Template (.env)

```bash
# Database
DB_USER=postgres
DB_USER_PWD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=goserve_db
DB_MIN_POOL_SIZE=5
DB_MAX_POOL_SIZE=25
DB_QUERY_TIMEOUT=30s

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT (RSA keys will be generated)
JWT_SECRET_KEY_PATH=keys/jwtRS256.key
JWT_PUBLIC_KEY_PATH=keys/jwtRS256.key.pub
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_HOURS=24

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
GO_ENV=development
LOG_LEVEL=debug

# Cache
BLOG_CACHE_TTL_MINUTES=60
USER_CACHE_TTL_MINUTES=30

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
```

## Next Steps

- Learn about [Framework Architecture](/architecture) for overall structure
- Review [Core Concepts](/core-concepts) for implementation patterns
- Check the [PostgreSQL Example](/postgres/) for a complete configuration example
