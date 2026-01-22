# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve framework.

## Table of Contents

- [Controllers](#controllers)
- [Services](#services)
- [Models](#models)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Middleware](#middleware)
- [JWT Authentication](#jwt-authentication)
- [Role-Based Authorization](#role-based-authorization)
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
        Controller: network.NewController("/api", authProvider, authorizeProvider),
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    group.POST("/", c.createHandler)
    group.GET("/id/:id", c.getHandler)
    group.PUT("/id/:id", c.updateHandler)
    group.DELETE("/id/:id", c.deleteHandler)
}
```

### Controller Handler Pattern

```go
func (c *controller) createHandler(ctx *gin.Context) {
    // Parse and validate request body
    body, err := network.ReqBody[dto.CreateRequest](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, err.Error(), err)
        return
    }

    // Call service method
    result, err := c.service.Create(body)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    // Send success response
    network.SendSuccessDataResponse(ctx, "success", result)
}
```

### Key Responsibilities

1. **Route Definition** - Define HTTP endpoints within feature groups
2. **Request Parsing** - Extract and validate request data using DTOs
3. **Service Orchestration** - Call appropriate service methods
4. **Response Formatting** - Format responses with consistent structure
5. **Error Handling** - Use structured error responses

---

## Services

Services contain business logic and coordinate between controllers and repositories.

### Service Pattern

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

func NewService(db *pgxpool.Pool, store redis.Store) Service {
    return &service{
        db:    db,
        cache: redis.NewCache[dto.EntityCache](store),
    }
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
    err = s.db.QueryRow(context.Background(), query, id).Scan(&entity)
    if err != nil {
        return nil, err
    }

    // Update cache
    s.cache.Set(id.String(), &entity, time.Hour)
    return &entity, nil
}
```

### Service Responsibilities

- **Business Logic**: Implement domain rules and validation
- **Data Access**: Coordinate database operations
- **Caching**: Manage cache invalidation and updates
- **Transactions**: Handle database transactions
- **External Services**: Integrate with third-party APIs
- **Event Publishing**: Send events for system integration

---

## Models

Models represent your database schema and internal domain entities:

### Database Models

```go
type Blog struct {
    ID          uuid.UUID   // id - Primary key
    Title       string      // title - Blog title
    Description string      // description - Blog description
    Text        *string     // text - Published content (nullable)
    DraftText   string      // draft_text - Draft content
    Tags        []string    // tags - JSON array of tags
    AuthorID    uuid.UUID   // author_id - Foreign key to users
    Slug        string      // slug - URL-friendly identifier
    Status      bool        // status - Active/inactive
    Published   bool        // published - Publication status
    PublishedAt *time.Time  // published_at - Publication timestamp
    CreatedAt   time.Time   // created_at - Creation timestamp
    UpdatedAt   time.Time   // updated_at - Last update timestamp
}

type User struct {
    ID        uuid.UUID  // id - Primary key
    Email     string     // email - Unique email address
    Password  string     // password - Hashed password
    Name      string     // name - Display name
    Role      string     // role - User role (admin, author, editor)
    Verified  bool       // verified - Email verification status
    CreatedAt time.Time  // created_at - Creation timestamp
    UpdatedAt time.Time  // updated_at - Last update timestamp
}
```

### Model Usage in Services

```go
func (s *service) createBlog(dto *dto.BlogCreate, authorID uuid.UUID) (*model.Blog, error) {
    now := time.Now()
    blog := &model.Blog{
        ID:          uuid.New(),
        Title:       dto.Title,
        Description: dto.Description,
        DraftText:   dto.DraftText,
        Tags:        dto.Tags,
        AuthorID:    authorID,
        Slug:        dto.Slug,
        Status:      true,
        Published:   false,
        CreatedAt:   now,
        UpdatedAt:   now,
    }

    // Insert into database
    err := s.db.QueryRow(context.Background(), `
        INSERT INTO blogs (id, title, description, draft_text, tags, author_id, slug, status, published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
    `, blog.ID, blog.Title, blog.Description, blog.DraftText, blog.Tags,
       blog.AuthorID, blog.Slug, blog.Status, blog.Published, blog.CreatedAt, blog.UpdatedAt).Scan(&blog.ID)

    return blog, err
}
```

### Model Relationships

```go
// Models with relationships
type BlogWithAuthor struct {
    Blog  *model.Blog  `json:"blog"`
    Author *model.User `json:"author"`
}

// Service method with joins
func (s *service) getBlogWithAuthor(id uuid.UUID) (*BlogWithAuthor, error) {
    var result BlogWithAuthor
    result.Blog = &model.Blog{}
    result.Author = &model.User{}

    query := `
        SELECT
            b.id, b.title, b.description, b.text, b.tags, b.slug,
            b.published, b.published_at, b.created_at, b.updated_at,
            u.id, u.name, u.email
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.id = $1 AND b.status = true
    `

    err := s.db.QueryRow(context.Background(), query, id).Scan(
        &result.Blog.ID, &result.Blog.Title, &result.Blog.Description,
        &result.Blog.Text, &result.Blog.Tags, &result.Blog.Slug,
        &result.Blog.Published, &result.Blog.PublishedAt,
        &result.Blog.CreatedAt, &result.Blog.UpdatedAt,
        &result.Author.ID, &result.Author.Name, &result.Author.Email,
    )

    return &result, err
}
```

---

## Repositories

Repositories abstract data access and provide a clean interface for database operations.

### Repository Pattern

goserve services directly use database connections rather than separate repositories, promoting simpler architecture:

```go
type service struct {
    db *pgxpool.Pool
}

func (s *service) findEntityByID(ctx context.Context, id uuid.UUID) (*model.Entity, error) {
    var entity model.Entity
    query := `
        SELECT id, name, description, created_at, updated_at
        FROM entities
        WHERE id = $1 AND deleted_at IS NULL
    `

    err := s.db.QueryRow(ctx, query, id).Scan(
        &entity.ID, &entity.Name, &entity.Description,
        &entity.CreatedAt, &entity.UpdatedAt,
    )

    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, network.NewNotFoundError("Entity not found", err)
        }
        return nil, network.NewInternalServerError("Database error", err)
    }

    return &entity, nil
}

func (s *service) createEntity(ctx context.Context, entity *model.Entity) (*model.Entity, error) {
    query := `
        INSERT INTO entities (name, description, created_at, updated_at)
        VALUES ($1, $2, $3, $3)
        RETURNING id
    `

    now := time.Now()
    err := s.db.QueryRow(ctx, query,
        entity.Name, entity.Description, now,
    ).Scan(&entity.ID)

    if err != nil {
        return nil, network.NewInternalServerError("Failed to create entity", err)
    }

    entity.CreatedAt = now
    entity.UpdatedAt = now
    return entity, nil
}
```

### Benefits

- **Direct Data Access**: Services handle data operations directly
- **Transaction Control**: Services manage transaction boundaries
- **Error Handling**: Consistent error types and handling
- **Performance**: Optimized queries with proper indexing
- **Type Safety**: Strong typing with UUID and proper Go types

---

## DTOs (Data Transfer Objects)

DTOs define the structure of data transferred between layers.

### Request DTOs

goserve uses specific naming conventions for DTOs:

```go
// Create operations
type BlogCreate struct {
    Title       string   `json:"title" validate:"required,min=3,max=500"`
    Description string   `json:"description" validate:"required,min=3,max=2000"`
    DraftText   string   `json:"draftText" validate:"required,max=50000"`
    Slug        string   `json:"slug" validate:"required,min=3,max=200"`
    ImgURL      string   `json:"imgUrl" validate:"required,uri,max=200"`
    Tags        []string `json:"tags" validate:"required,min=1,dive,uppercase"`
}

// Update operations
type BlogUpdate struct {
    Title       *string  `json:"title,omitempty" validate:"omitempty,min=3,max=500"`
    Description *string  `json:"description,omitempty" validate:"omitempty,min=3,max=2000"`
    DraftText   *string  `json:"draftText,omitempty" validate:"omitempty,max=50000"`
    Slug        *string  `json:"slug,omitempty" validate:"omitempty,min=3,max=200"`
    Tags        []string `json:"tags,omitempty" validate:"omitempty,min=1,dive,uppercase"`
}

// Query parameters
type BlogQuery struct {
    Page    int    `form:"page" validate:"omitempty,min=1"`
    Limit   int    `form:"limit" validate:"omitempty,min=1,max=100"`
    Status  string `form:"status" validate:"omitempty,oneof=draft published"`
    Author  string `form:"author" validate:"omitempty,uuid"`
    Tag     string `form:"tag" validate:"omitempty,max=50"`
}
```

### Response DTOs

```go
// Public API responses (hide sensitive data)
type BlogPublic struct {
    ID          uuid.UUID  `json:"id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Slug        string     `json:"slug"`
    ImgURL      string     `json:"imgUrl"`
    Tags        []string   `json:"tags"`
    Author      *UserInfo  `json:"author"`
    PublishedAt time.Time  `json:"publishedAt"`
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
}

// Private API responses (include all data)
type BlogPrivate struct {
    ID          uuid.UUID  `json:"id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Text        *string    `json:"text"`
    DraftText   string     `json:"draftText"`
    Slug        string     `json:"slug"`
    ImgURL      string     `json:"imgUrl"`
    Tags        []string   `json:"tags"`
    AuthorID    uuid.UUID  `json:"authorId"`
    Status      bool       `json:"status"`
    Published   bool       `json:"published"`
    PublishedAt *time.Time `json:"publishedAt"`
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
}

// Paginated responses
type PaginatedBlogs struct {
    Data       []BlogPublic `json:"data"`
    Pagination Pagination   `json:"pagination"`
}

type Pagination struct {
    Page     int `json:"page"`
    Limit    int `json:"limit"`
    Total    int `json:"total"`
    TotalPages int `json:"totalPages"`
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

### JWT Authentication Middleware

goserve implements RSA-based JWT authentication:

```go
type authenticationProvider struct {
    common.ContextPayload
    authService auth.Service
    userService user.Service
}

func (m *authenticationProvider) Middleware() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        // Extract token from Authorization header
        token := utils.ExtractBearerToken(ctx.GetHeader("Authorization"))
        if token == "" {
            network.SendUnauthorizedError(ctx, "Missing authorization token", nil)
            return
        }

        // Verify JWT token with RSA public key
        claims, err := m.authService.VerifyToken(token)
        if err != nil {
            network.SendUnauthorizedError(ctx, err.Error(), err)
            return
        }

        // Load user from database
        user, err := m.userService.FetchUserById(claims.Subject)
        if err != nil {
            network.SendUnauthorizedError(ctx, "User not found", err)
            return
        }

        // Set user in context
        m.SetUser(ctx, user)
        ctx.Next()
    }
}
```

### Role-Based Authorization Middleware

```go
type authorizationProvider struct {
    common.ContextPayload
}

func (m *authorizationProvider) RequireRole(requiredRoles ...string) gin.HandlerFunc {
    return func(ctx *gin.Context) {
        user := m.GetUser(ctx)
        if user == nil {
            network.SendUnauthorizedError(ctx, "User not authenticated", nil)
            return
        }

        // Check if user has required role
        hasRole := false
        for _, requiredRole := range requiredRoles {
            if user.Role == requiredRole {
                hasRole = true
                break
            }
        }

        if !hasRole {
            network.SendForbiddenError(ctx, "Insufficient permissions", nil)
            return
        }

        ctx.Next()
    }
}
```

### API Key Authentication (for external services)

```go
func (m *authenticationProvider) APIKeyMiddleware() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        apiKey := ctx.GetHeader("X-API-Key")
        if apiKey == "" {
            network.SendUnauthorizedError(ctx, "Missing API key", nil)
            return
        }

        // Validate API key (could call auth service)
        if !m.isValidAPIKey(apiKey) {
            network.SendUnauthorizedError(ctx, "Invalid API key", nil)
            return
        }

        ctx.Next()
    }
}
```

### Using Middleware in Controllers

```go
func NewController(
    authProvider network.AuthenticationProvider,
    authorizeProvider network.AuthorizationProvider,
    service Service,
) network.Controller {
    return &controller{
        Controller: network.NewController("/api/blog", authProvider, authorizeProvider),
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes (no auth required)
    group.GET("/public", c.getPublicBlogs)

    // Protected routes (auth required)
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
        protected.POST("/", c.createBlog)  // Auth required

        // Role-based routes
        author := protected.Group("/author")
        author.Use(c.AuthorizeProvider.RequireRole("author", "admin"))
        {
            author.POST("/", c.createBlog)
            author.PUT("/id/:id", c.updateBlog)
        }

        editor := protected.Group("/editor")
        editor.Use(c.AuthorizeProvider.RequireRole("editor", "admin"))
        {
            editor.PUT("/id/:id/publish", c.publishBlog)
        }
    }
}
```

### Built-in Middleware Features

- **JWT Authentication**: RSA-signed tokens with user context
- **Role Authorization**: Hierarchical permission system
- **API Key Support**: Service-to-service authentication
- **CORS**: Configurable cross-origin settings
- **Logging**: Structured request/response logging
- **Rate Limiting**: Configurable request throttling

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

goserve provides structured error types for consistent API responses:

```go
// Client Errors (400-499)
network.SendBadRequestError(ctx, "Invalid input data", validationErr)
network.SendUnauthorizedError(ctx, "Authentication required", nil)
network.SendForbiddenError(ctx, "Insufficient permissions", nil)
network.SendNotFoundError(ctx, "Resource not found", nil)
network.SendConflictError(ctx, "Resource already exists", nil)

