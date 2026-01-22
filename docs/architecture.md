# Project Architecture

Understanding the goserve example API architecture and design patterns.

## Overview

The project follows a **feature-based modular architecture** where each API endpoint is organized into self-contained modules with clear separation of concerns.

### Core Principles

1. **Feature Independence** - Each API feature is isolated in its own directory
2. **Service Sharing** - Common services can be shared across features
3. **Clean Separation** - Controllers, services, models, and DTOs are clearly separated
4. **Testability** - Architecture supports easy unit and integration testing

## Directory Structure

```
goserve-example-api-server-postgres/
├── api/                    # API feature modules
│   ├── auth/              # Authentication
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── model/         # Database models
│   │   ├── middleware/    # Auth middleware
│   │   ├── controller.go  # HTTP handlers
│   │   ├── service.go     # Business logic
│   │   └── mock.go        # Test mocks
│   ├── blog/              # Blog operations
│   │   ├── author/        # Author-specific endpoints
│   │   ├── editor/        # Editor-specific endpoints
│   │   ├── dto/
│   │   ├── model/
│   │   ├── controller.go
│   │   └── service.go
│   ├── blogs/             # Public blog listing
│   ├── contact/           # Contact form
│   └── user/              # User management
├── cmd/                   # Application entry point
│   └── main.go           # Main function
├── common/                # Shared utilities
│   └── payload.go        # Request context helpers
├── config/                # Configuration
│   └── env.go            # Environment variables
├── startup/               # Server initialization
│   ├── server.go         # Server setup
│   ├── module.go         # Dependency injection
│   └── testserver.go     # Test server
├── tests/                 # Integration tests
├── utils/                 # Utility functions
├── .tools/                # Code generation tools
│   ├── apigen.go         # API generator
│   ├── rsa/              # RSA key generator
│   └── copy/             # Env file copier
├── keys/                  # RSA keys for JWT
├── .extra/                # Database scripts, docs
├── docker-compose.yml     # Docker configuration
└── Dockerfile            # Container image
```

## Application Flow

### Startup Sequence

```
main.go
  ↓
startup.Server()
  ↓
create() - Initialize components
  ├── Load Environment (config.Env)
  ├── Connect PostgreSQL (postgres.Database)
  ├── Connect Redis (redis.Store)
  ├── Create Module (startup.Module)
  │   ├── Initialize Services
  │   ├── Create Controllers
  │   ├── Setup Middleware
  │   └── Wire Dependencies
  ↓
router.Start() - Start HTTP server
```

### Request Flow

```
HTTP Request
  ↓
Root Middleware (global)
  ├── Error Catcher
  ├── API Key Validation
  └── Not Found Handler
  ↓
Router (Gin)
  ↓
Feature Route Group
  ↓
Authentication Middleware (if required)
  ├── Extract JWT token
  ├── Verify signature
  ├── Validate claims
  └── Load user from database
  ↓
Authorization Middleware (if required)
  ├── Check user roles
  └── Verify permissions
  ↓
Controller Handler
  ├── Parse request (params, query, body)
  ├── Validate input
  └── Call service method
  ↓
Service Layer
  ├── Business logic
  ├── Database operations
  ├── Cache operations
  └── External service calls
  ↓
Response
  ├── Success (200-299)
  ├── Client Error (400-499)
  └── Server Error (500-599)
```

## Layer Responsibilities

### 1. Controllers

**Location**: `api/[feature]/controller.go`

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Define route endpoints
- Parse and validate requests
- Call service methods
- Format responses
- Handle HTTP-specific logic

**Example**:

```go
type controller struct {
    network.Controller
    common.ContextPayload
    service Service
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    group.POST("/", c.createHandler)
    group.GET("/id/:id", c.getHandler)
    group.PUT("/id/:id", c.updateHandler)
    group.DELETE("/id/:id", c.deleteHandler)
}

func (c *controller) createHandler(ctx *gin.Context) {
    body, err := network.ReqBody[dto.CreateRequest](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, err.Error(), err)
        return
    }
    
    result, err := c.service.Create(body)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }
    
    network.SendSuccessDataResponse(ctx, "success", result)
}
```

### 2. Services

**Location**: `api/[feature]/service.go`

**Purpose**: Implement business logic

**Responsibilities**:
- Business rule enforcement
- Database operations
- Cache management
- Data transformation
- Service-to-service communication

**Example**:

