# Project Architecture

Understanding the goserve MongoDB example API architecture and design patterns.

## Overview

The goserve MongoDB example demonstrates a complete **production-ready REST API** built with the goserve framework using MongoDB as the primary database. It follows a **feature-based modular architecture** where each API endpoint is organized into self-contained modules with clear separation of concerns, JWT authentication, and comprehensive testing.

### Why this stack
- Document-first: flexible schemas with DTO validation and cache-aside Redis support.
- Same security posture: API key edge + JWT + roles mirroring the Postgres example.
- Lean starter: minimal surface area to prototype quickly while keeping tests and Docker.

### Core Principles

1. **Feature Independence** - Each API feature is isolated in its own directory
2. **Service Sharing** - Common services can be shared across features
3. **Clean Separation** - Controllers, services, models, and DTOs are clearly separated
4. **Testability** - Architecture supports easy unit and integration testing

## Directory Structure

```
goserve-example-api-server-mongo/
├── api/                    # API feature modules
│   └── sample/            # Sample feature
│       ├── dto/           # Data Transfer Objects
│       │   └── info_sample.go
│       ├── model/         # MongoDB document models
│       │   └── sample.go
│       ├── controller.go  # HTTP handlers
│       └── service.go     # Business logic
├── cmd/                   # Application entry point
│   └── main.go           # Main function
├── common/                # Shared utilities
│   └── context_payload.go # Request context helpers
├── config/                # Configuration
│   └── env.go            # Environment variables
├── startup/               # Server initialization
│   ├── server.go         # Server setup
│   ├── module.go         # Dependency injection
│   └── indexes.go        # Database indexes
├── tests/                 # Integration tests
├── utils/                 # Utility functions
├── .tools/                # Code generation tools
│   ├── apigen.go         # API generator
│   ├── rsa/              # RSA key generator
│   └── copy/             # Env file copier
├── keys/                  # RSA keys for JWT
└── .extra/                # MongoDB scripts and docs
```

## Application Flow

### Startup Sequence

```
main.go (cmd/main.go)
  ↓
startup.Server() - Initialize HTTP server
  ↓
create() - Component initialization
  ├── Load Environment Variables (config.Env)
  │   ├── Database credentials
  │   ├── JWT RSA keys
  │   ├── Redis configuration
  │   └── Server settings
  ├── Connect MongoDB (mongo.Database)
  │   ├── Create connection pool
  │   ├── Configure timeouts
  │   └── Health checks
  ├── Connect Redis (redis.Store)
  │   ├── Initialize client
  │   ├── Configure pooling
  │   └── Test connection
  ├── Create Module (startup.Module)
  │   ├── Wire Dependencies
  │   ├── Initialize Services
  │   ├── Create Controllers
  │   └── Setup Middleware
  ├── Ensure Database Indexes (startup.indexes)
  │   ├── Create MongoDB indexes
  │   └── Optimize query performance
  ↓
router.Start() - Start Gin HTTP server
  ├── Global middleware (CORS, logging, error handling)
  ├── Route mounting (/sample endpoints)
  └── Server listening on configured port
```

### Request Flow

```
HTTP Request (e.g., GET /sample/id/123)
  ↓
Root Middleware (Global - applied to all routes)
├── Error Recovery - Catch panics and return 500
├── API Key Validation - For external service calls
├── CORS Headers - Cross-origin resource sharing
├── Request Logging - Structured logging
└── Not Found Handler - 404 for undefined routes
  ↓
Router (Gin Engine)
```

## API Design

![Request-Response design diagram showing middleware, controller, service, and database flow](/images/request-flow.svg)

The API follows a layered request-response pattern with proper error handling and middleware chains.

### Request Flow

```
HTTP Request (e.g., GET /sample/id/123)
  ↓
Root Middleware (Global - applied to all routes)
├── Error Recovery - Catch panics and return 500
├── API Key Validation - For external service calls
├── CORS Headers - Cross-origin resource sharing
├── Request Logging - Structured logging
└── Not Found Handler - 404 for undefined routes
  ↓
Router (Gin Engine)

## Layer Responsibilities

### 1. Controllers

**Location**: `api/[feature]/controller.go`

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Define route endpoints within feature groups
- Parse and validate request parameters and bodies
- Call service methods with proper error handling
- Format responses with consistent structure
- Handle HTTP-specific concerns (headers, status codes)

**Controller Structure**:

```go
type controller struct {
    network.Controller           // Base controller interface
    common.ContextPayload        // User context management
    service Service             // Business logic service
}

