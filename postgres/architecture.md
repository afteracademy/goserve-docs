# Project Architecture

Understanding the goserve example API architecture and design patterns.

## Overview

The goserve PostgreSQL example demonstrates a complete **production-ready REST API** built with the goserve framework. It follows a **feature-based modular architecture** where each API endpoint is organized into self-contained modules with clear separation of concerns, JWT authentication, role-based authorization, and comprehensive testing.

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




```go
```

## Application Flow

### Startup Sequence

```
main.go (cmd/main.go)
  ↓
startup.Server() - Initialize HTTP server
  ↓
create() - Component initialization
  ├── Load Environment Variables (config.Env)
  │   ├── Database credentials
  │   ├── JWT RSA keys
  │   ├── Redis configuration
  │   └── Server settings
  ├── Connect PostgreSQL (postgres.Database)
  │   ├── Create connection pool
  │   ├── Configure timeouts
  │   └── Health checks
  ├── Connect Redis (redis.Store)
  │   ├── Initialize client
  │   ├── Configure pooling
  │   └── Test connection
  ├── Create Module (startup.Module)
  │   ├── Wire Dependencies
  │   ├── Initialize Services
  │   ├── Create Controllers
  │   └── Setup Middleware
  ↓
router.Start() - Start Gin HTTP server
  ├── Global middleware (CORS, logging, error handling)
  ├── Route mounting (/auth, /user, /blog, etc.)
  └── Server listening on configured port
```

### Complete Request Flow

```
HTTP Request (e.g., POST /blog/author)
  ↓
Root Middleware (Global - applied to all routes)
├── Error Recovery - Catch panics and return 500
├── API Key Validation - For external service calls
├── CORS Headers - Cross-origin resource sharing
├── Request Logging - Structured logging
└── Not Found Handler - 404 for undefined routes
  ↓
Router (Gin Engine)
  ↓
Feature Route Group (/blog)
  ↓
Authentication Middleware (JWT - if route requires auth)
├── Extract Bearer Token - From Authorization header
├── Verify RSA Signature - Using public key
├── Validate Claims - Check expiry, issuer, etc.
├── Load User from Database - Fetch user details
└── Set User Context - Store user in request context
  ↓
Authorization Middleware (Roles - if route requires specific roles)
├── Get User from Context - Retrieve authenticated user
├── Check Required Roles - Compare with route requirements
├── Validate Permissions - Role-based access control
└── Allow/Deny Access - Proceed or return 403
  ↓
Controller Handler (blog.controller.createHandler)
├── Parse Request Body - JSON to DTO with validation
├── Extract Path Parameters - URL parameters (e.g., :id)
├── Extract Query Parameters - Query string parameters
├── Validate Input - Struct field validation
└── Call Service Method - Delegate to business logic
  ↓
Service Layer (Business Logic)
├── Input Validation - Business rule validation
├── Database Operations - CRUD operations with transactions
├── Cache Operations - Redis cache get/set/invalidate
├── External Service Calls - API calls to other services
└── Event Publishing - Send events for system integration
  ↓
Database/External Services
  ↓
Response Formation
├── Success Response (200-299)
│   ├── network.SendSuccessDataResponse()
│   ├── network.SendSuccessMessageResponse()
│   └── Include requested data
├── Client Error Response (400-499)
│   ├── network.SendBadRequestError() - Validation errors
│   ├── network.SendUnauthorizedError() - Auth failures
│   ├── network.SendForbiddenError() - Permission denied
│   └── network.SendNotFoundError() - Resource not found
└── Server Error Response (500-599)
    ├── network.SendInternalServerError() - System errors
    └── network.SendMixedError() - Auto-detect error type
```

## Architectural Principles

### 1. Feature Independence
Each API feature (auth, blog, user) is completely independent:
- Separate database tables and relationships
- Isolated business logic and validation rules
- Independent deployment and scaling capabilities
- Clear API boundaries and contracts

### 2. Service Sharing Architecture
While features are independent, they share common services:
- **Authentication Service** - Shared across all features
- **User Service** - Referenced by blog service for author information
- **Database Connection** - Shared PostgreSQL connection pool
- **Redis Cache** - Shared caching infrastructure

