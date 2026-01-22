# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve framework and this example application.

## Table of Contents

- [Controllers](#controllers)
- [Services](#services)
- [Models](#models)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Middleware](#middleware)
- [Dependency Injection](#dependency-injection)
- [Caching Strategy](#caching-strategy)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Error Handling](#error-handling)

---

## Controllers

Controllers are responsible for handling HTTP requests and responses. They define API endpoints, validate input, and delegate business logic to services.

### Controller Structure

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
        Controller: network.NewController("/blog", authProvider, authorizeProvider),
        ContextPayload: common.NewContextPayload(),
        service: service,
    }
}
```

### Key Responsibilities

1. **Route Definition**: Define HTTP endpoints in `MountRoutes()`
2. **Request Parsing**: Extract and validate request body, params, and query strings
3. **Response Formation**: Send appropriate HTTP responses
4. **Middleware Application**: Apply authentication and authorization

### Example: Blog Author Controller

```go
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Apply authentication and authorization middleware
    group.Use(c.Authentication(), c.Authorization(string(userModel.RoleCodeAuthor)))
    
    group.POST("/", c.postBlogHandler)
    group.PUT("/", c.updateBlogHandler)
    group.GET("/id/:id", c.getBlogHandler)
    group.DELETE("/id/:id", c.deleteBlogHandler)
    group.PUT("/submit/id/:id", c.submitBlogHandler)
    group.PUT("/withdraw/id/:id", c.withdrawBlogHandler)
    group.GET("/drafts", c.getDraftsBlogsHandler)
    group.GET("/submitted", c.getSubmittedBlogsHandler)
    group.GET("/published", c.getPublishedBlogsHandler)
}

func (c *controller) postBlogHandler(ctx *gin.Context) {
    // 1. Parse request body
    body, err := network.ReqBody[dto.BlogCreate](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, err.Error(), err)
        return
    }

    // 2. Get authenticated user from context
    user := c.MustGetUser(ctx)

    // 3. Call service layer
    blog, err := c.service.CreateBlog(body, user)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    // 4. Send success response
    network.SendSuccessDataResponse(ctx, "blog created successfully", &blog)
}
```

### Request Parsing Helpers

**Parsing Request Body**:
```go
body, err := network.ReqBody[dto.SignUpBasic](ctx)
```

**Parsing URL Parameters**:
```go
uuidParam, err := network.ReqParams[coredto.UUID](ctx)
// Access: uuidParam.ID
```

**Parsing Query String**:
```go
pagination, err := network.ReqQuery[coredto.Pagination](ctx)
// Access: pagination.Page, pagination.Limit
```

### Response Helpers

```go
// Success with data
network.SendSuccessDataResponse(ctx, "success", data)

// Success with message only
network.SendSuccessMsgResponse(ctx, "operation completed")

// Error responses
network.SendBadRequestError(ctx, "invalid input", err)
network.SendNotFoundError(ctx, "resource not found", err)
network.SendUnauthorizedError(ctx, "permission denied", err)
network.SendForbiddenError(ctx, "access forbidden", err)
network.SendInternalServerError(ctx, "server error", err)

// Mixed error (automatically determines error type)
network.SendMixedError(ctx, err)
```

---

## Services

Services contain the business logic and data access layer. They process data, interact with databases, handle caching, and enforce business rules.

### Service Structure

```go
type Service interface {
    CreateBlog(dto *dto.BlogCreate, author *userModel.User) (*dto.BlogPrivate, error)
    UpdateBlog(dto *dto.BlogUpdate, author *userModel.User) (*dto.BlogPrivate, error)
    GetBlogById(id uuid.UUID, author *userModel.User) (*dto.BlogPrivate, error)
    // ... more methods
}

type service struct {
    db          *pgxpool.Pool
    blogService blog.Service
}

func NewService(db *pgxpool.Pool, blogService blog.Service) Service {
    return &service{
        db:          db,
        blogService: blogService,
    }
}
```

### Key Responsibilities

1. **Business Logic**: Implement domain-specific operations
2. **Data Access**: Query and manipulate database records
3. **Validation**: Enforce business rules and constraints
4. **Service Coordination**: Call other services when needed
5. **Caching**: Manage cache operations for performance

### Example: User Service

```go
func (s *service) CreateUser(
    email string, password string, name string, 
    profilePicURL *string, roles []*model.Role,
) (*model.User, error) {
    ctx := context.Background()
    
    // Start transaction
    tx, err := s.db.Begin(ctx)
    if err != nil {
        return nil, err
    }
    defer tx.Rollback(ctx)
    
    // Insert user
    var user model.User
    query := `
        INSERT INTO users (email, password, name, profile_pic_url, verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, password, name, profile_pic_url, 
                  verified, status, created_at, updated_at
    `
    
    err = tx.QueryRow(ctx, query, email, password, name, profilePicURL, false).
        Scan(&user.ID, &user.Email, &user.Password, &user.Name, 
             &user.ProfilePicURL, &user.Verified, &user.Status, 
             &user.CreatedAt, &user.UpdatedAt)
    
    if err != nil {
        return nil, err
    }
    
    // Assign roles
    for _, role := range roles {
        _, err = tx.Exec(ctx, 
            "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
            user.ID, role.ID)
        if err != nil {
            return nil, err
        }
    }
    
    // Commit transaction
    if err := tx.Commit(ctx); err != nil {
        return nil, err
    }
    
    user.Roles = roles
    return &user, nil
}
```

### Database Query Patterns

**Simple Query**:
```go
query := `SELECT id, name, email FROM users WHERE id = $1`
var user model.User
err := s.db.QueryRow(ctx, query, userId).Scan(&user.ID, &user.Name, &user.Email)
```

**Query Multiple Rows**:
```go
rows, err := s.db.Query(ctx, query, param1, param2)
if err != nil {
    return nil, err
}
defer rows.Close()

var items []Item
for rows.Next() {
    var item Item
    if err := rows.Scan(&item.ID, &item.Name); err != nil {
        return nil, err
    }
    items = append(items, item)
}

if err := rows.Err(); err != nil {
    return nil, err
}
```

**Execute Statement**:
```go
tag, err := s.db.Exec(ctx, query, param1, param2)
if err != nil {
    return err
}
rowsAffected := tag.RowsAffected()
```

---

## Models

Models represent database table structures and define the schema for data storage.

### Model Definition

```go
package model

import (
    "time"
    "github.com/google/uuid"
)

const BlogsTableName = "blogs"

type Blog struct {
    ID          uuid.UUID  // id
    Title       string     // title
    Description string     // description
    Text        *string    // text (nullable)
    DraftText   string     // draft_text
    Tags        []string   // tags
    AuthorID    uuid.UUID  // author_id
    ImgURL      *string    // img_url (nullable)
    Slug        string     // slug
    Score       float64    // score
    Views       int64      // views
    Likes       int64      // likes
    Comments    int64      // comments
    Flagged     bool       // flagged
    Submitted   bool       // submitted
    Drafted     bool       // drafted
    Published   bool       // published
    Status      bool       // status
    PublishedAt *time.Time // published_at (nullable)
    CreatedAt   time.Time  // created_at
    UpdatedAt   time.Time  // updated_at
}
```

### Field Naming Convention

- **Go Field Names**: PascalCase (e.g., `AuthorID`, `CreatedAt`)
- **Database Column Names**: snake_case (e.g., `author_id`, `created_at`)
- **Comments**: Indicate the actual database column name

### Nullable Fields

Use pointers for nullable fields:
```go
Text        *string    // Can be NULL in database
ImgURL      *string    // Optional field
PublishedAt *time.Time // NULL until published
```

---

## DTOs (Data Transfer Objects)

DTOs define the structure for request and response payloads. They provide validation and type safety for API communication.

### Request DTOs

```go
package dto

type SignUpBasic struct {
    Name          string  `json:"name" binding:"required" validate:"required,min=3"`
    Email         string  `json:"email" binding:"required" validate:"required,email"`
    Password      string  `json:"password" binding:"required" validate:"required,min=6"`
    ProfilePicUrl *string `json:"profilePicUrl,omitempty" validate:"omitempty,url"`
}

type BlogCreate struct {
    Title       string   `json:"title" binding:"required" validate:"required,min=3,max=500"`
    Description string   `json:"description" binding:"required" validate:"required,min=3,max=2000"`
    DraftText   string   `json:"draftText" binding:"required" validate:"required"`
    ImgURL      *string  `json:"imgUrl,omitempty" validate:"omitempty,uri,max=200"`
    Tags        []string `json:"tags" binding:"required" validate:"required,dive,uppercase"`
    Slug        string   `json:"slug" binding:"required" validate:"required,min=3,max=200"`
}
```

### Response DTOs

```go
type UserPrivate struct {
    ID            uuid.UUID   `json:"id" binding:"required" validate:"required"`
    Email         string      `json:"email" binding:"required" validate:"required,email"`
    Name          string      `json:"name" binding:"required" validate:"required"`
    ProfilePicURL *string     `json:"profilePicUrl,omitempty" validate:"omitempty,url"`
    Roles         []*RoleInfo `json:"roles" validate:"required,dive,required"`
}

func NewUserPrivate(user *model.User) *UserPrivate {
    var roles []*RoleInfo
    for _, role := range user.Roles {
        roles = append(roles, NewRoleInfo(role))
    }
    
    return &UserPrivate{
        ID:            user.ID,
        Email:         user.Email,
        Name:          user.Name,
        ProfilePicURL: user.ProfilePicURL,
        Roles:         roles,
    }
}
```

### Validation Tags

- **`binding:"required"`**: Field is required in request
- **`validate:"required"`**: Validation rule
- **`validate:"min=3,max=500"`**: Length constraints
- **`validate:"email"`**: Email format validation
- **`validate:"url"`**: URL format validation
- **`validate:"dive"`**: Validate array/slice elements
- **`validate:"uppercase"`**: Must be uppercase
- **`json:"fieldName,omitempty"`**: Omit from JSON if empty

---

## Middleware

Middleware functions process requests before they reach handlers. They handle cross-cutting concerns like authentication, authorization, logging, and error handling.

### Global Middleware

Global middleware is applied to all routes:

```go
func (m *module) RootMiddlewares() []network.RootMiddleware {
    return []network.RootMiddleware{
        coreMW.NewErrorCatcher(),      // Error recovery (MUST BE FIRST)
        authMW.NewKeyProtection(m.AuthService), // API key validation
        coreMW.NewNotFound(),          // 404 handler
    }
}
```

### Route-Specific Middleware

Applied to specific routes or route groups:

```go
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes (no auth)
    group.POST("/signup", c.signUpHandler)
    
    // Protected routes (authentication required)
    private := group.Use(c.Authentication())
    private.GET("/profile", c.getProfileHandler)
    
    // Role-protected routes
    group.Use(
        c.Authentication(), 
        c.Authorization(string(userModel.RoleCodeAuthor)),
    )
    group.POST("/blog", c.createBlogHandler)
}
```

### API Key Protection

All requests must include a valid API key:

```go
type keyProtection struct {
    common.ContextPayload
    authService auth.Service
}

