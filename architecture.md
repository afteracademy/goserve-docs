# Framework Architecture

Understanding the goserve framework architecture and design patterns.

## Overview

goserve is built on a **layered, feature-based architecture** that promotes clean code, separation of concerns, and testability. The framework emphasizes each API being independent while sharing common services, reducing code conflicts in team environments.

## Core Principles

1. **Feature Independence** - Each API feature is organized in separate directories by endpoint
2. **Service Sharing** - Common services can be shared across features while maintaining independence
3. **Layered Architecture** - Clear separation between Controllers, Services, Models, and DTOs
4. **Testability** - Architecture supports easy unit and integration testing
5. **Scalable Architecture** - Modular design supports scaling and extension
6. **Authentication & Authorization** - Built-in JWT authentication and role-based authorization

## Framework Structure

```
goserve/
├── api/                    # Feature-based API modules
│   ├── auth/              # Authentication endpoints
│   │   ├── dto/           # Request/Response DTOs
│   │   ├── model/         # Database models
│   │   ├── controller.go  # HTTP handlers
│   │   ├── service.go     # Business logic
│   │   └── middleware/    # Auth middleware
│   └── blog/              # Blog feature
│       ├── dto/
│       ├── model/
│       ├── controller.go
│       └── service.go
├── cmd/                   # Application entry points
│   └── main.go           # Main application
├── common/                # Shared utilities
├── config/                # Configuration management
├── startup/               # Server initialization
│   ├── server.go         # HTTP server setup
│   ├── module.go         # Dependency injection
│   └── testserver.go     # Test server utilities
├── network/               # HTTP networking layer
│   ├── controller.go     # Base controller interface
│   ├── middleware.go     # Authentication/Authorization
│   └── router.go         # Route management
├── postgres/              # PostgreSQL support
│   ├── connection.go     # Connection pooling
│   ├── pool.go           # Pool management
│   └── utilities.go      # Query helpers
├── mongo/                 # MongoDB support
├── redis/                 # Redis caching
├── middleware/            # Built-in middleware
│   ├── auth.go           # JWT authentication
│   ├── cors.go           # CORS handling
│   └── logger.go         # Request logging
├── dto/                   # Shared DTOs
├── utility/               # Utility functions
├── micro/                 # Microservice patterns
└── keys/                  # RSA keys for JWT
```

## Layered Architecture Pattern

goserve follows a **4-layer architecture** pattern that separates concerns while maintaining clean dependencies:

### 1. Controller Layer (Network Layer)

Handles HTTP requests and responses, acts as the entry point:

**Location**: `api/[feature]/controller.go`

**Responsibilities**:
- Route definition and mounting
- Request parsing and validation
- Response formatting
- HTTP-specific logic handling
- Error response formatting

**Key Pattern**:
```go
type controller struct {
    network.Controller
    common.ContextPayload
    service Service
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

### 2. Service Layer (Business Logic)

Contains business logic and orchestrates between controllers and repositories:

**Location**: `api/[feature]/service.go`

**Responsibilities**:
- Business rule enforcement
- Data transformation and validation
- Database operations coordination
- Cache management
- External service integration

**Key Pattern**:
```go
type service struct {
    db    *pgxpool.Pool
    cache redis.Cache[dto.EntityCache]
}

func (s *service) Create(dto *dto.CreateRequest) (*model.Entity, error) {
    // Business logic validation
    // Database operations
    // Cache invalidation
    // Return result
}
```

### 3. Model Layer (Data Entities)

Defines database schema and internal data structures:

**Location**: `api/[feature]/model/[entity].go`

**Responsibilities**:
- Database table representation
- Data type definitions
- Field mapping documentation
- Internal domain entities

**Key Pattern**:
```go
type Blog struct {
    ID          uuid.UUID   // id
    Title       string      // title
    Description string      // description
    Text        *string     // text
    AuthorID    uuid.UUID   // author_id
    Status      bool        // status
    CreatedAt   time.Time   // created_at
    UpdatedAt   time.Time   // updated_at
}
```

### 4. DTO Layer (Data Transfer Objects)

Defines request/response contracts and API boundaries:

**Location**: `api/[feature]/dto/[operation].go`

**Responsibilities**:
- Input validation and sanitization
- Output formatting and filtering
- API contract documentation
- Sensitive data hiding

**Key Pattern**:
```go
type BlogCreate struct {
    Title       string   `json:"title" validate:"required,min=3,max=500"`
    Description string   `json:"description" validate:"required,min=3,max=2000"`
    DraftText   string   `json:"draftText" validate:"required,max=50000"`
    Tags        []string `json:"tags" validate:"required,min=1,dive,uppercase"`
}

