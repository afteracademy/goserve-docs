# gomicro - Microservices with goserve

Learn how to build distributed systems using goserve's microservices extension.

## Overview

**gomicro** is a microservices framework built on top of goserve that enables you to break down monolithic applications into independent, scalable services. It provides API gateway routing, inter-service communication, and service discovery capabilities.

## Architecture

```
Internet
    ↓
Kong API Gateway (Port 8000)
    ↓ Routes requests to services
┌─────────────────┐    NATS Messaging    ┌─────────────────┐
│  auth-service   │◄──────────────────►│  blog-service   │
│    (Port 8001)  │                     │   (Port 8002)   │
└─────────────────┘                     └─────────────────┘
        ↓                                       ↓
PostgreSQL + Redis                    PostgreSQL + Redis
```

## Core Components

### 1. Kong API Gateway

**Purpose**: Centralized API gateway for routing, authentication, and rate limiting.

**Key Features**:
- **Request Routing**: Routes requests to appropriate microservices
- **API Key Authentication**: Validates service-to-service API keys
- **Rate Limiting**: Prevents abuse and manages traffic
- **Load Balancing**: Distributes load across service instances
- **Logging**: Centralized request/response logging

**Configuration**:
```yaml
# kong.yml
services:
  - name: auth-service
    url: http://auth:8001
    routes:
      - paths: ["/auth"]
        methods: ["POST", "GET"]

  - name: blog-service
    url: http://blog:8002
    routes:
      - paths: ["/blog"]
        methods: ["GET", "POST", "PUT", "DELETE"]
```

### 2. NATS Messaging

**Purpose**: Asynchronous communication between microservices.

**Key Features**:
- **Publish/Subscribe**: Event-driven architecture
- **Request/Reply**: Synchronous service communication
- **Queue Groups**: Load balancing across service instances
- **Message Persistence**: Guaranteed message delivery

**Usage Patterns**:
```go
// Publish event
func (s *blogService) publishBlogCreated(blog *model.Blog) error {
    data, _ := json.Marshal(blog)
    return s.nats.Publish("blog.created", data)
}

// Subscribe to events
func (s *userService) handleBlogCreated(msg *nats.Msg) {
    var blog model.Blog
    json.Unmarshal(msg.Data, &blog)

    // Update user's blog count
    s.incrementUserBlogCount(blog.AuthorID)
}
```

### 3. Service Architecture

**Independent Services**: Each service runs as a separate process with its own:
- Database connections
- Redis cache
- Business logic
- API endpoints

**Service Communication**:
- **API Gateway**: External client requests
- **NATS**: Internal service communication
- **Database**: Service-specific data storage
- **Shared Cache**: Cross-service caching when needed

## Getting Started

### 1. Set Up Docker Environment

```bash
# Clone the gomicro repository
git clone https://github.com/afteracademy/gomicro.git
cd gomicro

# Start infrastructure
docker-compose up -d kong nats postgres redis

# Wait for services to be ready
sleep 30
```

### 2. Configure Services

Each service needs its own configuration:

```bash
# Auth service (.env.auth)
DB_HOST=postgres
SERVICE_NAME=auth-service
SERVICE_PORT=8001

# Blog service (.env.blog)
DB_HOST=postgres
SERVICE_NAME=blog-service
SERVICE_PORT=8002
```

### 3. Start Services

```bash
# Terminal 1: Start auth service
cd auth-service
go run cmd/main.go

# Terminal 2: Start blog service
cd blog-service
go run cmd/main.go
```

## Service Communication Patterns

### API Key Authentication

**Flow**:
```
Client Request → Kong → API Key Plugin → Auth Service → Validate Key → Route to Service
```

**Implementation**:
```go
// Kong plugin calls auth service
func (s *authService) verifyAPIKey(apiKey string) (*APIKey, error) {
    return s.repository.FindByKey(apiKey)
}

// Service validates API key
func (s *blogService) validateAPIKey(apiKey string) bool {
    // Call auth service or check local cache
    return s.authClient.ValidateAPIKey(apiKey)
}
```

### Event-Driven Communication

**Blog Creation Event**:
```go
// Blog service publishes event
func (s *blogService) createBlog(dto *dto.BlogCreate) (*model.Blog, error) {
    blog, err := s.saveBlog(dto)
    if err != nil {
        return nil, err
    }

    // Publish event asynchronously
    go s.publishEvent("blog.created", blog)

    return blog, nil
}

// User service reacts to event
func (s *userService) onBlogCreated(msg *nats.Msg) {
    var event BlogCreatedEvent
    json.Unmarshal(msg.Data, &event)

    // Update user statistics
    s.updateUserStats(event.AuthorID, "blogs_count", 1)
}
```

### Synchronous Service Calls

**Request/Reply Pattern**:
```go
// Blog service needs user info
func (s *blogService) getAuthorInfo(authorID uuid.UUID) (*UserInfo, error) {
    // Call auth service synchronously
    req := &GetUserRequest{UserID: authorID}
    resp, err := s.authClient.GetUserInfo(req)
    return resp.User, err
}
```

## Database Patterns

### Service-Specific Databases

Each service maintains its own database schema:

```
auth-service: users, api_keys, sessions
blog-service: blogs, comments, tags
```

### Shared Data Access

For shared entities, use service communication:

```go
// Blog service needs user data
blog, err := s.getBlog(id)
if err != nil {
    return nil, err
}

// Get author info from auth service
author, err := s.authService.GetUser(blog.AuthorID)
if err != nil {
    return nil, err
}

blog.Author = author
return blog, nil
```