// Server Errors (500-599)
network.SendInternalServerError(ctx, "Database connection failed", dbErr)

// Mixed Error (auto-detects error type)
network.SendMixedError(ctx, serviceErr)
```

### Service Layer Error Creation

```go
func (s *service) CreateBlog(dto *dto.BlogCreate) (*model.Blog, error) {
    // Validate slug uniqueness
    existing, err := s.getBlogBySlug(dto.Slug)
    if err == nil && existing != nil {
        return nil, network.NewBadRequestError("Blog with this slug already exists", nil)
    }

    // Check authorization
    user := s.getCurrentUser()
    if user.Role != "author" && user.Role != "admin" {
        return nil, network.NewForbiddenError("Only authors can create blogs", nil)
    }

    // Database operation
    blog, err := s.createBlogInDB(dto, user.ID)
    if err != nil {
        return nil, network.NewInternalServerError("Failed to create blog", err)
    }

    return blog, nil
}
```

### Error Response Format

All errors follow a consistent JSON structure:

```json
// Client Error Response
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "reason": "must be a valid email address"
  },
  "timestamp": "2024-01-23T10:30:00Z"
}

// Server Error Response (production)
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-23T10:30:00Z"
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

### PostgreSQL with Connection Pooling

goserve uses pgx for PostgreSQL with advanced connection pooling:

```go
import "github.com/afteracademy/goserve/postgres"

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

db := postgres.NewDatabase(context.Background(), dbConfig)
db.Connect()
defer db.Close()
```

### Optimized Query Patterns

```go
// Single row queries
var blog model.Blog
err := db.QueryRow(ctx, `
    SELECT id, title, description, author_id, created_at
    FROM blogs WHERE id = $1
`, id).Scan(&blog.ID, &blog.Title, &blog.Description, &blog.AuthorID, &blog.CreatedAt)

// Multiple rows with iteration
rows, err := db.Query(ctx, `
    SELECT id, title, slug FROM blogs
    WHERE published = true ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
`, limit, offset)
defer rows.Close()

for rows.Next() {
    var blog dto.BlogSummary
    rows.Scan(&blog.ID, &blog.Title, &blog.Slug)
    blogs = append(blogs, blog)
}

// Insert with RETURNING
err := db.QueryRow(ctx, `
    INSERT INTO blogs (title, description, author_id, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at
`, title, description, authorID, time.Now()).Scan(&blog.ID, &blog.CreatedAt)

// Transactions
tx, err := db.Begin(ctx)
if err != nil {
    return err
}
defer tx.Rollback(ctx)

// Multiple operations in transaction
_, err = tx.Exec(ctx, "UPDATE blogs SET status = $1 WHERE id = $2", status, id)
if err != nil {
    return err
}

_, err = tx.Exec(ctx, "INSERT INTO audit_log (action, blog_id) VALUES ($1, $2)", "publish", id)
if err != nil {
    return err
}

return tx.Commit(ctx)
```

---

## Caching

Redis caching for improved performance.

### Redis Caching with Generic Types

goserve provides type-safe Redis caching:

```go
import "github.com/afteracademy/goserve/redis"

// Initialize typed cache
type BlogCache struct {
    ID          uuid.UUID  `json:"id"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Slug        string     `json:"slug"`
    AuthorName  string     `json:"authorName"`
    Tags        []string   `json:"tags"`
    PublishedAt time.Time  `json:"publishedAt"`
}

