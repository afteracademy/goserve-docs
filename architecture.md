# Framework Architecture

Understanding the goserve framework architecture and design patterns.

## Overview

goserve is built on a **feature-based architecture** that promotes clean code, separation of concerns, and testability. The framework emphasizes each API being independent while sharing common services, reducing code conflicts in team environments.

It provides recipe for building scalable RESTful APIs with built-in support to integrate for authentication, authorization, caching, and database interactions.

## Core Principles

1. **Feature Independence** - Each API feature is organized in separate directories by endpoint
2. **Service Sharing** - Common services can be shared across features while maintaining independence
3. **Layered Architecture** - Clear separation between Controllers, Services, Models, and DTOs
4. **Testability** - Architecture supports easy unit and integration testing
5. **Scalable Architecture** - Modular design supports scaling and extension
6. **Authentication & Authorization** - Built-in patterns for JWT and API key auth

## Framework Code Organization

```
.
├── dto                      # Data Transfer Objects (input/output structs)
│   ├── mongoid.go           # Mongo ID helper for DTOs
│   ├── pagination.go        # Pagination DTO fields
│   ├── slug.go              # Slug generation DTO helper
│   └── uuid.go              # UUID handling
│
├── micro                    # Microservice-oriented code
│   ├── controller.go        # Microcontroller logic base
│   ├── interfaces.go        # Interfaces for micro handlers
│   ├── message.go           # Microservice message types
│   ├── nats.go              # NATS integration helpers
│   ├── request.go           # Microrequest helpers
│   ├── router.go            # Router setup for microservices
│   └── sender.go            # Client code to send micro messages
│
├── middleware               # Request/response middleware
│   ├── errorcatcher.go      # Panic/recover middleware
│   └── notfound.go          # “404 not found” handler
│
├── mongo                    # Mongo database helpers
│   ├── builder.go           # Query builder utilities
│   ├── database.go          # DB connection & pooling
│   ├── query.go             # Generic query helpers
│   └── validation.go        # Mongo validation logic
│
├── postgres                 # Postgres database helpers (if used)
│   └── database.go          # Postgres DB connection logic
│
├── network                  # HTTP API layer utilities
│   ├── apierror.go          # Standard API error structs
│   ├── controller.go        # HTTP controller base
│   ├── header.go            # Header helpers
│   ├── interfaces.go        # HTTP interfaces (controllers, services)
│   ├── parsers.go           # Request parsing helpers
│   ├── request.go           # HTTP request helpers
│   ├── response.go          # HTTP response helpers
│   ├── router.go            # Route registration
│   ├── sender.go            # HTTP client helpers
│   └── validation.go        # HTTP request validation
│
├── redis                   # Redis caching helpers
│   ├── cache.go            # High-level cache API
│   └── store.go            # Redis connection & operations
│
└── utility                 # Generic helpers
    ├── format.go           # Data formatting utilities
    ├── mapper.go           # Struct mapping helpers
    └── random.go           # Random value helpers
```

## Layered Architecture Pattern

goserve follows a **4-layer architecture** pattern that separates concerns while maintaining clean dependencies:

### 1. Controller Layer (Network Layer)

Handles HTTP requests and responses, acts as the entry point:

**Location**: `api/[feature]/controller.go`

**Responsibilities**:

- Route definition and mounting
- Request parsing and validation
- Authentication and authorization checks
- Calling service layer methods
- Response formatting
- HTTP-specific logic handling
- Error response formatting

**Key Pattern**:

```go
type controller struct {
    network.Controller
		// Other dependencies...
}

func NewController(
	authProvider network.AuthenticationProvider,
	authorizeProvider network.AuthorizationProvider,
	// Other dependencies...
) network.Controller {
	return &controller{
		Controller: network.NewController("/auth", authProvider, authorizeProvider),
		// Initialize other dependencies...
	}
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
	group.DELETE("/signout", c.Authentication(), c.signOutBasic)
}

func (c *controller) signOutBasic(ctx *gin.Context) {
	// Parse request
	// Call service method
	// Format response
}
```

### 2. Service Layer (Business Logic)

Contains business logic and database interactions:

**Location**: `api/[feature]/service.go`

**Responsibilities**:

- Business rule enforcement
- Data transformation and validation
- Database operations coordination
- Cache management
- External service integration

**Key Pattern**:

```go
type Service interface {
	CreateBlog(d *dto.CreateBlog) (*model.Blog, error)
		// Other service methods...
}

type service struct {
    db postgres.Database,
    cache redis.Cache[dto.BlogPublic],
}

func NewService(db postgres.Database) Service {
	return &service{
		db: db,
	}
}

func (s *service) CreateBlog(dto *dto.CreateBlog) (*dto.BlogPublic, error) {
    // Business logic validation
    // Database operations
    // Cache invalidation
    // Return result
}
```

### 3. Model Layer (Data Entities)

Defines database schema and internal data structures:

**Location**: `api/[feature]/model/[record].go`

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

## Recommended Framework Implementation

Recommended implementation patterns for building APIs with goserve for a production-ready architecture.

### Complete Request Lifecycle

```
HTTP Request
    ↓
Root Middleware (Global)
├── Error Catcher
├── API Key Authentication
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
Controller Handler
    ↓
Response Formatting
├── Success (200-299)
├── Client Error (400-499)
└── Server Error (500-599)
```

### Middleware Chain Details

**Authentication Middleware** (protected routes):

- JWT token extraction and validation
- User context loading

**Authorization Middleware** (role-protected routes):

- Permission checking
- Role validation
- Access control

## Feature-Based Organization

goserve organizes code by **business features** rather than technical layers, making it easier for teams to work independently:

### Feature Organization Principles

**Independent Features**: Each feature is self-contained with its own directory:

```
api/auth/     # Complete auth feature
api/blog/     # Blog management feature
```

**Shared Resources**: Related features can share models and DTOs:

```
api/blog/
├── dto/       # Shared between author/editor features
├── model/     # Shared database models
└── service.go # Shared business logic
```

**Clear Boundaries**: Features communicate through well-defined interfaces, not direct dependencies.

## Dependency Injection & Module System

goserve uses a **module-based dependency injection** system that wires all components together:

### Module Pattern

The `module` interface enables clean dependency injection:

```go
type Module interface {
    GetInstance() *module
    Controllers() []network.Controller
    RootMiddlewares() []network.RootMiddleware
    AuthenticationProvider() network.AuthenticationProvider
    AuthorizationProvider() network.AuthorizationProvider
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