```go
type Service interface {
    Create(dto *dto.CreateRequest) (*model.Entity, error)
    FindByID(id uuid.UUID) (*model.Entity, error)
    Update(dto *dto.UpdateRequest) (*model.Entity, error)
    Delete(id uuid.UUID) error
}

type service struct {
    db    *pgxpool.Pool
    cache redis.Cache[dto.EntityCache]
}

func (s *service) FindByID(id uuid.UUID) (*model.Entity, error) {
    // Try cache first
    cached, err := s.cache.Get(id.String())
    if err == nil {
        return cached, nil
    }
    
    // Query database
    var entity model.Entity
    query := `SELECT * FROM entities WHERE id = $1`
    err = s.db.QueryRow(ctx, query, id).Scan(&entity)
    if err != nil {
        return nil, err
    }
    
    // Update cache
    s.cache.Set(id.String(), &entity, time.Hour)
    
    return &entity, nil
}
```

### 3. Models

**Location**: `api/[feature]/model/[entity].go`

**Purpose**: Define database schema

**Responsibilities**:
- Represent database tables
- Define data types
- Document field mappings

**Example**:

```go
type Blog struct {
    ID          uuid.UUID   // id
    Title       string      // title
    Description string      // description
    Text        *string     // text
    DraftText   string      // draft_text
    Tags        []string    // tags
    AuthorID    uuid.UUID   // author_id
    Slug        string      // slug
    Status      bool        // status
    Published   bool        // published
    CreatedAt   time.Time   // created_at
    UpdatedAt   time.Time   // updated_at
}
```

### 4. DTOs (Data Transfer Objects)

**Location**: `api/[feature]/dto/[operation].go`

**Purpose**: Define request/response schemas

**Responsibilities**:
- Input validation
- Output formatting
- Type safety
- API contract documentation

**Example**:

```go
type BlogCreate struct {
    Title       string   `json:"title" validate:"required,min=3,max=500"`
    Description string   `json:"description" validate:"required,min=3,max=2000"`
    DraftText   string   `json:"draftText" validate:"required,max=50000"`
    Slug        string   `json:"slug" validate:"required,min=3,max=200"`
    ImgURL      string   `json:"imgUrl" validate:"required,uri,max=200"`
    Tags        []string `json:"tags" validate:"required,min=1,dive,uppercase"`
}

type BlogPublic struct {
    ID          uuid.UUID  `json:"id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Slug        string     `json:"slug"`
    Author      *UserInfo  `json:"author"`
    Tags        []string   `json:"tags"`
    PublishedAt time.Time  `json:"publishedAt"`
}
```

### 5. Middleware

**Location**: `api/[feature]/middleware/[name].go`

**Purpose**: Process requests before/after handlers

**Responsibilities**:
- Authentication
- Authorization
- Request validation
- Logging
- Rate limiting

**Example**:

```go
type authenticationProvider struct {
    common.ContextPayload
    authService auth.Service
    userService user.Service
}

func (m *authenticationProvider) Middleware() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        token := utils.ExtractBearerToken(ctx.GetHeader("Authorization"))
        
        claims, err := m.authService.VerifyToken(token)
        if err != nil {
            network.SendUnauthorizedError(ctx, err.Error(), err)
            return
        }
        
        user, err := m.userService.FetchUserById(claims.Subject)
        if err != nil {
            network.SendUnauthorizedError(ctx, "User not found", err)
            return
        }
        
        m.SetUser(ctx, user)
        ctx.Next()
    }
}
```

## Module System

### Module Interface

The `startup/module.go` file implements dependency injection:

```go
type Module interface {
    GetInstance() *module
    Controllers() []network.Controller
    RootMiddlewares() []network.RootMiddleware
    AuthenticationProvider() network.AuthenticationProvider
    AuthorizationProvider() network.AuthorizationProvider
}

type module struct {
    Context     context.Context
    Env         *config.Env
    DB          postgres.Database
    Store       redis.Store
    UserService user.Service
    AuthService auth.Service
    BlogService blog.Service
}
```

### Dependency Wiring

```go
func NewModule(ctx context.Context, env *config.Env, db postgres.Database, store redis.Store) Module {
    // Initialize services with dependencies
    userService := user.NewService(db.Pool())
    authService := auth.NewService(db.Pool(), env, userService)
    blogService := blog.NewService(db.Pool(), store, userService)
    
    return &module{
        Context:     ctx,
        Env:         env,
        DB:          db,
        Store:       store,
        UserService: userService,
        AuthService: authService,
        BlogService: blogService,
    }
}