func NewController(
    authProvider network.AuthenticationProvider,
    authorizeProvider network.AuthorizationProvider,
    service Service,
) network.Controller {
    return &controller{
        Controller: network.NewController("/sample", authProvider, authorizeProvider),
        service: service,
    }
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
    // Public routes
    group.GET("/id/:id", c.getSampleHandler)
    group.GET("/", c.getSamplesHandler)

    // Protected routes (require authentication)
    protected := group.Group("/")
    protected.Use(c.AuthProvider.Middleware())
    {
        protected.POST("/", c.createSampleHandler)
        protected.PUT("/id/:id", c.updateSampleHandler)
        protected.DELETE("/id/:id", c.deleteSampleHandler)
    }
}
```

### 2. Services

**Location**: `api/[feature]/service.go`

**Purpose**: Implement business logic with MongoDB operations and caching

**Responsibilities**:
- Business rule enforcement and validation
- MongoDB CRUD operations with queries
- Redis caching (cache-aside pattern)
- Data transformation between models and DTOs
- Error handling and business logic

**Service Implementation**:

```go
type Service interface {
    FindSample(id primitive.ObjectID) (*model.Sample, error)
    FindSamples(filter bson.M) ([]*model.Sample, error)
    CreateSample(dto *dto.CreateSample) (*model.Sample, error)
    UpdateSample(id primitive.ObjectID, dto *dto.UpdateSample) (*model.Sample, error)
    DeleteSample(id primitive.ObjectID) error
}

type service struct {
    sampleQueryBuilder mongo.QueryBuilder[model.Sample]
    infoSampleCache    redis.Cache[dto.InfoSample]
}

func NewService(db mongo.Database, store redis.Store) Service {
    return &service{
        sampleQueryBuilder: mongo.NewQueryBuilder[model.Sample](db, model.CollectionName),
        infoSampleCache: redis.NewCache[dto.InfoSample](store),
    }
}

func (s *service) FindSample(id primitive.ObjectID) (*model.Sample, error) {
    filter := bson.M{"_id": id}

    sample, err := s.sampleQueryBuilder.SingleQuery().FindOne(filter, nil)
    if err != nil {
        return nil, err
    }

    return sample, nil
}

func (s *service) CreateSample(dto *dto.CreateSample) (*model.Sample, error) {
    // Business validation
    if err := s.validateCreateSample(dto); err != nil {
        return nil, err
    }

    // Create model
    sample, err := model.NewSample(dto.Field)
    if err != nil {
        return nil, err
    }

    // Insert into MongoDB
    result, err := s.sampleQueryBuilder.SingleQuery().InsertOne(sample)
    if err != nil {
        return nil, err
    }

    // Set the generated ID
    sample.ID = result.InsertedID.(primitive.ObjectID)

    return sample, nil
}
```

### 3. Models

**Location**: `api/[feature]/model/[entity].go`

**Purpose**: Define MongoDB document schemas

**Responsibilities**:
- Represent MongoDB collections and documents
- Define document structure with BSON tags
- Implement validation and indexing
- Provide factory methods for creating documents

**MongoDB Model Pattern**:

```go
type Sample struct {
    ID        primitive.ObjectID `bson:"_id,omitempty" validate:"-"`
    Field     string             `bson:"field" validate:"required"`
    Status    bool               `bson:"status" validate:"required"`
    CreatedAt time.Time          `bson:"createdAt" validate:"required"`
    UpdatedAt time.Time          `bson:"updatedAt" validate:"required"`
}

const CollectionName = "samples"

// Factory method
func NewSample(field string) (*Sample, error) {
    now := time.Now()
    doc := Sample{
        Field:     field,
        Status:    true,
        CreatedAt: now,
        UpdatedAt: now,
    }

    if err := doc.Validate(); err != nil {
        return nil, err
    }

    return &doc, nil
}

// Validation
func (doc *Sample) Validate() error {
    validate := validator.New()
    return validate.Struct(doc)
}

// Indexing
func (*Sample) EnsureIndexes(db mongo.Database) {
    indexes := []mongod.IndexModel{
        {
            Keys: bson.D{
                {Key: "_id", Value: 1},
                {Key: "status", Value: 1},
            },
        },
    }

    mongo.NewQueryBuilder[Sample](db, CollectionName).
        Query(context.Background()).
        CreateIndexes(indexes)
}
```

### 4. DTOs (Data Transfer Objects)

**Location**: `api/[feature]/dto/[operation].go`

**Purpose**: Define request/response schemas for API contracts

**Responsibilities**:
- Input validation with JSON binding tags
- Output formatting for API responses
- Type safety for request/response data
- API contract documentation

**DTO Patterns**:

```go
// Request DTOs
type CreateSample struct {
    Field  string `json:"field" binding:"required" validate:"required,min=1,max=500"`
}

type UpdateSample struct {
    Field  *string `json:"field,omitempty" validate:"omitempty,min=1,max=500"`
    Status *bool   `json:"status,omitempty"`
}

