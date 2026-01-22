# Core Concepts

This guide covers the fundamental concepts and patterns used in the gomicro microservices framework.

## Table of Contents

- [Micro Framework](#micro-framework)
- [NATS Communication](#nats-communication)
- [Kong API Gateway](#kong-api-gateway)
- [Service Architecture](#service-architecture)
- [Database Patterns](#database-patterns)
- [Authentication & Authorization](#authentication--authorization)

---

## Micro Framework

gomicro extends goserve with microservices capabilities using the `micro` package.

### Controller Pattern

```go
package blog

import (
    "github.com/gin-gonic/gin"
    "github.com/afteracademy/goserve/v2/micro"
    "github.com/afteracademy/goserve/v2/network"
)

type controller struct {
    micro.Controller  // Extends base controller
    service Service
}

func NewController(authProvider, authorizeProvider network.AuthenticationProvider, service Service) micro.Controller {
    return &controller{
        Controller: micro.NewController("/blog", authProvider, authorizeProvider),
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // HTTP routes for external clients
    group.GET("/blogs", c.getBlogs)
    group.POST("/blogs", c.AuthProvider.Middleware(), c.createBlog)
}

func (c *controller) MountNats(group micro.NatsGroup) {
    // NATS endpoints for inter-service communication
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
    ValidateUser(userID, token string) (*model.User, error)
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
```

---

## NATS Communication

NATS enables event-driven communication between microservices.

### Message Types

```go
package message

// Request-Reply pattern
type ValidateRoleRequest struct {
    UserID string `json:"userId"`
    Role   string `json:"role"`
}

type ValidateRoleResponse struct {
    Valid bool   `json:"valid"`
    Error string `json:"error,omitempty"`
}

// Event-driven pattern
type UserCreatedEvent struct {
    UserID string `json:"userId"`
    Email  string `json:"email"`
    Name   string `json:"name"`
    Role   string `json:"role"`
}
```

### Synchronous Communication

```go
func (s *blogService) validateUserRole(userID, requiredRole string) (bool, error) {
    request := &message.ValidateRoleRequest{
        UserID: userID,
        Role: requiredRole,
    }

    response, err := micro.RequestNats[message.ValidateRoleRequest, message.ValidateRoleResponse](
        s.natsClient,
        "auth.validate.role",
        request,
    )

    if err != nil {
        return false, err
    }

    return response.Valid, nil
}
```

### Event Publishing

```go
func (s *authService) publishUserCreated(user *model.User) error {
    event := &message.UserCreatedEvent{
        UserID: user.ID,
        Email: user.Email,
        Name: user.Name,
        Role: user.Role,
    }

    return s.natsClient.Publish("user.created", event)
}

func (s *blogService) handleUserCreated(msg *nats.Msg) {
    var event message.UserCreatedEvent
    json.Unmarshal(msg.Data, &event)

    // Update author information in blog service
    s.updateAuthorCache(event.UserID, event.Name)
}
```

### NATS Client Setup

```go
natsConfig := micro.Config{
    NatsUrl:            env.NATS_URL,
    NatsServiceName:    env.SERVICE_NAME,
    NatsServiceVersion: "1.0.0",
    Timeout:            time.Second * 30,
}

natsClient := micro.NewNatsClient(&natsConfig)
```

---

## Kong API Gateway

Kong provides centralized API management and routing.

### Kong Configuration

```yaml
# kong/kong.yml
services:
  - name: auth-service
    url: http://auth:8001
    plugins:
      - name: apikey-auth  # Custom Go plugin
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

### Custom Kong Plugin

```go
package main

import (
    "github.com/Kong/go-pdk/server"
    "github.com/afteracademy/gomicro/kong/apikey-auth"
)

func main() {
    server.StartServer(apikeyauth.New, "0.1", 1000)
}

// Plugin implementation
func (conf *Config) Access(kong *pdk.PDK) {
    apiKey := kong.Request.GetHeader("x-api-key")
    if apiKey == "" {
        kong.Response.Exit(401, "API key required", nil)
        return
    }

    // Call auth service to validate API key
    valid, err := validateAPIKey(apiKey)
    if err != nil || !valid {
        kong.Response.Exit(401, "Invalid API key", nil)
        return
    }
}
```

### API Key Validation

```go
func validateAPIKey(apiKey string) (bool, error) {
    // Call auth service via HTTP
    resp, err := http.Post("http://auth:8001/verify/apikey",
        "application/json",
        strings.NewReader(fmt.Sprintf(`{"key":"%s"}`, apiKey)))

    if err != nil {
        return false, err
    }
    defer resp.Body.Close()

    var result struct {
        Valid bool `json:"valid"`
    }

    json.NewDecoder(resp.Body).Decode(&result)
    return result.Valid, nil
}
```

---

## Service Architecture

Each microservice follows a consistent architecture pattern.

### Service Structure

```
service-name/
├── api/
│   └── feature/
│       ├── dto/           # Request/Response DTOs
│       ├── message/       # NATS message types
│       ├── model/         # Database models
│       ├── controller.go  # HTTP + NATS handlers
│       └── service.go     # Business logic
├── cmd/
│   └── main.go           # Service entry point
├── config/
│   └── env.go            # Environment configuration
├── startup/
│   ├── server.go         # HTTP server setup
│   ├── module.go         # Dependency injection
│   └── index.go          # Database indexes
├── tests/                # Unit and integration tests
├── Dockerfile            # Container configuration
└── go.mod               # Go module
```

### Dependency Injection

```go
package startup

type Module struct {
    DB        mongo.Database
    Store     redis.Store
    NatsClient micro.NatsClient
    Service   api.Service
    Controller micro.Controller
}

func NewModule(env *config.Env) *Module {
    // Database connections
    db := mongo.NewDatabase(context.Background(), mongo.Config{
        URI:      env.DB_URI,
        Database: env.DB_NAME,
    })

    store := redis.NewStore(&redis.Options{
        Addr:     fmt.Sprintf("%s:%d", env.RedisHost, env.RedisPort),
        Password: env.RedisPassword,
        DB:       env.RedisDB,
    })

    // NATS client
    natsConfig := micro.Config{
        NatsUrl:         env.NATS_URL,
        NatsServiceName: env.SERVICE_NAME,
    }
    natsClient := micro.NewNatsClient(&natsConfig)

    // Service initialization
    service := api.NewService(db, store, natsClient)

    // Controller initialization
    authProvider := network.NewJWTAuthProvider(env.JWTSecretKey, env.JWTPublicKey)
    authorizeProvider := network.NewRoleAuthorizationProvider()
    controller := api.NewController(authProvider, authorizeProvider, service)

    return &Module{
        DB:        db,
        Store:     store,
        NatsClient: natsClient,
        Service:   service,
        Controller: controller,
    }
}
```

---

## Database Patterns

Different databases for different service needs.

### PostgreSQL (Auth Service)

```go
// User model
type User struct {
    ID       uuid.UUID `db:"id"`
    Email    string    `db:"email"`
    Password string    `db:"password_hash"`
    Name     string    `db:"name"`
    Role     string    `db:"role"`
    Verified bool      `db:"verified"`
    CreatedAt time.Time `db:"created_at"`
}

// Repository pattern
type UserRepository interface {
    Create(user *User) error
    FindByEmail(email string) (*User, error)
    FindByID(id uuid.UUID) (*User, error)
}

func (r *userRepository) FindByEmail(email string) (*User, error) {
    query := `SELECT id, email, password_hash, name, role, verified, created_at
              FROM users WHERE email = $1`

    var user User
    err := r.db.QueryRow(context.Background(), query, email).Scan(
        &user.ID, &user.Email, &user.Password, &user.Name,
        &user.Role, &user.Verified, &user.CreatedAt)

    return &user, err
}
```

### MongoDB (Blog Service)

```go
// Blog model
type Blog struct {
    ID          primitive.ObjectID `bson:"_id,omitempty"`
    Title       string             `bson:"title"`
    Description string             `bson:"description"`
    Content     string             `bson:"content"`
    Slug        string             `bson:"slug"`
    AuthorID    string             `bson:"authorId"`
    Tags        []string           `bson:"tags"`
    Status      string             `bson:"status"`
    PublishedAt *time.Time         `bson:"publishedAt"`
    CreatedAt   time.Time          `bson:"createdAt"`
    UpdatedAt   time.Time          `bson:"updatedAt"`
}

// Query builder pattern
func (s *service) FindBlogs(filter bson.M, opts *options.FindOptions) ([]*Blog, error) {
    cursor, err := s.blogQueryBuilder.Query().Find(filter, opts)
    if err != nil {
        return nil, err
    }

    var blogs []*Blog
    err = cursor.All(context.Background(), &blogs)
    return blogs, err
}

func (s *service) CreateBlog(blog *Blog) error {
    result, err := s.blogQueryBuilder.SingleQuery().InsertOne(blog)
    if err != nil {
        return err
    }

    blog.ID = result.InsertedID.(primitive.ObjectID)
    return nil
}
```

---

## Authentication & Authorization

Distributed authentication across microservices.

### JWT Token Validation

```go
func (s *authService) validateToken(tokenString string) (*Claims, error) {
    // Parse and verify JWT
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // Load RSA public key
        publicKeyData, err := os.ReadFile(s.publicKeyPath)
        if err != nil {
            return nil, err
        }

        publicKey, err := jwt.ParseRSAPublicKeyFromPEM(publicKeyData)
        return publicKey, err
    })

    if err != nil {
        return nil, err
    }

    if !token.Valid {
        return nil, errors.New("invalid token")
    }

    return token.Claims.(*Claims), nil
}
```

### Role-Based Authorization

```go
func (s *authService) validateUserRole(userID string, requiredRole string) (bool, error) {
    // Get user from database
    user, err := s.userRepository.FindByID(uuid.MustParse(userID))
    if err != nil {
        return false, err
    }

    // Check role hierarchy
    roleHierarchy := map[string]int{
        "LEARNER": 1,
        "AUTHOR":  2,
        "EDITOR":  3,
        "ADMIN":   4,
    }

    userLevel := roleHierarchy[user.Role]
    requiredLevel := roleHierarchy[requiredRole]

    return userLevel >= requiredLevel, nil
}
```

### Inter-Service Authentication

```go
// Blog service validates user via NATS
func (s *blogService) authorizeBlogAccess(userID, action string) error {
    // Validate token
    user, err := s.validateUserToken(userID)
    if err != nil {
        return err
    }

    // Check role permissions
    hasPermission, err := s.validateUserRole(userID, getRequiredRole(action))
    if err != nil {
        return err
    }

    if !hasPermission {
        return errors.New("insufficient permissions")
    }

    return nil
}

func getRequiredRole(action string) string {
    switch action {
    case "create":
        return "AUTHOR"
    case "publish":
        return "EDITOR"
    default:
        return "LEARNER"
    }
}
```

---

## Best Practices

### Service Design

1. **Single Responsibility** - Each service has one clear purpose
2. **API First** - Design APIs before implementation
3. **Independent Deployment** - Services can be deployed separately
4. **Event-Driven** - Use events for loose coupling

### Communication

1. **API Gateway** - All external traffic goes through Kong
2. **NATS for Events** - Use NATS for asynchronous communication
3. **Request/Reply** - Use for synchronous service calls when necessary
4. **API Keys** - Secure service-to-service communication

### Data Management

1. **Service Ownership** - Each service owns its data
2. **Eventual Consistency** - Accept eventual consistency for performance
3. **Caching** - Cache aggressively, invalidate carefully
4. **Migrations** - Handle schema changes carefully

### Security

1. **API Keys** - Validate at gateway level
2. **JWT Tokens** - Validate across services
3. **Role Checks** - Authorize actions appropriately
4. **Network Security** - Secure inter-service communication

## Next Steps

- See [Architecture](/micro/architecture) for detailed design
- Check [Configuration](/micro/configuration) for setup options
- Review [API Reference](/micro/api-reference) for endpoints