func (m *module) Controllers() []network.Controller {
    return []network.Controller{
        auth.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), m.AuthService),
        user.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), m.UserService),
        blog.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), m.BlogService),
        author.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), author.NewService(m.DB.Pool(), m.BlogService)),
        editor.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), editor.NewService(m.DB.Pool(), m.UserService)),
        blogs.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), blogs.NewService(m.DB.Pool(), m.Store)),
        contact.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), contact.NewService(m.DB.Pool())),
    }
}
```

## Feature Organization

### Independent Features

Features with separate endpoints get their own directories:

```
api/
├── auth/      # /auth endpoints
├── user/      # /profile endpoints
├── blogs/     # /blogs endpoints (public listing)
└── contact/   # /contact endpoints
```

### Shared Resources

Related features share a directory:

```
api/blog/
├── author/        # /blog/author endpoints
├── editor/        # /blog/editor endpoints
├── dto/           # Shared DTOs
├── model/         # Shared models
├── controller.go  # /blog endpoints
└── service.go     # Shared service
```

## Database Access

### Connection Pooling

```go
dbConfig := postgres.DbConfig{
    User:        env.DBUser,
    Pwd:         env.DBUserPwd,
    Host:        env.DBHost,
    Port:        env.DBPort,
    Name:        env.DBName,
    MinPoolSize: env.DBMinPoolSize,
    MaxPoolSize: env.DBMaxPoolSize,
    Timeout:     time.Duration(env.DBQueryTimeout) * time.Second,
}

db := postgres.NewDatabase(context, dbConfig)
db.Connect()
```

### Query Patterns

```go
// Single row query
var user model.User
err := db.QueryRow(ctx, query, id).Scan(&user.ID, &user.Name, &user.Email)

// Multiple rows
rows, err := db.Query(ctx, query, params...)
defer rows.Close()

for rows.Next() {
    var item model.Item
    rows.Scan(&item.ID, &item.Name)
    items = append(items, &item)
}

// Insert with RETURNING
err := db.QueryRow(ctx, insertQuery, values...).Scan(&id, &createdAt)

// Transactions
tx, err := db.Begin(ctx)
defer tx.Rollback(ctx)

// ... perform operations

tx.Commit(ctx)
```

## Caching Strategy

### Redis Integration

```go
type service struct {
    db    *pgxpool.Pool
    cache redis.Cache[dto.BlogCache]
}

func NewService(db *pgxpool.Pool, store redis.Store) Service {
    return &service{
        db:    db,
        cache: redis.NewCache[dto.BlogCache](store),
    }
}
```

### Cache Patterns

```go
// Cache-aside pattern
func (s *service) GetBlogById(id uuid.UUID) (*dto.BlogPublic, error) {
    // Try cache first
    blog, err := s.GetBlogDtoCacheById(id)
    if err == nil {
        return blog, nil
    }
    
    // Query database
    blog, err = s.GetPublishedBlogById(id)
    if err != nil {
        return nil, err
    }
    
    // Update cache
    s.SetBlogDtoCacheById(blog)
    
    return blog, nil
}
```

## Error Handling

### Error Types

```go
// Client errors (400-499)
network.SendBadRequestError(ctx, "Invalid input", err)
network.SendUnauthorizedError(ctx, "Authentication required", err)
network.SendForbiddenError(ctx, "Permission denied", err)
network.SendNotFoundError(ctx, "Resource not found", err)

// Server errors (500-599)
network.SendInternalServerError(ctx, "Something went wrong", err)

// Mixed (auto-detect from error type)
network.SendMixedError(ctx, err)
```

### Custom Errors

```go
// In service layer
if exists {
    return nil, network.NewBadRequestError("Resource already exists", nil)
}

if !authorized {
    return nil, network.NewForbiddenError("Insufficient permissions", nil)
}
```

## Testing Architecture

### Unit Tests

Test individual functions with mocks:

```go
func TestAuthController_SignupSuccess(t *testing.T) {
    mockService := new(auth.MockService)
    mockService.On("SignUpBasic", mock.Anything).Return(&dto.UserAuth{}, nil)
    
    controller := auth.NewController(nil, nil, mockService)
    
    // Test controller method
}
```

### Integration Tests

Test complete request/response cycles:

```go
func TestIntegration_CreateBlog(t *testing.T) {
    router, module, teardown := startup.TestServer()
    defer teardown()
    
    // Create user and get token
    token := createTestUser(t, router)
    
    // Make authenticated request
    response := makeRequest(t, router, "POST", "/blog/author", token, body)
    
    assert.Equal(t, 200, response.StatusCode)
}
```

## Next Steps

- Understand [Core Concepts](/core-concepts) in depth
- Learn about [Configuration](/configuration) options
- Explore [API Reference](/api-reference)
