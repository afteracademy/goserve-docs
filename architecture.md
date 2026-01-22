# Framework Architecture

Understanding the goserve framework architecture and design patterns.

## Overview

goserve is built on a **modular, feature-based architecture** that promotes clean code, separation of concerns, and testability. The framework provides a solid foundation while giving you flexibility to structure your application as needed.

## Core Principles

1. **Modularity** - Components are organized into clear, reusable modules
2. **Separation of Concerns** - Network, database, and business logic are clearly separated
3. **Testability** - Architecture supports easy unit and integration testing
4. **Flexibility** - Use only the components you need
5. **Performance** - Built on high-performance Go libraries

## Framework Structure

```
goserve/
├── network/          # HTTP networking layer
│   ├── controller.go
│   ├── middleware.go
│   └── router.go
├── postgres/         # PostgreSQL support
│   ├── connection.go
│   ├── pool.go
│   └── utilities.go
├── mongo/            # MongoDB support
│   ├── client.go
│   └── utilities.go
├── redis/            # Redis support
│   ├── client.go
│   └── cache.go
├── middleware/       # Built-in middleware
│   ├── auth.go
│   ├── cors.go
│   └── logger.go
├── dto/              # Data Transfer Objects
├── utility/           # Utility functions
└── micro/            # Microservice patterns
```

## Component Architecture

### Network Layer

The network layer provides HTTP handling capabilities:

- **Controllers** - Base controller interface for handling HTTP requests
- **Middleware** - Authentication, authorization, logging, and custom middleware
- **Routing** - Clean route management and mounting

### Database Layer

Support for multiple database backends:

- **PostgreSQL** - Using pgx with connection pooling
- **MongoDB** - Official MongoDB driver
- **Redis** - Caching and session storage

### Middleware System

Built-in middleware for common needs:

- **Authentication** - JWT and token-based auth
- **Authorization** - Role-based access control
- **CORS** - Cross-origin resource sharing
- **Logging** - Request/response logging
- **Validation** - Request validation

## Design Patterns

### Controller Pattern

Controllers handle HTTP requests and delegate to services:

```go
type Controller interface {
    MountRoutes(router *gin.Engine)
}
```

### Service Pattern

Services contain business logic:

```go
type Service interface {
    // Business logic methods
}
```

### Repository Pattern

Data access is abstracted through repositories:

```go
type Repository interface {
    // Data access methods
}
```

## Request Flow

```
HTTP Request
    ↓
Router (Gin)
    ↓
Middleware Chain
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database
    ↓
Response
```

## Feature-Based Organization

Recommended project structure:

```
your-project/
├── api/                    # API features
│   ├── auth/              # Authentication feature
│   │   ├── controller.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── dto/
│   ├── users/             # User feature
│   └── products/          # Product feature
├── common/                # Shared code
├── config/                # Configuration
└── cmd/                   # Application entry
```

## Dependency Injection

goserve supports dependency injection patterns:

- Constructor injection
- Interface-based design
- Easy mocking for tests

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

## Performance Considerations

- Connection pooling for databases
- Efficient routing
- Minimal overhead
- Optimized for high throughput

## Next Steps

- Learn about [Core Concepts](/core-concepts) for detailed patterns
- See [Configuration](/configuration) for setup details
- Check the [PostgreSQL Example](/postgres/) for a complete implementation