### 3. API Key + JWT Dual Authentication
The system supports two authentication methods:
- **API Keys** - For external services and system integration
- **JWT Tokens** - For user authentication with RSA signing

### 4. Role-Based Authorization
Hierarchical permission system:
- **Admin** - Full system access
- **Author** - Can create and manage own blogs
- **Editor** - Can edit and publish blogs
- **User** - Basic user operations

### 5. Cache-Aside Pattern
Intelligent caching strategy:
- **Read Operations** - Check cache first, fallback to database
- **Write Operations** - Update database, invalidate cache
- **Automatic Expiration** - Time-based cache invalidation

## Layer Responsibilities

### 1. Controllers

**Location**: `api/[feature]/controller.go`

**Purpose**: Handle HTTP requests and responses with authentication/authorization

**Responsibilities**:
- Define route endpoints within feature groups
- Parse and validate requests using DTOs
- Call service methods with proper error handling
- Format responses with consistent structure
- Handle HTTP-specific concerns (headers, status codes)

**Controller Structure**:

```go
type controller struct {
    network.Controller           // Base controller with auth providers
    common.ContextPayload        // User context management
    service Service             // Business logic service
}

func NewController(
    authProvider network.AuthenticationProvider,
    authorizeProvider network.AuthorizationProvider,
    service Service,
) network.Controller {
    return &controller{
        Controller: network.NewController("/blog", authProvider, authorizeProvider),
        service: service,
    }
}
```

**Route Mounting with Middleware**:

```go
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes (no authentication required)
    group.GET("/public", c.getPublicBlogs)

    // Protected routes (authentication required)
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
        // Author routes (author or admin role required)
        author := protected.Group("/author")
        author.Use(c.AuthorizeProvider.RequireRole("author", "admin"))
        {
            author.POST("/", c.createBlog)
            author.GET("/my-blogs", c.getMyBlogs)
            author.PUT("/id/:id", c.updateBlog)
            author.DELETE("/id/:id", c.deleteBlog)
        }

        // Editor routes (editor or admin role required)
        editor := protected.Group("/editor")
        editor.Use(c.AuthorizeProvider.RequireRole("editor", "admin"))
        {
            editor.PUT("/id/:id/publish", c.publishBlog)
            editor.GET("/drafts", c.getDraftBlogs)
        }
    }
}
```

**Request Handler Pattern**:

```go
func (c *controller) createBlog(ctx *gin.Context) {
    // Parse and validate request body
    body, err := network.ReqBody[dto.BlogCreate](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, "Invalid request body", err)
        return
    }

    // Get authenticated user from context
    user := c.GetUser(ctx)
    if user == nil {
        network.SendUnauthorizedError(ctx, "User not authenticated", nil)
        return
    }

    // Call service with user context
    result, err := c.service.CreateBlog(body, user.ID)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Blog created successfully", result)
}

func (c *controller) getBlogByID(ctx *gin.Context) {
    // Parse path parameter
    idStr := ctx.Param("id")
    id, err := uuid.Parse(idStr)
    if err != nil {
        network.SendBadRequestError(ctx, "Invalid blog ID format", err)
        return
    }

    // Parse query parameters
    includeAuthor := ctx.DefaultQuery("includeAuthor", "false") == "true"

    // Call service
    result, err := c.service.GetBlogByID(id, includeAuthor)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Blog retrieved successfully", result)
}
```

### 2. Services

**Location**: `api/[feature]/service.go`

**Purpose**: Implement business logic with database operations and caching

**Responsibilities**:
- Business rule enforcement and validation
- Database CRUD operations with transactions
- Redis caching (cache-aside pattern)
- Data transformation between models and DTOs
- Cross-service communication logic

**Service Interface Pattern**:

```go
type Service interface {
    // Blog CRUD operations
    CreateBlog(dto *dto.BlogCreate, authorID uuid.UUID) (*dto.BlogPrivate, error)
    GetBlogByID(id uuid.UUID, includeAuthor bool) (*dto.BlogPublic, error)
    UpdateBlog(id uuid.UUID, dto *dto.BlogUpdate, userID uuid.UUID) (*dto.BlogPrivate, error)
    DeleteBlog(id uuid.UUID, userID uuid.UUID) error

    // Blog listing with pagination
    GetPublishedBlogs(query *dto.BlogQuery) (*dto.PaginatedBlogs, error)
    GetAuthorBlogs(authorID uuid.UUID, page, limit int) (*dto.PaginatedBlogs, error)

    // Blog management operations
    PublishBlog(id uuid.UUID, userID uuid.UUID) (*dto.BlogPublic, error)
    UpdateBlogSlug(id uuid.UUID, newSlug string, userID uuid.UUID) error
}
```

