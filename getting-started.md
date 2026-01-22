# Getting Started with goserve

Get up and running with the goserve framework in minutes.

## What is goserve?

**goserve** is a robust Go backend architecture framework that provides a performant and scalable foundation for building REST APIs. It emphasizes feature separation, clean code, and testability.

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

goserve provides several key components:

### Network Layer
- **Controllers** - HTTP request handlers
- **Middleware** - Authentication, authorization, and custom middleware
- **Routing** - Clean route management

### Database Support
- **PostgreSQL** - Using pgx driver with connection pooling
- **MongoDB** - Official MongoDB driver support
- **Redis** - Caching and session management

### Utilities
- **DTOs** - Data Transfer Objects for request/response
- **Validators** - Request validation
- **Configuration** - Environment-based config management
- **Crypto** - Cryptographic utilities

## Example Projects

The best way to learn goserve is through example projects:

1. **[PostgreSQL Example](/postgres/)** - Complete REST API with PostgreSQL, Redis, and JWT
2. **MongoDB Example** - MongoDB-based implementation
3. **Microservice Example** - Microservice architecture patterns

## Your First Feature

Let's create a simple "Hello World" endpoint:

```go
package main

import (
    "github.com/afteracademy/goserve/network"
    "github.com/gin-gonic/gin"
    "net/http"
)

type HelloController struct {
    network.Controller
}

func NewHelloController() network.Controller {
    return &HelloController{
        Controller: network.NewController("/hello", nil, nil),
    }
}

func (c *HelloController) MountRoutes(router *gin.Engine) {
    c.Controller.MountRoutes(router)
    router.GET("/hello", c.sayHello)
}

func (c *HelloController) sayHello(ctx *gin.Context) {
    ctx.JSON(http.StatusOK, gin.H{
        "message": "Hello from goserve!",
    })
}

func main() {
    router := gin.Default()
    
    helloController := NewHelloController()
    helloController.MountRoutes(router)
    
    router.Run(":8080")
}
```

Test it:

```bash
curl http://localhost:8080/hello
```

## Next Steps

- **Understand the Architecture**: Read [Framework Architecture](/architecture) to learn how goserve is structured
- **Learn Core Concepts**: Explore [Core Concepts](/core-concepts) for patterns and best practices
- **See a Complete Example**: Check out the [PostgreSQL Example](/postgres/) for a full implementation
- **Configure Your Setup**: Review [Configuration](/configuration) for environment setup

## Need Help?

- 💬 Ask questions on [GitHub Discussions](https://github.com/afteracademy/goserve/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/afteracademy/goserve/issues)
- 📺 Watch tutorials on [YouTube Channel](https://www.youtube.com/@afteracad)
- 📖 Read the [Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)