type service struct {
    db    *pgxpool.Pool
    cache redis.Cache[BlogCache]
}

func NewService(db *pgxpool.Pool, store redis.Store) Service {
    return &service{
        db:    db,
        cache: redis.NewCache[BlogCache](store),
    }
}
```

### Cache-Aside Pattern Implementation

```go
func (s *service) GetBlogByID(id uuid.UUID) (*dto.BlogPublic, error) {
    // Try cache first
    cached, err := s.cache.Get(id.String())
    if err == nil && cached != nil {
        // Cache hit - convert to DTO
        return s.convertCacheToDTO(cached), nil
    }

    // Cache miss - query database
    blog, err := s.getBlogFromDB(id)
    if err != nil {
        return nil, err
    }

    // Update cache
    cacheData := s.convertBlogToCache(blog)
    s.cache.Set(id.String(), cacheData, time.Hour)

    return blog, nil
}

func (s *service) UpdateBlog(id uuid.UUID, dto *dto.BlogUpdate) (*dto.BlogPublic, error) {
    // Update database
    blog, err := s.updateBlogInDB(id, dto)
    if err != nil {
        return nil, err
    }

    // Invalidate cache
    s.cache.Delete(id.String())

    // Update cache with new data
    cacheData := s.convertBlogToCache(blog)
    s.cache.Set(id.String(), cacheData, time.Hour)

    return blog, nil
}
```

### Cache Key Patterns

```go
// Structured cache keys
const (
    BlogCachePrefix    = "blog:"
    UserCachePrefix    = "user:"
    BlogListPrefix     = "blog:list:"
)

