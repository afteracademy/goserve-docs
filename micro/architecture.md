# Project Architecture

Understanding the gomicro microservices architecture and design patterns.

## Overview

gomicro demonstrates a complete microservices implementation using the goserve micro framework. The project breaks down a monolithic blog application into independent services that communicate via NATS messaging, orchestrated through Kong API gateway.

### Why this stack
- Gateway-first: Kong + custom plugin handles API keys, routing, and rate limiting.
- Event-ready: NATS patterns shown alongside REST for cross-service workflows.
- Polyglot data: Postgres for auth, Mongo for blogs, illustrating per-service storage choices.

### Core Principles

1. **Service Independence** - Each service runs independently with its own database and cache
2. **API Gateway** - Centralized request routing and authentication through Kong
3. **Event-Driven Communication** - NATS messaging for inter-service communication
4. **Database per Service** - Independent data storage choices (PostgreSQL + MongoDB)
5. **Service Discovery** - Automatic service registration and discovery

## System Architecture

### Without Load Balancing

![System architecture without load balancing](/images/system.png)

### With Load Balancing

![System architecture with load balancing](/images/system-load-balanced.png)

## Deployment Configurations

### Kong API Gateway

**Purpose**: Centralized API management and routing

**Components**:
- **Custom Go Plugin**: API key authentication
- **Request Routing**: Routes to appropriate services
- **Rate Limiting**: Prevents abuse
- **Load Balancing**: Distributes requests across service instances

**Configuration**:
```yaml
# kong/kong.yml
services:
  - name: auth-service
    url: http://auth:8001
    plugins:
      - name: apikey-auth
    routes:
      - paths: ["/auth"]
        methods: ["POST", "GET"]

  - name: blog-service
    url: http://blog:8002
    plugins:
      - name: apikey-auth
    routes:
      - paths: ["/blog"]
        methods: ["GET", "POST", "PUT", "DELETE"]
```

### Auth Service

**Technology Stack**:
- **Framework**: goserve micro
- **Database**: PostgreSQL
- **Cache**: Redis
- **Communication**: NATS

**Responsibilities**:
- User authentication (signup/signin)
- JWT token validation
- Role-based authorization
- API key management
- User profile management

