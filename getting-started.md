# Getting Started with goserve

Get up and running with the goserve framework in minutes.

## What is goserve?

**goserve** is a robust Go backend architecture framework that provides a performant and scalable foundation for building REST APIs. It emphasizes feature separation, clean code, testability, and includes built-in JWT authentication, role-based authorization, and microservices capabilities through the gomicro extension.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (depending on your use case)

- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/) (for PostgreSQL support)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) (for MongoDB support)
- **Redis 6+** - [Download](https://redis.io/download) (for caching and sessions)

### Verify Installation

```bash
# Check Go version
go version
# Should output: go version go1.21.x or higher

# Check Git
git --version
```

## Installation

Install goserve in your Go project:

```bash
go get github.com/afteracademy/goserve
```

Or add it to your `go.mod`:

```go
require github.com/afteracademy/goserve v2.1.1
```

Then run:

```bash
go mod tidy
```

### Alternative: Use the PostgreSQL Example as Starting Point

For a complete, production-ready starting point:

```bash
# Clone the PostgreSQL example
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git my-api
cd my-api

# Install dependencies
go mod download

# Copy environment file
cp .tools/copy/env/.env.example .env

# Edit environment variables
nano .env

# Run the application
go run cmd/main.go
```

## Quick Start

### 1. Create a New Project

```bash
mkdir my-goserve-app
cd my-goserve-app
go mod init my-goserve-app
go get github.com/afteracademy/goserve
```

### 2. Basic Server Setup

Create a `main.go` file:

```go
package main

import (
    "github.com/afteracademy/goserve/network"
    "github.com/gin-gonic/gin"
)

func main() {
    router := gin.Default()
    
    // Initialize goserve network components
    controller := network.NewController("/api", nil, nil)
    
    // Mount your routes
    controller.MountRoutes(router)
    
    router.Run(":8080")
}
```

### 3. Run Your Server

```bash
go run main.go
```

Your server will be available at `http://localhost:8080`

## Framework Components

goserve provides several key components organized in a layered architecture:

### Network Layer (Controllers & Routing)
- **Base Controllers** - HTTP request handlers with built-in auth
- **Middleware System** - JWT authentication, role authorization, CORS
- **Route Groups** - Feature-based route organization
- **Error Handling** - Structured error responses

### Database Layer
- **PostgreSQL** - Advanced pgx driver with connection pooling
- **MongoDB** - Official MongoDB driver support
- **Redis** - Caching with type-safe generics

### Business Logic Layer
- **Services** - Business logic with caching and transactions
- **Models** - Database schema representations
- **DTOs** - Type-safe request/response objects
- **Validation** - Struct-based input validation

### Security & Authentication
- **JWT Authentication** - RSA-signed tokens
- **Role-Based Authorization** - Hierarchical permissions
- **API Key Support** - Service-to-service authentication
- **Password Hashing** - bcrypt-based security

### Microservices Extensions
- **gomicro Framework** - Distributed system support
- **Kong Integration** - API gateway routing
- **NATS Messaging** - Inter-service communication
- **Service Discovery** - Automatic service registration

## Example Projects

The best way to learn goserve is through example projects:

1. **[PostgreSQL Example](/postgres/)** - Complete REST API with PostgreSQL, Redis, JWT authentication, role-based authorization, and comprehensive testing
2. **gomicro** - Microservices extension with Kong API gateway, NATS messaging, and service discovery
3. **MongoDB Example** - MongoDB-based implementation (available in main repository)

## Your First Feature

Let's create a simple blog feature with authentication. First, set up the basic structure:

### Project Structure

```
my-goserve-app/
├── api/
│   └── blog/
│       ├── dto/
│       │   └── blog.go
│       ├── model/
│       │   └── blog.go
│       ├── controller.go
│       └── service.go
├── config/
│   └── env.go
├── startup/
│   ├── module.go
│   └── server.go
├── cmd/
│   └── main.go
└── go.mod
```

### 1. Define DTOs (api/blog/dto/blog.go)

```go
package dto

type BlogCreate struct {
    Title       string   `json:"title" validate:"required,min=3,max=500"`
    Description string   `json:"description" validate:"required,min=3,max=2000"`
    Content     string   `json:"content" validate:"required,max=50000"`
    Tags        []string `json:"tags" validate:"required,min=1,dive,max=50"`
}

type BlogResponse struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Content     string    `json:"content"`
    Tags        []string  `json:"tags"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}
```

### 2. Define Model (api/blog/model/blog.go)

```go
package model

import (
    "time"
    "github.com/google/uuid"
)

type Blog struct {
    ID          uuid.UUID `db:"id"`
    Title       string    `db:"title"`
    Description string    `db:"description"`
    Content     string    `db:"content"`
    Tags        []string  `db:"tags"`
    AuthorID    uuid.UUID `db:"author_id"`
    CreatedAt   time.Time `db:"created_at"`
    UpdatedAt   time.Time `db:"updated_at"`
}
```

### 3. Create Service (api/blog/service.go)

```go
package blog