## Caching Strategy

### Local Service Cache

Each service has its own Redis cache:

```go
// Auth service cache
userCache := redis.NewCache[UserCache](store)

// Blog service cache
blogCache := redis.NewCache[BlogCache](store)
```

### Cache Invalidation

**Event-Based Invalidation**:
```go
// User service publishes cache invalidation event
func (s *userService) updateUser(user *model.User) error {
    err := s.saveUser(user)
    if err != nil {
        return err
    }

    // Invalidate caches across services
    s.publishEvent("user.updated", user.ID)
    return nil
}

// Blog service listens for invalidation
func (s *blogService) onUserUpdated(msg *nats.Msg) {
    var userID uuid.UUID
    json.Unmarshal(msg.Data, &userID)

    // Invalidate blog cache for this author
    s.invalidateAuthorBlogsCache(userID)
}
```

## Deployment

### Docker Compose Setup

```yaml
version: '3.8'
services:
  kong:
    image: kong:3.0
    ports:
      - "8000:8000"
    environment:
      KONG_DATABASE: off
      KONG_DECLARATIVE_CONFIG: /kong.yml
    volumes:
      - ./kong.yml:/kong.yml

  nats:
    image: nats:2.9
    ports:
      - "4222:4222"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gomicro
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7

  auth-service:
    build: ./auth-service
    environment:
      SERVICE_NAME: auth-service
    depends_on:
      - postgres
      - redis
      - nats

  blog-service:
    build: ./blog-service
    environment:
      SERVICE_NAME: blog-service
    depends_on:
      - postgres
      - redis
      - nats
      - kong
```

### Kubernetes Deployment

```yaml
# Service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blog-service
  template:
    metadata:
      labels:
        app: blog-service
    spec:
      containers:
      - name: blog-service
        image: gomicro/blog-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: SERVICE_NAME
          value: "blog-service"
        - name: NATS_URL
          value: "nats://nats:4222"
```

## Monitoring & Observability

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
    if err := s.nats.Status(); err != nil {
        c.JSON(500, gin.H{"status": "unhealthy", "nats": "down"})
        return
    }

    c.JSON(200, gin.H{"status": "healthy"})
}
```

### Centralized Logging

```go
// Structured logging with service context
logger.WithFields(logrus.Fields{
    "service": "blog-service",
    "request_id": requestID,
    "user_id": userID,
}).Info("Blog created successfully")
```

### Metrics Collection

```go
// Prometheus metrics
var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"service", "method", "endpoint", "status"},
    )
)
```

## Best Practices

### Service Design

1. **Single Responsibility**: Each service has one clear purpose
2. **API First**: Design APIs before implementation
3. **Independent Deployments**: Services can be deployed independently
4. **Event-Driven**: Use events for loose coupling

### Communication

1. **API Gateway**: All external traffic goes through Kong
2. **NATS for Events**: Use NATS for asynchronous communication
3. **Request/Reply**: Use for synchronous service calls when necessary
4. **API Keys**: Secure service-to-service communication

### Data Management

1. **Service Ownership**: Each service owns its data
2. **Eventual Consistency**: Accept eventual consistency for performance
3. **Caching**: Cache aggressively, invalidate carefully
4. **Migrations**: Handle schema changes carefully

### Operations

1. **Health Checks**: Implement comprehensive health checks
2. **Logging**: Structured logging with correlation IDs
3. **Metrics**: Collect and monitor key metrics
4. **Circuit Breakers**: Implement resilience patterns

## Migration from Monolith

### Step 1: Identify Boundaries

Analyze your monolithic application to identify service boundaries:

```
Monolithic Blog App
├── User Management → auth-service
├── Blog CRUD → blog-service
├── Comments → comment-service
├── Notifications → notification-service
```

### Step 2: Extract Services

1. **Create Service Skeleton**: Set up basic service structure
2. **Move Code**: Migrate business logic to new service
3. **Database Migration**: Create service-specific database
4. **API Creation**: Implement REST APIs for the service

### Step 3: Integration

1. **Kong Configuration**: Set up routing rules
2. **NATS Events**: Implement event publishing/subscribing
3. **API Key Setup**: Configure service authentication
4. **Testing**: Comprehensive integration testing

### Step 4: Deployment

1. **Docker**: Containerize each service
2. **Orchestration**: Set up Kubernetes or Docker Compose
3. **Monitoring**: Implement observability
4. **Gradual Migration**: Migrate traffic gradually

## Troubleshooting

### Common Issues

**Service Discovery Failures**:
```bash
# Check NATS connectivity
nats pub test.subject "test message"

# Check Kong routes
curl http://localhost:8001/routes
```

**Database Connection Issues**:
```bash
# Check database connectivity
docker exec -it postgres pg_isready -h localhost

# Check service logs
docker logs blog-service
```

**API Key Authentication**:
```bash
# Test API key validation
curl -H "X-API-Key: your-api-key" http://localhost:8000/blog
```

## Next Steps

- [goserve Architecture](/architecture) - Learn the base framework
- [PostgreSQL Example](/postgres/) - See a complete implementation
- [Configuration](/configuration) - Environment setup
- [Core Concepts](/core-concepts) - Implementation patterns

## Resources

- [Kong Documentation](https://docs.konghq.com/)
- [NATS Documentation](https://docs.nats.io/)
- [Go Microservices Blog](https://medium.com/@janishar.ali/how-to-create-microservices-a-practical-guide-using-go-35445a821513)
- [Docker Compose](https://docs.docker.com/compose/)