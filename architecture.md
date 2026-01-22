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
├── api/                   # Feature-based API modules
│   ├── auth/              # Authentication endpoints
│   │   ├── dto/           # Request/Response DTOs
│   │   ├── model/         # Database models
│   │   └── middleware/    # Auth middleware
│   │   ├── controller.go  # HTTP handlers
│   │   └── service.go     # Business logic
│   └── user/              # User
│   │   ├── dto/
│   │   ├── model/
│   │   ├── controller.go
│   │   └── service.go
│   └── blog/              # Blog feature
│       ├── dto/
│       ├── model/
│       ├── controller.go
│       └── service.go
├── cmd/                   # Application entry points
│   └── main.go            # Main application
├── common/                # Shared utilities
├── config/                 # Configuration management
├── startup/               # Server initialization
│   ├── server.go          # HTTP server setup
│   ├── module.go          # Dependency injection
│   └── testserver.go      # Test server utilities
├── utils/                 # Utility functions
└── keys/                  # RSA keys for JWT
└── docker-compose.yml     # Docker orchestration
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
    common.ContextPayload
    service Service
}

func NewController(
	authProvider network.AuthenticationProvider,
	authorizeProvider network.AuthorizationProvider,
	service Service,
) network.Controller {
	return &controller{
		Controller: network.NewController("/auth", authProvider, authorizeProvider),
		ContextPayload: common.NewContextPayload(),
		service:        service,
	}
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
	group.DELETE("/signout", c.Authentication(), c.signOutBasic)
}

func (c *controller) signOutBasic(ctx *gin.Context) {
	keystore := c.MustGetKeystore(ctx)

	err := c.service.SignOut(keystore)
	if err != nil {
		network.SendInternalServerError(ctx, "something went wrong", err)
		return
	}

	network.SendSuccessMsgResponse(ctx, "signout success")
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
type authenticationProvider struct {
	common.ContextPayload
	authService auth.Service
	userService user.Service
}

func NewAuthenticationProvider(
	authService auth.Service,
	userService user.Service,
) network.AuthenticationProvider {
	return &authenticationProvider{
		ContextPayload: common.NewContextPayload(),
		authService:    authService,
		userService:    userService,
	}
}
// Authentication middleware extracts and validates JWT
func (m *authenticationProvider) Middleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader(network.AuthorizationHeader)
		if len(authHeader) == 0 {
			network.SendUnauthorizedError(ctx, "permission denied: missing Authorization", nil)
			return
		}

		token := utils.ExtractBearerToken(authHeader)
		if token == "" {
			network.SendUnauthorizedError(ctx, "permission denied: invalid Authorization", nil)
			return
		}

		claims, err := m.authService.VerifyToken(token)
		if err != nil {
			network.SendUnauthorizedError(ctx, err.Error(), err)
			return
		}

		valid := m.authService.ValidateClaims(claims)
		if !valid {
			network.SendUnauthorizedError(ctx, "permission denied: invalid claims", nil)
			return
		}

		userId, err := uuid.Parse(claims.Subject)
		if err != nil {
			network.SendUnauthorizedError(ctx, "permission denied: invalid claims subject", nil)
			return
		}

		user, err := m.userService.FetchUserById(userId)
		if err != nil {
			network.SendUnauthorizedError(ctx, "permission denied: claims subject does not exists", err)
			return
		}

		keystore, err := m.authService.FetchKeystore(user, claims.ID)
		if err != nil || keystore == nil {
			network.SendUnauthorizedError(ctx, "permission denied: invalid access token", err)
			return
		}

		m.SetUser(ctx, user)
		m.SetKeystore(ctx, keystore)

		ctx.Next()
	}
}
```

### API Key Authentication Pattern

For service-to-service communication and external API access:

**Key Components**:

- Extensible middleware system

**Request Flow**:

```
Client Request → Middleware Chain → Controller → Service → Database
```

### Role-Based Authorization Pattern

Implements hierarchical permission system:

```go
// Authorization middleware checks user roles
type authorizationProvider struct {
	common.ContextPayload
}

func NewAuthorizationProvider() network.AuthorizationProvider {
	return &authorizationProvider{
		ContextPayload: common.NewContextPayload(),
	}
}

