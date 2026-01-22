# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve framework.

## Table of Contents

- [Controllers](#controllers)
- [Services](#services)
- [Repositories](#repositories)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Middleware](#middleware)
- [Dependency Injection](#dependency-injection)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Database Connections](#database-connections)
- [Caching](#caching)

---

## Controllers

Controllers are responsible for handling HTTP requests and responses. They define API endpoints and delegate business logic to services.

### Controller Interface

```go
type Controller interface {
    MountRoutes(router *gin.Engine)
}
```

### Basic Controller

```go
type MyController struct {
    network.Controller
    service Service
}

func NewController(service Service) network.Controller {
    return &MyController{
        Controller: network.NewController("/api", nil, nil),
        service: service,
    }
}

func (c *MyController) MountRoutes(router *gin.Engine) {
    c.Controller.MountRoutes(router)
    router.GET("/items", c.getItems)
    router.POST("/items", c.createItem)
}
```

### Key Responsibilities

1. **Route Definition** - Define HTTP endpoints
2. **Request Parsing** - Extract and validate request data
3. **Response Formation** - Send appropriate HTTP responses
4. **Error Handling** - Handle and format errors

---

## Services

Services contain business logic and coordinate between controllers and repositories.

### Service Pattern

```go
type Service interface {
    GetItem(id string) (*Item, error)
    CreateItem(item *Item) error
}

type service struct {
    repository Repository
}

func NewService(repo Repository) Service {
    return &service{
        repository: repo,
    }
}

func (s *service) GetItem(id string) (*Item, error) {
    // Business logic here
    return s.repository.FindByID(id)
}
```

### Service Responsibilities

- Business logic implementation
- Data validation
- Transaction management
- Error handling

---

## Repositories

Repositories abstract data access and provide a clean interface for database operations.

### Repository Pattern

```go
type Repository interface {
    FindByID(id string) (*Item, error)
    Create(item *Item) error
    Update(item *Item) error
    Delete(id string) error
}

type repository struct {
    db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
    return &repository{db: db}
}
```

### Benefits

- Separation of data access from business logic
- Easy to mock for testing
- Database-agnostic business logic

---

## DTOs (Data Transfer Objects)

DTOs define the structure of data transferred between layers.

### Request DTO

```go
type CreateItemRequest struct {
    Name        string `json:"name" validate:"required,min=3"`
    Description string `json:"description" validate:"required"`
    Price       float64 `json:"price" validate:"required,gt=0"`
}
```

### Response DTO

```go
type ItemResponse struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    Price       float64   `json:"price"`
    CreatedAt   time.Time `json:"created_at"`
}
```

### Benefits

- Type safety
- Clear API contracts
- Validation rules
- Versioning support

---

## Middleware

Middleware provides cross-cutting concerns like authentication, logging, and error handling.

### Authentication Middleware

```go
func AuthMiddleware(authProvider network.AuthenticationProvider) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := extractToken(c)
        if !authProvider.Validate(token) {
            c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
            return
        }
        c.Next()
    }
}
```

### Using Middleware

```go
router.Use(AuthMiddleware(authProvider))
router.Use(LoggerMiddleware())
router.Use(CORSMiddleware())
```

### Built-in Middleware

- Authentication
- Authorization
- CORS
- Logging
- Rate limiting

---

## Dependency Injection

Dependency injection promotes loose coupling and testability.

### Constructor Injection

```go
func NewController(
    authProvider network.AuthenticationProvider,
    authorizeProvider network.AuthorizationProvider,
    service Service,
) network.Controller {
    return &controller{
        Controller: network.NewController("/api", authProvider, authorizeProvider),
        service: service,
    }
}
```

### Benefits

- Easy testing with mocks
- Loose coupling
- Clear dependencies
- Flexible configuration

---

## Error Handling

Consistent error handling across the application.

### Error Types

```go
type AppError struct {
    Code    int
    Message string
    Details interface{}
}
```

### Error Response

```go
func (c *controller) handleError(ctx *gin.Context, err error) {
    if appErr, ok := err.(*AppError); ok {
        ctx.JSON(appErr.Code, gin.H{
            "error": appErr.Message,
            "details": appErr.Details,
        })
        return
    }
    ctx.JSON(500, gin.H{"error": "Internal server error"})
}
```

---

## Validation

Request validation using the validator library.

### Validation Tags

```go
type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Age      int    `json:"age" validate:"required,min=18,max=120"`
}
```

### Validation Middleware

```go
func ValidateRequest(dto interface{}) gin.HandlerFunc {
    return func(c *gin.Context) {
        if err := c.ShouldBindJSON(dto); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            c.Abort()
            return
        }
        c.Set("dto", dto)
        c.Next()
    }
}
```

---

## Database Connections

### PostgreSQL Connection

```go
import "github.com/afteracademy/goserve/postgres"

pool, err := postgres.NewConnectionPool(config)
if err != nil {
    log.Fatal(err)
}
defer pool.Close()
```

### Connection Pooling

- Automatic connection pooling
- Configurable pool size
- Health checks
- Graceful shutdown

---

## Caching

Redis caching for improved performance.

### Cache Operations

```go
import "github.com/afteracademy/goserve/redis"

client := redis.NewClient(config)

// Set
client.Set(ctx, "key", "value", time.Hour)

// Get
val, err := client.Get(ctx, "key")
```

### Cache Patterns

- Cache-aside
- Write-through
- Write-behind
- Cache invalidation

---

## Best Practices

1. **Keep controllers thin** - Delegate to services
2. **Use interfaces** - For easy mocking and testing
3. **Validate early** - Validate requests at the controller level
4. **Handle errors consistently** - Use structured error responses
5. **Log appropriately** - Log errors and important events
6. **Use DTOs** - Don't expose internal models directly
7. **Test thoroughly** - Unit tests for services, integration tests for APIs

## Next Steps

- See [Framework Architecture](/architecture) for overall structure
- Check [Configuration](/configuration) for setup details
- Review the [PostgreSQL Example](/postgres/) for complete examples
