# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve MongoDB example.

## Table of Contents

- [Controllers](#controllers)
- [Services](#services)
- [Models](#models)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Middleware](#middleware)
- [Database Operations](#database-operations)
- [Caching](#caching)

---

## Controllers

Controllers are responsible for handling HTTP requests and responses. They define API endpoints and delegate business logic to services.

### Controller Interface

```go
type Controller interface {
    MountRoutes(group *gin.RouterGroup)
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

### Controller Handler Pattern

```go
func (c *controller) createSampleHandler(ctx *gin.Context) {
    // Parse and validate request body
    body, err := network.ReqBody[dto.CreateSample](ctx)
    if err != nil {
        network.SendBadRequestError(ctx, err.Error(), err)
        return
    }

    // Get authenticated user from context
    user := c.GetUser(ctx)
    if user == nil {
        network.SendUnauthorizedError(ctx, "Authentication required", nil)
        return
    }

    // Create sample
    result, err := c.service.CreateSample(body)
    if err != nil {
        network.SendMixedError(ctx, err)
        return
    }

    network.SendSuccessDataResponse(ctx, "Sample created successfully", result)
}
```

---

## Services

Services contain business logic and coordinate between controllers and the database.

### Service Pattern

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
```

### Service Implementation with MongoDB

```go
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

func (s *service) CreateSample(dto *dto.CreateSample) (*model.Sample, error) {
    // Create model
    sample, err := model.NewSample(dto.Field)
    if err != nil {
        return nil, network.NewBadRequestError("Invalid sample data", err)
    }

    // Insert into MongoDB
    result, err := s.sampleQueryBuilder.SingleQuery().InsertOne(sample)
    if err != nil {
        return nil, network.NewInternalServerError("Failed to create sample", err)
    }

    // Set the generated ID
    sample.ID = result.InsertedID.(primitive.ObjectID)

    return sample, nil
}
```

---

## Models

Models represent MongoDB documents and implement the document interface.

### MongoDB Document Model

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

### Document Interface

Models implement the `mongo.Document[T]` interface:

```go
type Document[T any] interface {
    EnsureIndexes(Database)
    GetValue() *T
    Validate() error
}
```

---

## DTOs (Data Transfer Objects)

DTOs define the structure of data transferred between layers.

### Request DTOs

```go
type CreateSample struct {
    Field  string `json:"field" binding:"required" validate:"required,min=1,max=500"`
}

type UpdateSample struct {
    Field  *string `json:"field,omitempty" validate:"omitempty,min=1,max=500"`
    Status *bool   `json:"status,omitempty"`
}

type MongoId struct {
    ID primitive.ObjectID `uri:"id" binding:"required"`
}
```

### Response DTOs

```go
type InfoSample struct {
    ID        primitive.ObjectID `json:"_id"`
    Field     string             `json:"field"`
    Status    bool               `json:"status"`
    CreatedAt time.Time          `json:"createdAt"`
    UpdatedAt time.Time          `json:"updatedAt"`
}
```

---

## Database Operations

### MongoDB Query Patterns

```go
// Single document queries
filter := bson.M{"_id": id}
sample, err := queryBuilder.SingleQuery().FindOne(filter, nil)

// Multiple document queries with options
filter := bson.M{"status": true}
options := &options.FindOptions{
    Sort:  bson.M{"createdAt": -1},
    Limit: &limit,
}
samples, err := queryBuilder.Query().Find(filter, options)

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

### Connection Management

```go
// Database configuration
dbConfig := mongo.DbConfig{
    URI:      env.DB_URI,
    Database: env.DB_NAME,
    Timeout:  30 * time.Second,
}

// Create database connection
db := mongo.NewDatabase(context.Background(), dbConfig)
db.Connect()
defer db.Close()
```

---

## Caching

Redis caching for improved performance.

### Cache Configuration

```go
type service struct {
    db               mongo.Database
    sampleQueryBuilder mongo.QueryBuilder[model.Sample]
    infoSampleCache  redis.Cache[dto.InfoSample]
}

func NewService(db mongo.Database, store redis.Store) Service {
    return &service{
        db:               db,
        sampleQueryBuilder: mongo.NewQueryBuilder[model.Sample](db, model.CollectionName),
        infoSampleCache:  redis.NewCache[dto.InfoSample](store),
    }
}
```

### Cache Operations

```go
// Get from cache
cached, err := s.infoSampleCache.Get(sampleID.Hex())
if err == nil && cached != nil {
    return cached, nil
}

// Set cache
err = s.infoSampleCache.Set(sampleID.Hex(), sampleData, time.Hour)

// Delete from cache
err = s.infoSampleCache.Delete(sampleID.Hex())
```

### Cache-Aside Pattern

```go
func (s *service) GetSampleByID(id primitive.ObjectID) (*dto.InfoSample, error) {
    // Try cache first
    cached, err := s.infoSampleCache.Get(id.Hex())
    if err == nil && cached != nil {
        return cached, nil
    }

    // Cache miss - query database
    sample, err := s.FindSample(id)
    if err != nil {
        return nil, err
    }

    // Convert to DTO and cache
    dto := s.convertToDTO(sample)
    s.infoSampleCache.Set(id.Hex(), dto, time.Hour)

    return dto, nil
}
```

---

## Best Practices

### MongoDB Best Practices

1. **Use ObjectIDs** - MongoDB's ObjectID for document identification
2. **Implement Validation** - Validate documents before insertion
3. **Create Indexes** - Index frequently queried fields
4. **Use Aggregation** - For complex queries and data processing
5. **Handle Errors** - Proper error handling for MongoDB operations

### Service Layer Best Practices

1. **Business Logic Only** - Keep services focused on business rules
2. **Error Handling** - Use structured errors with proper HTTP status codes
3. **Caching Strategy** - Implement cache-aside pattern appropriately
4. **Transaction Management** - Use MongoDB transactions when needed

### API Design Best Practices

1. **RESTful Endpoints** - Use proper HTTP methods and resource naming
2. **Consistent Responses** - Use goserve's response helpers
3. **Input Validation** - Validate requests at controller level
4. **Authentication** - Protect sensitive endpoints with JWT

## Next Steps

- See [Architecture](/mongo/architecture) for detailed project structure
- Check [Configuration](/mongo/configuration) for environment setup
- Review [API Reference](/mongo/api-reference) for endpoint documentation