func (m *authorizationProvider) Middleware(roleNames ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if len(roleNames) == 0 {
			network.SendForbiddenError(ctx, "permission denied: role missing", nil)
			return
		}

		user := m.MustGetUser(ctx)

		hasRole := false
		for _, code := range roleNames {
			for _, role := range user.Roles {
				if role.Code == model.RoleCode(code) {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			network.SendForbiddenError(ctx, "permission denied: does not have sufficient role", nil)
			return
		}

		ctx.Next()
	}
}
```

### Cache-Aside Pattern

Implements intelligent caching with database fallbacks:

```go
type Service interface {
	SetBlogDtoCacheById(blog *dto.BlogPublic) error
	GetBlogDtoCacheById(id uuid.UUID) (*dto.BlogPublic, error)
	// Other service methods...
}

type service struct {
	db              postgres.Database
	publicBlogCache redis.Cache[dto.BlogPublic]
	// Other dependencies...
}

func NewService(db postgres.Database, store redis.Store, userService user.Service) Service {
	return &service{
		db:              db,
		publicBlogCache: redis.NewCache[dto.BlogPublic](store),
		// Initialize other dependencies...
	}
}

func (s *service) SetBlogDtoCacheById(blog *dto.BlogPublic) error {
	key := "blog_" + blog.ID.String()
	return s.publicBlogCache.SetJSON(key, blog, time.Duration(10*time.Minute))
}

func (s *service) GetBlogDtoCacheById(id uuid.UUID) (*dto.BlogPublic, error) {
	key := "blog_" + id.String()
	return s.publicBlogCache.GetJSON(key)
}
```

## Request Flow

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
	mockAuthProvider := new(network.MockAuthenticationProvider)
	mockAuthProvider.On("Middleware").Return(gin.HandlerFunc(func(ctx *gin.Context) {
		ctx.Next()
	}))

	mockAuthzProvider := new(network.MockAuthorizationProvider)
	mockAuthzProvider.On("Middleware", "ROLE").Return(gin.HandlerFunc(func(ctx *gin.Context) {
		ctx.Next()
	}))

	body := `{"email":"test@abc.com","password":"123456","name":"test name"}`

	singUpDto := &dto.SignUpBasic{
		Email:    "test@abc.com",
		Password: "123456",
		Name:     "test name",
	}

	authDto := &dto.UserAuth{
		User: &userDto.UserPrivate{
			Name:  "test name",
			Email: "test@abc.com",
			ID:    uuid.New(),
			Roles: []*userDto.RoleInfo{
				{
					ID:   uuid.New(),
					Code: model.RoleCodeLearner,
				},
			},
			ProfilePicURL: nil,
		},
		Tokens: &dto.Tokens{
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
		},
	}

	authService := new(MockService)
	authService.On("SignUpBasic", singUpDto).Return(authDto, nil)

	c := NewController(mockAuthProvider, mockAuthzProvider, authService)

	rr := network.MockTestController(t, "POST", "/auth/signup/basic", body, c)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"message":"success"`)
}

```

### Integration Tests

```go
func TestIntegrationAuthController_SignupSuccess(t *testing.T) {
	router, module, shutdown := startup.TestServer()
	var role *roleModel.Role
	var apikey *model.ApiKey
	defer shutdown()

	t.Cleanup(func() {
		if apikey != nil {
			module.GetInstance().AuthService.DeleteApiKey(apikey)
		}
	})

	t.Cleanup(func() {
		if role != nil {
			module.GetInstance().UserService.DeleteRole(role)
		}
	})

	t.Cleanup(func() {
		module.GetInstance().UserService.RemoveUserByEmail("test@abc.com")
	})

	key, err := utility.GenerateRandomString(6)
	if err != nil {
		t.Fatalf("could not create key: %v", err)
	}

	apikey, err = module.GetInstance().AuthService.CreateApiKey(key, 1, []model.Permission{"test"}, []string{"comment"})
	if err != nil {
		t.Fatalf("could not create apikey: %v", err)
	}

	role, err = module.GetInstance().UserService.CreateRole(roleModel.RoleCodeLearner)
	if err != nil {
		t.Fatalf("could not create role: %v", err)
	}

	body := `{"email":"test@abc.com","password":"123456","name":"test name"}`

	req, err := http.NewRequest("POST", "/auth/signup/basic", bytes.NewBuffer([]byte(body)))
	if err != nil {
		t.Fatalf("could not create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Add(network.ApiKeyHeader, apikey.Key)

	rr := httptest.NewRecorder()
	router.GetEngine().ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"message":"success"`)
	assert.Contains(t, rr.Body.String(), `"data"`)
	assert.Contains(t, rr.Body.String(), `"user"`)
	assert.Contains(t, rr.Body.String(), `"roles"`)
	assert.Contains(t, rr.Body.String(), `"tokens"`)
}

```

## Next Steps

- Learn about [Core Concepts](/core-concepts) for detailed implementation patterns
- See [Configuration](/configuration) for environment setup
- Check the [PostgreSQL Example](/postgres/) for a complete implementation