// Cache key generation
blogKey := fmt.Sprintf("%s%s", BlogCachePrefix, blogID)
userKey := fmt.Sprintf("%s%s", UserCachePrefix, userID)
blogListKey := fmt.Sprintf("%sauthor:%s:page:%d", BlogListPrefix, authorID, page)

// Bulk operations
func (s *service) invalidateUserBlogs(userID uuid.UUID) error {
    // Find all blog IDs for user
    blogIDs, err := s.getUserBlogIDs(userID)
    if err != nil {
        return err
    }

    // Delete cache entries
    keys := make([]string, len(blogIDs))
    for i, id := range blogIDs {
        keys[i] = fmt.Sprintf("%s%s", BlogCachePrefix, id)
    }

    return s.cache.DeleteMultiple(keys...)
}
```

### Cache Configuration

```go
// Environment-based cache TTL
blogCacheTTL := time.Duration(env.BlogCacheTTLMinutes) * time.Minute
userCacheTTL := time.Duration(env.UserCacheTTLMinutes) * time.Minute

// Cache with custom TTL
s.cache.Set(blogKey, blogData, blogCacheTTL)
```

### Cache Patterns Supported

- **Cache-Aside**: Load from cache, fallback to DB
- **Write-Through**: Update DB and cache simultaneously
- **Write-Behind**: Update DB, invalidate cache (simpler)
- **Time-Based Expiration**: Automatic cache invalidation
- **Manual Invalidation**: Explicit cache clearing on updates

---

## Best Practices

### Architecture Principles

1. **Feature-Based Organization** - Group related functionality by business features, not technical layers
2. **Controller-Service-Model-DTO Pattern** - Maintain clear separation of concerns across layers
3. **Dependency Injection** - Use module system for clean component wiring and testability
4. **Interface-Based Design** - Define service interfaces for easy mocking and testing

### Controller Best Practices

1. **Keep Controllers Thin** - Controllers should only handle HTTP concerns (parsing, validation, response formatting)
2. **Use DTOs for Requests/Responses** - Never expose internal models directly to clients
3. **Consistent Error Handling** - Use goserve's structured error responses
4. **Route Organization** - Group routes by authentication and authorization requirements

### Service Best Practices

1. **Business Logic Only** - Services should contain domain logic, not infrastructure concerns
2. **Transaction Management** - Handle database transactions at the service level
3. **Cache Integration** - Implement cache-aside pattern for performance
4. **Error Propagation** - Use appropriate error types for different failure scenarios

### Database Best Practices

1. **Connection Pooling** - Always use connection pools for database access
2. **Prepared Statements** - Use parameterized queries to prevent SQL injection
3. **Indexing Strategy** - Design indexes based on query patterns
4. **Transaction Boundaries** - Keep transactions short and focused

### Security Best Practices

1. **JWT with RSA** - Use RSA key pairs for JWT signing (not symmetric keys)
2. **Password Hashing** - Always hash passwords with strong algorithms (bcrypt)
3. **Input Validation** - Validate all inputs at multiple layers
4. **API Key Management** - Use API keys for service-to-service communication

### Caching Best Practices

1. **Cache-Aside Pattern** - Load from cache, fallback to database
2. **Appropriate TTL** - Set cache expiration based on data volatility
3. **Cache Invalidation** - Invalidate cache on data updates
4. **Cache Key Strategy** - Use structured, predictable cache keys

### Testing Best Practices

1. **Unit Tests** - Test services and utilities with mocks
2. **Integration Tests** - Test complete request/response cycles
3. **Test Data Management** - Use fixtures and cleanup for reliable tests
4. **Coverage Goals** - Aim for high coverage on business logic

### Performance Best Practices

1. **Database Optimization** - Use proper indexing and query optimization
2. **Caching Strategy** - Cache frequently accessed data
3. **Connection Pooling** - Configure appropriate pool sizes
4. **Async Processing** - Use background jobs for non-critical operations

## Next Steps

- See [Framework Architecture](/architecture) for overall structure
- Check [Configuration](/configuration) for setup details
- Review the [PostgreSQL Example](/postgres/) for complete examples