**Database Schema**:
```sql
-- PostgreSQL tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'LEARNER',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  key_hash VARCHAR UNIQUE NOT NULL,
  service_name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Blog Service

**Technology Stack**:
- **Framework**: goserve micro
- **Database**: MongoDB
- **Cache**: Redis
- **Communication**: NATS

**Responsibilities**:
- Blog CRUD operations
- Author/editor workflows
- Content publishing
- Comment management
- Tag management

**Database Schema**:
```javascript
// MongoDB collections
db.blogs.insertOne({
  _id: ObjectId(),
  title: "Blog Title",
  description: "Blog description",
  content: "Full blog content",
  slug: "blog-slug",
  authorId: ObjectId(),
  tags: ["tech", "golang"],
  status: "published",
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Communication Patterns

### API Gateway Flow

```
Client Request
    ↓
Kong Gateway (Port 8000)
    ↓ Custom Plugin
    ↓ Calls: auth-service:8000/verify/apikey
    ↓ Validates API key
    ↓ Routes to target service
Target Service Response
    ↓
Kong Gateway
    ↓
Client Response
```

### Inter-Service Communication

#### Synchronous Communication (Request-Reply)

```go
// Blog service requests user validation from auth service
func (s *blogService) validateUserRole(userID string, requiredRole string) (bool, error) {
    request := &message.ValidateRoleRequest{
        UserID: userID,
        Role: requiredRole,
    }

    response, err := micro.RequestNats[message.ValidateRoleRequest, message.ValidateRoleResponse](
        s.natsClient,
        "auth.validate.role",
        request,
    )

    return response.Valid, err
}
```

#### Event-Driven Communication

```go
// Auth service publishes user created event
func (s *authService) createUser(user *model.User) error {
    // Save to database
    err := s.saveUser(user)
    if err != nil {
        return err
    }

    // Publish event
    event := &message.UserCreatedEvent{
        UserID: user.ID,
        Email: user.Email,
        Name: user.Name,
    }

    return s.natsClient.Publish("user.created", event)
}

// Blog service subscribes to user events
func (s *blogService) handleUserCreated(msg *nats.Msg) {
    var event message.UserCreatedEvent
    json.Unmarshal(msg.Data, &event)

    // Update blog author information
    s.updateAuthorInfo(event.UserID, event.Name)
}
```

## Service Implementation

### Controller Pattern

```go
package blog

import (
    "github.com/gin-gonic/gin"
    "github.com/afteracademy/goserve/v2/micro"
    "github.com/afteracademy/goserve/v2/network"
)

type controller struct {
    micro.Controller
    service Service
}

func NewController(authProvider, authorizeProvider network.AuthenticationProvider, service Service) micro.Controller {
    return &controller{
        Controller: micro.NewController("/blog", authProvider, authorizeProvider),
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes
    group.GET("/", c.getBlogs)
    group.GET("/id/:id", c.getBlogByID)

    // Protected routes
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
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

func (c *controller) MountNats(group micro.NatsGroup) {
    group.AddEndpoint("validate.user", micro.NatsHandlerFunc(c.validateUserHandler))
}
```

### Service Pattern

```go
package blog

import (
    "github.com/afteracademy/gomicro/blog_service/api/blog/message"
    "github.com/afteracademy/goserve/v2/micro"
    "github.com/afteracademy/goserve/v2/mongo"
    "github.com/afteracademy/goserve/v2/redis"
)

type Service interface {
    CreateBlog(dto *dto.BlogCreate, authorID string) (*model.Blog, error)
    GetBlogByID(id string) (*model.Blog, error)
    ValidateUserRole(userID, role string) (bool, error)
}

type service struct {
    natsClient micro.NatsClient
    blogQueryBuilder mongo.QueryBuilder[model.Blog]
    blogCache redis.Cache[dto.BlogCache]
}

func NewService(db mongo.Database, store redis.Store, natsClient micro.NatsClient) Service {
    return &service{
        natsClient: natsClient,
        blogQueryBuilder: mongo.NewQueryBuilder[model.Blog](db, "blogs"),
        blogCache: redis.NewCache[dto.BlogCache](store),
    }
}

func (s *service) ValidateUserRole(userID, role string) (bool, error) {
    request := &message.ValidateRoleRequest{
        UserID: userID,
        Role: role,
    }

    response, err := micro.RequestNats[message.ValidateRoleRequest, message.ValidateRoleResponse](
        s.natsClient,
        "auth.validate.role",
        request,
    )

    return response.Valid, err
}
```

## Data Management

### Database per Service

**Auth Service (PostgreSQL)**:
- Structured data with relationships
- ACID transactions for consistency
- Complex queries with JOINs
- Foreign key constraints

**Blog Service (MongoDB)**:
- Flexible document structure
- Fast reads/writes
- JSON-like queries
- Horizontal scaling capabilities

### Caching Strategy

**Redis Integration**:
```go
// Cache blog data
func (s *service) getCachedBlog(id string) (*dto.BlogResponse, error) {
    return s.blogCache.Get(id)
}

func (s *service) setCachedBlog(id string, blog *dto.BlogResponse) error {
    return s.blogCache.Set(id, blog, time.Hour)
}

// Cache invalidation
func (s *service) invalidateBlogCache(id string) error {
    return s.blogCache.Delete(id)
}
```

## Deployment Patterns

### Standard Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  kong:
    image: kong:3.0
    ports:
      - "8000:8000"
    volumes:
      - ./kong:/kong

  auth-service:
    build: ./auth_service
    environment:
      - SERVICE_PORT=8001
      - DB_HOST=postgres
    depends_on:
      - postgres
      - redis
      - nats

  blog-service:
    build: ./blog_service
    environment:
      - SERVICE_PORT=8002
      - DB_HOST=mongo
    depends_on:
      - mongo
      - redis
      - nats
      - kong
```

### Load Balanced Deployment

```yaml
# Multiple instances with load balancing
services:
  auth-service:
    build: ./auth_service
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 256M
          cpus: '0.5'

  blog-service:
    build: ./blog_service
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

## Monitoring and Observability

### Health Checks

Each service provides health endpoints:

```go
func (s *server) healthCheck(c *gin.Context) {
    // Check database connectivity
    if err := s.db.Ping(); err != nil {
        c.JSON(500, gin.H{"status": "unhealthy", "database": "down"})
        return
    }

    // Check NATS connectivity
    if err := s.natsClient.Status(); err != nil {
        c.JSON(500, gin.H{"status": "unhealthy", "nats": "down"})
        return
    }

    c.JSON(200, gin.H{"status": "healthy"})
}
```

### Logging

Structured logging across services:

```go
logger.WithFields(logrus.Fields{
    "service": "blog-service",
    "user_id": userID,
    "blog_id": blogID,
    "action": "publish",
}).Info("Blog published successfully")
```

## Testing Strategy

### Unit Tests

```go
func TestBlogService_CreateBlog(t *testing.T) {
    mockDB := mongo.NewMockDatabase()
    mockStore := redis.NewMockStore()
    mockNats := micro.NewMockNatsClient()

    service := blog.NewService(mockDB, mockStore, mockNats)

    blog, err := service.CreateBlog(&dto.BlogCreate{
        Title: "Test Blog",
        Content: "Test content",
    }, "user123")

    assert.NoError(t, err)
    assert.NotNil(t, blog)
    assert.Equal(t, "Test Blog", blog.Title)
}
```

### Integration Tests

```go
func TestMicroservices_Integration(t *testing.T) {
    // Start all services
    authRouter := setupAuthService()
    blogRouter := setupBlogService()

    // Test complete flow
    token := createTestUser(t, authRouter)
    blog := createTestBlog(t, blogRouter, token)

    assert.NotNil(t, blog)
    assert.Equal(t, "published", blog.Status)
}
```

## Security Architecture

### API Key Authentication

Kong plugin validates API keys before routing:

```go
func (p *Plugin) Access(kong *pdk.PDK) {
    apiKey := kong.Request.GetHeader("x-api-key")
    if apiKey == "" {
        kong.Response.Exit(401, "API key required", nil)
        return
    }

    // Validate with auth service
    valid, err := p.validateAPIKey(apiKey)
    if err != nil || !valid {
        kong.Response.Exit(401, "Invalid API key", nil)
        return
    }
}
```

### JWT Token Validation

Services validate JWT tokens via NATS:

```go
func (s *authService) validateToken(tokenString string) (*Claims, error) {
    // Verify RSA signature
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return s.publicKey, nil
    })

    if err != nil {
        return nil, err
    }

    return token.Claims.(*Claims), nil
}
```

## Performance Considerations

### Caching Strategy

- **Application Cache**: Redis for frequently accessed data
- **Database Cache**: MongoDB built-in caching
- **API Cache**: Kong caching for static responses

### Database Optimization

- **Indexing**: Proper indexes on query fields
- **Connection Pooling**: Optimized pool sizes
- **Read/Write Separation**: Potential for read replicas

### Service Scaling

- **Horizontal Scaling**: Multiple service instances
- **Load Balancing**: Kong distributes requests
- **Circuit Breakers**: Prevent cascade failures

## Migration Strategy

### From Monolith to Microservices

1. **Identify Boundaries**: Separate concerns into services
2. **Extract Auth Service**: Independent authentication
3. **Extract Blog Service**: Content management
4. **Implement Communication**: NATS messaging
5. **Add API Gateway**: Kong for routing
6. **Database Migration**: Separate databases
7. **Testing**: Comprehensive integration tests

## Next Steps

- Understand [Core Concepts](/micro/core-concepts) in depth
- Learn about [Configuration](/micro/configuration) options
- Explore [API Reference](/micro/api-reference) for complete documentation