import (
    "context"
    "my-goserve-app/api/blog/dto"
    "my-goserve-app/api/blog/model"
    "github.com/jackc/pgx/v5/pgxpool"
)

type Service interface {
    CreateBlog(dto *dto.BlogCreate, authorID uuid.UUID) (*dto.BlogResponse, error)
    GetBlog(id uuid.UUID) (*dto.BlogResponse, error)
}

type service struct {
    db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) Service {
    return &service{db: db}
}

func (s *service) CreateBlog(dto *dto.BlogCreate, authorID uuid.UUID) (*dto.BlogResponse, error) {
    blog := &model.Blog{
        ID:          uuid.New(),
        Title:       dto.Title,
        Description: dto.Description,
        Content:     dto.Content,
        Tags:        dto.Tags,
        AuthorID:    authorID,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }

    query := `
        INSERT INTO blogs (id, title, description, content, tags, author_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`

    err := s.db.QueryRow(context.Background(), query,
        blog.ID, blog.Title, blog.Description, blog.Content,
        blog.Tags, blog.AuthorID, blog.CreatedAt, blog.UpdatedAt).Scan(&blog.ID)

    if err != nil {
        return nil, err
    }

    return &dto.BlogResponse{
        ID:          blog.ID.String(),
        Title:       blog.Title,
        Description: blog.Description,
        Content:     blog.Content,
        Tags:        blog.Tags,
        CreatedAt:   blog.CreatedAt,
        UpdatedAt:   blog.UpdatedAt,
    }, nil
}
```

### 4. Create Controller (api/blog/controller.go)

```go
package blog

import (
    "my-goserve-app/api/blog/dto"
    "my-goserve-app/common"
    "my-goserve-app/network"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

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
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes
    group.GET("/:id", c.getBlog)

    // Protected routes (require authentication)
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
        protected.POST("/", c.createBlog)
    }
}

func (c *controller) createBlog(ctx *gin.Context) {
    // Parse request body
    body, err := network.ReqBody[dto.BlogCreate](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, "Invalid request body", err)
        return
    }

    // Get authenticated user
    user := c.GetUser(ctx)
    if user == nil {
        network.SendUnauthorizedError(ctx, "Authentication required", nil)
        return
    }

    // Create blog
    result, err := c.service.CreateBlog(body, user.ID)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Blog created successfully", result)
}

func (c *controller) getBlog(ctx *gin.Context) {
    idStr := ctx.Param("id")
    id, err := uuid.Parse(idStr)
    if err != nil {
        network.SendBadRequestError(ctx, "Invalid blog ID", err)
        return
    }

    result, err := c.service.GetBlog(id)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Blog retrieved successfully", result)
}
```

### 5. Wire Everything Together (startup/module.go)

```go
package startup

import (
    "my-goserve-app/api/blog"
    "github.com/jackc/pgx/v5/pgxpool"
)

type Module struct {
    BlogController network.Controller
    BlogService    blog.Service
}

func NewModule(db *pgxpool.Pool) *Module {
    // Initialize services
    blogService := blog.NewService(db)

    // Initialize controllers (without auth for simplicity)
    blogController := blog.NewController(nil, nil, blogService)

    return &Module{
        BlogController: blogController,
        BlogService:    blogService,
    }
}
```

### 6. Main Application (cmd/main.go)

```go
package main

import (
    "my-goserve-app/startup"
    "github.com/gin-gonic/gin"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    // Connect to database (simplified)
    db, err := pgxpool.New(context.Background(), "postgres://user:pass@localhost/db")
    if err != nil {
        panic(err)
    }
    defer db.Close()

    // Initialize module
    module := startup.NewModule(db)

    // Setup Gin router
    router := gin.Default()

    // Mount routes
    blogGroup := router.Group("/api")
    module.BlogController.MountRoutes(blogGroup)

    router.Run(":8080")
}
```

Test your API:

```bash
# Create a blog (this will fail without auth, but shows the structure)
curl -X POST http://localhost:8080/api/blog \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Blog","description":"A test blog","content":"Hello World!","tags":["test"]}'

# Get a blog
curl http://localhost:8080/api/blog/{blog-id}
```

Test it:

```bash
curl http://localhost:8080/hello
```

## Next Steps

- **Understand the Architecture**: Read [Framework Architecture](/architecture) to learn goserve's layered design
- **Learn Core Concepts**: Explore [Core Concepts](/core-concepts) for JWT auth, services, DTOs, and caching
- **See a Complete Example**: Check out the [PostgreSQL Example](/postgres/) with full authentication and blog features
- **Configure Your Setup**: Review [Configuration](/configuration) for environment variables and database setup
- **Explore Microservices**: Learn about [gomicro](/gomicro/) for distributed system architecture

## Need Help?

- 💬 Ask questions on [GitHub Discussions](https://github.com/afteracademy/goserve/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/afteracademy/goserve/issues)
- 📺 Watch tutorials on [YouTube Channel](https://www.youtube.com/@afteracad)
- 📖 Read the [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)