**Service Implementation with Caching**:

```go
type service struct {
    db         *pgxpool.Pool
    cache      redis.Cache[dto.BlogCache]
    userService user.Service  // Dependency on user service
}

func NewService(db *pgxpool.Pool, store redis.Store, userService user.Service) Service {
    return &service{
        db:          db,
        cache:       redis.NewCache[dto.BlogCache](store),
        userService: userService,
    }
}

func (s *service) GetBlogByID(id uuid.UUID, includeAuthor bool) (*dto.BlogPublic, error) {
    // Try cache first (cache-aside pattern)
    cached, err := s.cache.Get(id.String())
    if err == nil && cached != nil {
        blog := s.convertCacheToDTO(cached)
        if includeAuthor {
            author, err := s.userService.FetchUserById(cached.AuthorID)
            if err == nil {
                blog.Author = &dto.UserInfo{
                    ID:   author.ID,
                    Name: author.Name,
                }
            }
        }
        return blog, nil
    }

    // Cache miss - query database
    blog, err := s.getBlogFromDatabase(id, includeAuthor)
    if err != nil {
        return nil, err
    }

    // Update cache (don't include author info in cache)
    cacheData := s.convertBlogToCache(blog)
    s.cache.Set(id.String(), cacheData, time.Hour)

    return blog, nil
}

func (s *service) CreateBlog(dto *dto.BlogCreate, authorID uuid.UUID) (*dto.BlogPrivate, error) {
    // Business rule validation
    if err := s.validateBlogCreate(dto, authorID); err != nil {
        return nil, err
    }

    // Check slug uniqueness
    if exists, _ := s.blogSlugExists(dto.Slug); exists {
        return nil, network.NewBadRequestError("Blog with this slug already exists", nil)
    }

    // Start transaction
    tx, err := s.db.Begin(context.Background())
    if err != nil {
        return nil, network.NewInternalServerError("Failed to start transaction", err)
    }
    defer tx.Rollback(context.Background())

    // Create blog in database
    blog, err := s.createBlogInTransaction(tx, dto, authorID)
    if err != nil {
        return nil, err
    }

    // Commit transaction
    if err = tx.Commit(context.Background()); err != nil {
        return nil, network.NewInternalServerError("Failed to commit transaction", err)
    }

    return blog, nil
}

func (s *service) PublishBlog(id uuid.UUID, userID uuid.UUID) (*dto.BlogPublic, error) {
    // Check permissions (author or editor/admin)
    user, err := s.userService.FetchUserById(userID)
    if err != nil {
        return nil, network.NewUnauthorizedError("User not found", err)
    }

    if !s.canPublishBlog(user) {
        return nil, network.NewForbiddenError("Insufficient permissions to publish blog", nil)
    }

    // Update blog status
    blog, err := s.updateBlogStatus(id, true, userID)
    if err != nil {
        return nil, err
    }

    // Invalidate cache
    s.cache.Delete(id.String())

    // Publish event for system integration
    // s.publishBlogPublishedEvent(blog)

    return s.convertToPublicDTO(blog), nil
}
```

**Business Logic Validation**:

```go
func (s *service) validateBlogCreate(dto *dto.BlogCreate, authorID uuid.UUID) error {
    // Check author permissions
    user, err := s.userService.FetchUserById(authorID)
    if err != nil {
        return network.NewUnauthorizedError("Author not found", err)
    }

    if user.Role != "author" && user.Role != "admin" {
        return network.NewForbiddenError("Only authors can create blogs", nil)
    }

    // Validate slug format
    if !s.isValidSlug(dto.Slug) {
        return network.NewBadRequestError("Invalid slug format", nil)
    }

    // Check tag limits
    if len(dto.Tags) > 10 {
        return network.NewBadRequestError("Too many tags (max 10)", nil)
    }

    return nil
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