type BlogPublic struct {
    ID          uuid.UUID  `json:"id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Tags        []string   `json:"tags"`
    Author      *UserInfo  `json:"author"`
    PublishedAt time.Time  `json:"publishedAt"`
}
```

## Design Patterns

### JWT Authentication Pattern

goserve implements JWT-based authentication with RSA key pairs:

**Key Components**:
- RSA public/private key pairs for token signing
- JWT middleware for token validation
- Claims extraction and user context setting
- Refresh token support

**Implementation**:
```go
// Authentication middleware extracts and validates JWT
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

### API Key Authentication Pattern

For service-to-service communication and external API access:

**Key Components**:
- Extensible middleware system
- Custom apikey-auth plugin
- Service-level API key validation
- Rate limiting and access control

**Request Flow**:
```
Client Request → Middleware Chain → Controller → Service → Database
```

### Role-Based Authorization Pattern

Implements hierarchical permission system:

```go
// Authorization middleware checks user roles
func (m *authorizationProvider) Middleware(requiredRoles ...string) gin.HandlerFunc {
    return func(ctx *gin.Context) {
        user := m.GetUser(ctx)
        if user == nil {
            network.SendUnauthorizedError(ctx, "User not authenticated", nil)
            return
        }

        if !m.hasRequiredRole(user, requiredRoles) {
            network.SendForbiddenError(ctx, "Insufficient permissions", nil)
            return
        }

        ctx.Next()
    }
}
```

### Cache-Aside Pattern

Implements intelligent caching with database fallbacks:

```go
func (s *service) GetBlogById(id uuid.UUID) (*dto.BlogPublic, error) {
    // Try cache first
    cached, err := s.cache.Get(id.String())
    if err == nil {
        return cached, nil
    }

    // Query database
    blog, err := s.GetPublishedBlogById(id)
    if err != nil {
        return nil, err
    }

    // Update cache
    s.cache.Set(id.String(), blog, time.Hour)
    return blog, nil
}
```

## Request Flow

### Complete Request Lifecycle

```
HTTP Request
    ↓
Root Middleware (Global)
├── Error Catcher
├── Request Validation
└── Not Found Handler
    ↓
Router (Gin)
    ↓
Feature Route Group (/api/blog)
    ↓
Authentication Middleware (JWT)
├── Extract Bearer Token
├── Verify RSA Signature
├── Validate Claims & Expiry
├── Load User from Database
└── Set User Context
    ↓
Authorization Middleware (Roles)
├── Check User Permissions
├── Validate Required Roles
└── Allow/Deny Access
    ↓
Controller Handler
├── Parse Request Body (DTO)
├── Validate Input
└── Call Service Method
    ↓
Service Layer (Business Logic)
├── Business Rule Validation
├── Database Operations
├── Cache Management
└── External Service Calls
    ↓
Repository Layer (Data Access)
├── Query Construction
├── Parameter Binding
└── Result Mapping
    ↓
Database/External Services
    ↓
Response Formatting
├── Success (200-299)
├── Client Error (400-499)
└── Server Error (500-599)
```

### Middleware Chain Details

**Global Middleware** (applied to all routes):
- Error recovery and logging
- CORS headers
- Request ID generation
- Rate limiting

**Authentication Middleware** (protected routes):
- JWT token extraction and validation
- User context loading
- Session management

**Authorization Middleware** (role-protected routes):
- Permission checking
- Role validation
- Access control

**Feature Middleware** (feature-specific):
- Input validation
- Custom business rules
- Audit logging

## Feature-Based Organization

goserve organizes code by **business features** rather than technical layers, making it easier for teams to work independently:

### Recommended Project Structure

```
your-project/
├── api/                    # Feature-based API modules
│   ├── auth/              # Authentication & user management
│   │   ├── dto/           # Login, signup, token DTOs
│   │   ├── model/         # User model
│   │   ├── controller.go  # /auth/* endpoints
│   │   ├── service.go     # Auth business logic
│   │   └── middleware/    # Auth-specific middleware
│   ├── blog/              # Blog management feature
│   │   ├── author/        # Author-specific endpoints (/blog/author/*)
│   │   ├── editor/        # Editor-specific endpoints (/blog/editor/*)
│   │   ├── dto/           # Blog DTOs (shared)
│   │   ├── model/         # Blog models (shared)
│   │   ├── controller.go  # /blog endpoints
│   │   └── service.go     # Blog business logic
│   ├── blogs/             # Public blog listing (/blogs/*)
│   │   ├── dto/           # Public blog DTOs
│   │   ├── controller.go  # Public endpoints
│   │   └── service.go     # Public blog service
│   └── contact/           # Contact form feature
│       ├── dto/           # Contact DTOs
│       ├── controller.go  # /contact endpoints
│       └── service.go     # Contact handling
├── cmd/                   # Application entry points
│   └── main.go           # Main application
├── common/                # Shared utilities
│   └── payload.go        # Request context helpers
├── config/                # Configuration management
│   └── env.go            # Environment variables
├── startup/               # Server initialization
│   ├── server.go         # HTTP server setup
│   ├── module.go         # Dependency injection container
│   └── testserver.go     # Test server utilities
├── tests/                 # Integration tests
├── utils/                 # Utility functions
├── keys/                  # RSA keys for JWT
├── .tools/                # Code generation tools
└── docker-compose.yml     # Docker orchestration
```

### Feature Organization Principles

**Independent Features**: Each feature is self-contained with its own directory:
```
api/auth/     # Complete auth feature
api/blog/     # Blog management
api/blogs/    # Public blog access
```

**Shared Resources**: Related features can share models and DTOs:
```
api/blog/
├── dto/      # Shared between author/editor features
├── model/    # Shared database models
└── service.go # Shared business logic
```

**Clear Boundaries**: Features communicate through well-defined interfaces, not direct dependencies.

## Dependency Injection & Module System

goserve uses a **module-based dependency injection** system that wires all components together:

### Module Pattern

The `startup/module.go` implements clean dependency injection:

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

// Dependency wiring
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
```

### Benefits

- **Clean Architecture**: Clear component relationships
- **Testability**: Easy mocking of dependencies
- **Flexibility**: Easy to swap implementations
- **Maintainability**: Centralized dependency management

## Error Handling

Consistent error handling across the framework:

- Structured error responses
- HTTP status code mapping
- Error logging and tracking

## Configuration Management

Environment-based configuration:

- Environment variables
- Configuration files
- Default values
- Type-safe config access

## Testing Support

Built-in support for testing:

- Test server utilities
- Mock generators
- Integration test helpers

## Microservices Support

goserve's modular architecture supports scaling to larger applications through service extraction and component reuse.


## Performance Considerations

- **Connection Pooling**: Optimized database connections
- **Caching Strategy**: Redis integration with cache-aside pattern
- **Efficient Routing**: Gin-based routing with minimal overhead
- **Horizontal Scaling**: Stateless services ready for scaling

## Testing Architecture

goserve supports comprehensive testing at all levels:

### Unit Tests
```go
func TestAuthController_SignupSuccess(t *testing.T) {
    mockService := new(auth.MockService)
    mockService.On("SignUpBasic", mock.Anything).Return(&dto.UserAuth{}, nil)

    controller := auth.NewController(nil, nil, mockService)
    // Test controller logic
}
```

### Integration Tests
```go
func TestIntegration_CreateBlog(t *testing.T) {
    router, module, teardown := startup.TestServer()
    defer teardown()

    token := createTestUser(t, router)
    response := makeRequest(t, router, "POST", "/blog/author", token, body)

    assert.Equal(t, 200, response.StatusCode)
}
```

## Next Steps

- Learn about [Core Concepts](/core-concepts) for detailed implementation patterns
- See [Configuration](/configuration) for environment setup
- Check the [PostgreSQL Example](/postgres/) for a complete implementation