// Response DTOs
type InfoSample struct {
    ID        primitive.ObjectID `json:"_id"`
    Field     string             `json:"field"`
    Status    bool               `json:"status"`
    CreatedAt time.Time          `json:"createdAt"`
    UpdatedAt time.Time          `json:"updatedAt"`
}
```

## MongoDB Integration

### Connection Management

```go
// Database configuration
type MongoConfig struct {
    URI      string
    Database string
    Options  *options.ClientOptions
}

// Connection setup
client, err := mongo.NewClient(options.Client().ApplyURI(config.URI))
if err != nil {
    return err
}

ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

err = client.Connect(ctx)
if err != nil {
    return err
}

db := client.Database(config.Database)
```

### Query Patterns

```go
// Single document queries
filter := bson.M{"_id": id}
sample, err := queryBuilder.SingleQuery().FindOne(filter, nil)

// Multiple document queries
filter := bson.M{"status": true}
samples, err := queryBuilder.Query().Find(filter, &options.FindOptions{
    Sort: bson.M{"createdAt": -1},
    Limit: &limit,
})

// Aggregation pipelines
pipeline := mongo.Pipeline{
    {{"$match", bson.M{"status": true}}},
    {{"$sort", bson.M{"createdAt": -1}}},
    {{"$limit", limit}},
}
results, err := queryBuilder.Aggregation().Aggregate(pipeline, nil)

// Insert operations
result, err := queryBuilder.SingleQuery().InsertOne(document)

// Update operations
filter := bson.M{"_id": id}
update := bson.M{"$set": bson.M{"field": newValue}}
result, err := queryBuilder.SingleQuery().UpdateOne(filter, update)

// Delete operations
filter := bson.M{"_id": id}
result, err := queryBuilder.SingleQuery().DeleteOne(filter)
```

## Caching Strategy

### Redis Integration

```go
// Cache configuration
type service struct {
    sampleQueryBuilder mongo.QueryBuilder[model.Sample]
    infoSampleCache    redis.Cache[dto.InfoSample]
}

// Cache operations
func (s *service) getCachedSample(id primitive.ObjectID) (*dto.InfoSample, error) {
    return s.infoSampleCache.Get(id.Hex())
}

func (s *service) setCachedSample(id primitive.ObjectID, data *dto.InfoSample) error {
    return s.infoSampleCache.Set(id.Hex(), data, time.Hour)
}

func (s *service) invalidateSampleCache(id primitive.ObjectID) error {
    return s.infoSampleCache.Delete(id.Hex())
}
```

## Error Handling

### Structured Error Responses

```go
// Service layer errors
func (s *service) FindSample(id primitive.ObjectID) (*model.Sample, error) {
    filter := bson.M{"_id": id}

    sample, err := s.sampleQueryBuilder.SingleQuery().FindOne(filter, nil)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, network.NewNotFoundError("Sample not found", err)
        }
        return nil, network.NewInternalServerError("Database error", err)
    }

    return sample, nil
}

// Controller error handling
func (c *controller) getSampleHandler(ctx *gin.Context) {
    id, err := network.ReqParams[coredto.MongoId](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, "Invalid ID format", err)
        return
    }

    sample, err := c.service.FindSample(id.ID)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    data, err := utils.MapTo[dto.InfoSample](sample)
    if err != nil {
        network.SendInternalServerError(ctx, "Data mapping error", err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Sample retrieved successfully", data)
}
```

## Testing Architecture

### Unit Tests

```go
func TestSampleService_FindSample(t *testing.T) {
    // Setup
    mockDB := mongo.NewMockDatabase()
    mockStore := redis.NewMockStore()
    service := sample.NewService(mockDB, mockStore)

    // Test
    sample, err := service.FindSample(primitive.NewObjectID())

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, sample)
}
```

### Integration Tests

```go
func TestIntegration_SampleCRUD(t *testing.T) {
    router, module, teardown := startup.TestServer()
    defer teardown()

    // Test data
    sampleData := `{"field": "Test Sample", "status": true}`

    // Create sample
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/sample", strings.NewReader(sampleData))
    req.Header.Set("x-api-key", "test-key")
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)

    // Parse response to get ID
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    data := response["data"].(map[string]interface{})
    id := data["_id"].(string)

    // Get sample
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/sample/id/"+id, nil)
    req.Header.Set("x-api-key", "test-key")
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
}
```

## Code Generation

### API Generation Tool

```bash
go run .tools/apigen.go sample
```

This generates:
- `api/sample/dto/` - Request/response DTOs
- `api/sample/model/sample.go` - MongoDB document model
- `api/sample/controller.go` - HTTP handlers
- `api/sample/service.go` - Business logic
- `api/sample/mock.go` - Test mocks

## Next Steps

- Understand [Core Concepts](/mongo/core-concepts) in depth
- Learn about [Configuration](/mongo/configuration) options
- Explore [API Reference](/mongo/api-reference) for complete documentation