func (m *keyProtection) Handler(ctx *gin.Context) {
    key := ctx.GetHeader(network.ApiKeyHeader)
    if len(key) == 0 {
        network.SendUnauthorizedError(ctx, "missing x-api-key header", nil)
        return
    }
    
    apikey, err := m.authService.FetchApiKey(key)
    if err != nil {
        network.SendForbiddenError(ctx, "invalid x-api-key", err)
        return
    }
    
    m.SetApiKey(ctx, apikey)
    ctx.Next()
}
```

---

## Dependency Injection

The application uses a module pattern for dependency injection, centralizing service initialization and wiring.

### Module Structure

```go
type module struct {
    Context     context.Context
    Env         *config.Env
    DB          postgres.Database
    Store       redis.Store
    UserService user.Service
    AuthService auth.Service
    BlogService blog.Service
}

func NewModule(
    context context.Context, 
    env *config.Env, 
    db postgres.Database, 
    store redis.Store,
) Module {
    // Initialize services with dependencies
    userService := user.NewService(db.Pool())
    authService := auth.NewService(db.Pool(), env, userService)
    blogService := blog.NewService(db.Pool(), store, userService)
    
    return &module{
        Context:     context,
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
        author.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), 
            author.NewService(m.DB.Pool(), m.BlogService)),
        editor.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), 
            editor.NewService(m.DB.Pool(), m.UserService)),
        blogs.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), 
            blogs.NewService(m.DB.Pool(), m.Store)),
        contact.NewController(m.AuthenticationProvider(), m.AuthorizationProvider(), 
            contact.NewService(m.DB.Pool())),
    }
}
```

### Benefits

1. **Centralized Configuration**: All dependencies initialized in one place
2. **Testability**: Easy to mock dependencies for testing
3. **Maintainability**: Clear dependency relationships
4. **Type Safety**: Compile-time checking of dependencies

---

## Caching Strategy

The application uses Redis for caching frequently accessed data to improve performance.

### Cache Implementation

```go
type service struct {
    db              *pgxpool.Pool
    publicBlogCache redis.Cache[dto.BlogPublic]
    userService     user.Service
}

func NewService(db *pgxpool.Pool, store redis.Store, userService user.Service) Service {
    return &service{
        db:              db,
        publicBlogCache: redis.NewCache[dto.BlogPublic](store),
        userService:     userService,
    }
}
```

### Cache Operations

**Set Cache**:
```go
func (s *service) SetBlogDtoCacheById(blog *dto.BlogPublic) error {
    key := "blog_" + blog.ID.String()
    return s.publicBlogCache.SetJSON(key, blog, 10*time.Minute)
}
```

**Get Cache**:
```go
func (s *service) GetBlogDtoCacheById(id uuid.UUID) (*dto.BlogPublic, error) {
    key := "blog_" + id.String()
    return s.publicBlogCache.GetJSON(key)
}
```

**Cache-Aside Pattern**:
```go
func (c *controller) getBlogByIdHandler(ctx *gin.Context) {
    uuidParam, err := network.ReqParams[coredto.UUID](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, err.Error(), err)
        return
    }
    
    // Try cache first
    blog, err := c.service.GetBlogDtoCacheById(uuidParam.ID)
    if err == nil {
        network.SendSuccessDataResponse(ctx, "success", blog)
        return
    }
    
    // Cache miss - fetch from database
    blog, err = c.service.GetPublisedBlogById(uuidParam.ID)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }
    
    // Update cache
    network.SendSuccessDataResponse(ctx, "success", blog)
    c.service.SetBlogDtoCacheById(blog)
}
```

### Cache Key Naming Convention

- **By ID**: `blog_{uuid}`
- **By Slug**: `blog_{slug}`
- **List Data**: `similar_blogs_{uuid}`
- Use consistent prefixes for related data

---

## Authentication

The application uses JWT (JSON Web Tokens) with RSA signing for stateless authentication.

### Token Structure

**Access Token**: Short-lived (default: 1 hour)
```go
accessTokenClaims := jwt.RegisteredClaims{
    Issuer:    "goserve-api",
    Subject:   user.ID.String(),
    Audience:  []string{"goserve-client"},
    IssuedAt:  jwt.NewNumericDate(time.Now()),
    NotBefore: jwt.NewNumericDate(time.Now()),
    ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
    ID:        primaryKey,  // Random 32-char string
}
```

**Refresh Token**: Long-lived (default: 10 days)
```go
refreshTokenClaims := jwt.RegisteredClaims{
    Issuer:    "goserve-api",
    Subject:   user.ID.String(),
    Audience:  []string{"goserve-client"},
    IssuedAt:  jwt.NewNumericDate(time.Now()),
    NotBefore: jwt.NewNumericDate(time.Now()),
    ExpiresAt: jwt.NewNumericDate(time.Now().Add(240 * time.Hour)),
    ID:        secondaryKey,  // Random 32-char string
}
```

### Keystore Concept

Each token pair is tracked in a `keystore` table:
- **Primary Key**: Stored in Access Token ID claim
- **Secondary Key**: Stored in Refresh Token ID claim
- **Purpose**: Enables token invalidation (logout, refresh)

```go
type Keystore struct {
    ID           uuid.UUID
    UserID       uuid.UUID
    PrimaryKey   string  // From access token
    SecondaryKey string  // From refresh token
    Status       bool
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

### Authentication Flow

1. **User Signs Up/In**: Generate token pair + keystore entry
2. **Request with Token**: Middleware verifies token + keystore existence
3. **Token Refresh**: Verify both tokens, delete old keystore, create new pair
4. **Sign Out**: Delete keystore entry (invalidates tokens)

### Authentication Middleware

```go
func (m *authenticationProvider) Middleware() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        // 1. Extract token from Authorization header
        authHeader := ctx.GetHeader(network.AuthorizationHeader)
        token := utils.ExtractBearerToken(authHeader)
        
        // 2. Verify and decode token
        claims, err := m.authService.VerifyToken(token)
        if err != nil {
            network.SendUnauthorizedError(ctx, err.Error(), err)
            return
        }
        
        // 3. Validate claims
        valid := m.authService.ValidateClaims(claims)
        if !valid {
            network.SendUnauthorizedError(ctx, "invalid claims", nil)
            return
        }
        
        // 4. Fetch user
        userId, _ := uuid.Parse(claims.Subject)
        user, err := m.userService.FetchUserById(userId)
        if err != nil {
            network.SendUnauthorizedError(ctx, "user not found", err)
            return
        }
        
        // 5. Verify keystore
        keystore, err := m.authService.FetchKeystore(user, claims.ID)
        if err != nil || keystore == nil {
            network.SendUnauthorizedError(ctx, "invalid token", err)
            return
        }
        
        // 6. Set user and keystore in context
        m.SetUser(ctx, user)
        m.SetKeystore(ctx, keystore)
        
        ctx.Next()
    }
}
```

### Using Authentication

```go
// In controller
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Apply authentication middleware
    group.Use(c.Authentication())
    group.GET("/profile", c.getProfileHandler)
}

func (c *controller) getProfileHandler(ctx *gin.Context) {
    // Access authenticated user
    user := c.MustGetUser(ctx)
    // ... use user.ID, user.Email, etc.
}
```

---

## Authorization

Authorization uses role-based access control (RBAC) to restrict access to specific endpoints.

### Roles

```go
const (
    RoleCodeLearner RoleCode = "LEARNER"  // Default user role
    RoleCodeAdmin   RoleCode = "ADMIN"    // Admin role
    RoleCodeAuthor  RoleCode = "AUTHOR"   // Can create/edit blogs
    RoleCodeEditor  RoleCode = "EDITOR"   // Can publish blogs
)
```

### Authorization Middleware

```go
func (m *authorizationProvider) Middleware(roleNames ...string) gin.HandlerFunc {
    return func(ctx *gin.Context) {
        if len(roleNames) == 0 {
            network.SendForbiddenError(ctx, "role missing", nil)
            return
        }
        
        user := m.MustGetUser(ctx)
        
        // Check if user has any of the required roles
        hasRole := false
        for _, requiredRole := range roleNames {
            for _, userRole := range user.Roles {
                if userRole.Code == model.RoleCode(requiredRole) {
                    hasRole = true
                    break
                }
            }
            if hasRole {
                break
            }
        }
        
        if !hasRole {
            network.SendForbiddenError(ctx, "insufficient role", nil)
            return
        }
        
        ctx.Next()
    }
}
```

### Using Authorization

```go
func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Require AUTHOR role
    group.Use(
        c.Authentication(), 
        c.Authorization(string(userModel.RoleCodeAuthor)),
    )
    group.POST("/blog", c.createBlogHandler)
    
    // Require EDITOR role
    editorGroup := group.Group("/editor")
    editorGroup.Use(
        c.Authentication(),
        c.Authorization(string(userModel.RoleCodeEditor)),
    )
    editorGroup.PUT("/publish/:id", c.publishHandler)
}
```

---

## Error Handling

The application uses custom error types with automatic HTTP status code mapping.

### Error Types

```go
// goserve framework provides these error constructors:
network.NewBadRequestError("message", err)       // 400
network.NewUnauthorizedError("message", err)     // 401
network.NewForbiddenError("message", err)        // 403
network.NewNotFoundError("message", err)         // 404
network.NewInternalServerError("message", err)   // 500
```

### Mixed Error Handler

Automatically determines the appropriate HTTP status:

```go
func (c *controller) updateBlogHandler(ctx *gin.Context) {
    // ... parse request
    
    blog, err := c.service.UpdateBlog(body, user)
    if err != nil {
        // Automatically maps error type to HTTP status
        network.SendMixedError(ctx, err)
        return
    }
    
    network.SendSuccessDataResponse(ctx, "success", blog)
}
```

### Error Catcher Middleware

Global error recovery to prevent crashes:

```go
func NewErrorCatcher() network.RootMiddleware {
    return &errorCatcher{}
}

func (m *errorCatcher) Handler(ctx *gin.Context) {
    defer func() {
        if err := recover(); err != nil {
            log.Printf("Panic recovered: %v", err)
            network.SendInternalServerError(ctx, "internal server error", nil)
        }
    }()
    ctx.Next()
}
```

### Error Response Format

```json
{
  "statusCode": "BadRequestError",
  "message": "Blog with slug: example-slug already exists",
  "error": {
    "details": "..."
  }
}
```

---

## Next Steps

- See [Architecture](/postgres/architecture) for detailed project structure
- Check [Configuration](/postgres/configuration) for environment setup
- Review [API Reference](/postgres/api-reference) for endpoint documentation