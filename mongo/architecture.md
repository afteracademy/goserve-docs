# Project Architecture

Understanding the goserve MongoDB example API architecture and design patterns.

## Overview

The goserve MongoDB example demonstrates a complete **production-ready REST API** built with the goserve framework using MongoDB as the primary database. It follows a **feature-based modular architecture** where each API endpoint is organized into self-contained modules with clear separation of concerns, JWT authentication, and comprehensive testing.

### Why This Stack

- **Document-first architecture**: Flexible schemas with DTO validation and cache-aside Redis support
- **Same security posture**: API key edge + JWT + roles mirroring the MongoDB example
- **Lean starter**: Minimal surface area to prototype quickly while keeping tests and Docker

### Core Principles

1. **Feature Independence** - Each API feature is isolated in its own directory
2. **Service Sharing** - Common services can be shared across features
3. **Clean Separation** - Controllers, services, models, and DTOs are clearly separated
4. **Testability** - Architecture supports easy unit and integration testing

## API Design

![Request-Response design diagram showing middleware, controller, service, and database flow](/images/request-flow.svg)


## Directory Structure

```
goserve-example-api-server-mongo/
├── Dockerfile                # Production-ready container build
├── docker-compose.yml        # Local development stack
├── go.mod                    # Go module definition
├── go.sum                    # Dependency lockfile
│
├── cmd/                      # Application entry points
│   └── main.go               # Bootstraps the API server
│
├── api/                      # Feature-oriented API modules
│   ├── auth/                 # Authentication & authorization feature
│   │   ├── controller.go     # HTTP handlers (routes)
│   │   ├── controller_test.go
│   │   ├── service.go        # Business logic
│   │   ├── mock.go           # Service mocks for testing
│   │   ├── dto/              # Request/response DTOs
│   │   │   ├── signin_basic.go
│   │   │   ├── signup_basic.go
│   │   │   ├── token_refresh.go
│   │   │   ├── user_auth.go
│   │   │   └── user_tokens.go
│   │   ├── model/            # Domain models (DB schema)
│   │   │   ├── apikey.go
│   │   │   └── keystore.go
│   │   └── middleware/       # Auth-related middleware
│   │       ├── authentication.go
│   │       ├── authorization.go
│   │       ├── keyprotection.go
│   │       └── *_test.go
│   │
│   ├── blog/                 # Blog feature
│   │   ├── controller.go
│   │   ├── service.go
│   │   ├── model/
│   │   │   └── blog.go
│   │   ├── dto/              # Blog DTOs
│   │   │   ├── create_blog.go
│   │   │   ├── update_blog.go
│   │   │   ├── public_blog.go
│   │   │   ├── private_blog.go
│   │   │   └── info_blog.go
│   │   ├── author/           # Nested sub-feature
│   │   │   ├── controller.go
│   │   │   └── service.go
│   │   └── editor/           # Editor-specific logic
│   │       ├── controller.go
│   │       └── service.go
│   │
│   ├── blogs/                # Blog listing / read-only APIs
│   │   ├── controller.go
│   │   ├── service.go
│   │   └── dto/
│   │       ├── item_blog.go
│   │       └── tag.go
│   │
│   ├── user/                 # User management feature
│   │   ├── controller.go
│   │   ├── service.go
│   │   ├── mock.go
│   │   ├── model/
│   │   │   ├── user.go
│   │   │   └── role.go
│   │   └── dto/
│   │       ├── info_public_user.go
│   │       ├── info_private_user.go
│   │       └── info_role.go
│   │
│   ├── contact/              # Contact / messaging feature
│   │   ├── controller.go
│   │   ├── service.go
│   │   ├── model/
│   │   │   └── message.go
│   │   └── dto/
│   │       ├── create_message.go
│   │       └── info_message.go
│   │
│   └── health/               # Health & readiness checks
│       ├── controller.go
│       ├── service.go
│       └── dto/
│           └── health_check.go
│
├── startup/                  # Application initialization
│   ├── server.go             # HTTP server setup
│   ├── module.go             # Dependency wiring (DI)
│   ├── indexes.go            # MongoDB index creation
│   └── testserver.go         # Test server bootstrap
│
├── config/                   # Configuration management
│   └── env.go                # Environment variable parsing
│
├── common/                   # Shared, cross-cutting utilities
│   └── payload.go            # Standard API response payloads
│
├── utils/                    # Reusable helpers
│   ├── convertor.go
│   ├── file.go
│   └── *_test.go
│
├── tests/                    # Integration & end-to-end tests
│   └── auth_integration_test.go
│
├── keys/                     # RSA keys (JWT signing)
│   ├── private.pem
│   ├── public.pem
│   └── info.txt
│
├── .tools/                   # Internal developer tools
│   ├── apigen.go             # API code generator
│   ├── rsa/                  # RSA key generator
│   └── copy/                 # Env file copier
│
└── .extra/                   # Database scripts & documentation
    └── setup/                # MongoDB initialization scripts
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
  ├── Global middleware (logging, error handling)
  ├── Route mounting (/api endpoints)
  └── Server listening on configured port
```

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
```

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
	group.POST("/", c.Authentication(), c.createSampleHandler)
	group.PUT("/id/:id", c.Authentication(), c.updateSampleHandler)
	group.DELETE("/id/:id", c.Authentication(), c.deleteSampleHandler)
	// OR
	private := group.Use(c.Authentication())
	private.POST("/", c.createSampleHandler)
	private.PUT("/id/:id", c.updateSampleHandler)
	private.DELETE("/id/:id", c.deleteSampleHandler)

	protected := group.Use(c.Authentication(), c.Authorization(string(userModel.RoleCodeAuthor)))
	protected.POST("/author-only", c.authorOnlyHandler)
}
```

Here `authProvider network.AuthenticationProvider`, `authorizeProvider network.AuthorizationProvider` are injected dependencies for handling authentication and authorization via `module` wiring. This makes `c.Authentication()` and `c.Authorization()` methods available in the controller. These functions return Gin middleware handlers that enforce JWT auth and role checks. These are implemented in `api/auth/middleware/authentication.go` and `authorization.go`.

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

	msg, err := s.sampleQueryBuilder.SingleQuery().FindOne(filter, nil)
	if err != nil {
		return nil, err
	}

	return msg, nil
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
const CollectionName = "samples"

type Sample struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" validate:"-"`
	Field     string             `bson:"field" validate:"required"`
	Status    bool               `bson:"status" validate:"required"`
	CreatedAt time.Time          `bson:"createdAt" validate:"required"`
	UpdatedAt time.Time          `bson:"updatedAt" validate:"required"`
}

func NewSample(field string) (*Sample, error) {
	time := time.Now()
	doc := Sample{
		Field:     field,
		Status:    true,
		CreatedAt: time,
		UpdatedAt: time,
	}
	if err := doc.Validate(); err != nil {
		return nil, err
	}
	return &doc, nil
}

func (doc *Sample) Validate() error {
	validate := validator.New()
	return validate.Struct(doc)
}

func (*Sample) EnsureIndexes(db mongo.Database) {
	indexes := []mongod.IndexModel{
		{
			Keys: bson.D{
				{Key: "_id", Value: 1},
				{Key: "status", Value: 1},
			},
		},
	}
	
	mongo.NewQueryBuilder[Sample](db, CollectionName).Query(context.Background()).CreateIndexes(indexes)
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
type InfoSample struct {
	ID        primitive.ObjectID `json:"_id" binding:"required"`
	Field     string             `json:"field" binding:"required"`
	CreatedAt time.Time          `json:"createdAt" binding:"required"`
}
```

## MongoDB Integration

### Connection Management

```go
// startup/server.go create function
context := context.Background()

dbConfig := mongo.DbConfig{
	User:        env.DBUser,
	Pwd:         env.DBUserPwd,
	Host:        env.DBHost,
	Port:        env.DBPort,
	Name:        env.DBName,
	MinPoolSize: env.DBMinPoolSize,
	MaxPoolSize: env.DBMaxPoolSize,
	Timeout:     time.Duration(env.DBQueryTimeout) * time.Second,
}

db := mongo.NewDatabase(context, dbConfig)
db.Connect()
```

### Query Patterns

```go
// Single document queries
messageQueryBuilder := mongo.NewQueryBuilder[model.Message](db, model.CollectionName),
filter := bson.M{"_id": id}
msg, err := messageQueryBuilder.SingleQuery().FindOne(filter, nil)
if err != nil {
	return nil, err
}

// Multiple document queries
filter := bson.M{"status": true}
msgs, err := messageQueryBuilder.SingleQuery().FindPaginated(filter, 1, 10, nil)
if err != nil {
	return nil, err
}

// Insert operations
blogQueryBuilder := mongo.NewQueryBuilder[model.Blog](db, model.CollectionName)
blog, err := model.NewBlog(b.Slug, b.Title, b.Description, b.DraftText, b.Tags, author)
if err != nil {
	return nil, err
}

created, err := blogQueryBuilder.SingleQuery().InsertAndRetrieveOne(blog)
if err != nil {
	return nil, err
}

// Update operations
filter := bson.M{"_id": blogId, "author": author.ID, "status": true}
update := bson.M{"$set": bson.M{"status": false, "updatedBy": author.ID, "updatedAt": time.Now()}}
result, err := blogQueryBuilder.SingleQuery().UpdateOne(filter, update)
if err != nil {
	return err
}

if result.MatchedCount == 0 {
	return network.NewNotFoundError("blog not found", nil)
}

// Delete operations
filter := bson.M{"_id": id}
result, err := blogQueryBuilder.SingleQuery().DeleteOne(filter)
```

## Caching Strategy

### Redis Integration

```go
// Cache configuration
type service struct {
	publicBlogCache  redis.Cache[dto.PublicBlog]
	//...
}

func NewService(db mongo.Database, store redis.Store, userService user.Service) Service {
	return &service{
		publicBlogCache:  redis.NewCache[dto.PublicBlog](store),
		// ...
	}
}

func (s *service) SetBlogDtoCacheById(blog *dto.PublicBlog) error {
	key := "blog_" + blog.ID.Hex()
	return s.publicBlogCache.SetJSON(key, blog, time.Duration(10*time.Minute))
}

func (s *service) GetBlogDtoCacheById(id primitive.ObjectID) (*dto.PublicBlog, error) {
	key := "blog_" + id.Hex()
	return s.publicBlogCache.GetJSON(key)
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
		return nil, err
	}

	return sample, nil
}

// Controller error handling
func (c *controller) getSampleHandler(ctx *gin.Context) {
	mongoId, err := network.ReqParams[coredto.MongoId](ctx)
	if err != nil {
		network.SendBadRequestError(ctx, err.Error(), err)
		return
	}

	sample, err := c.service.FindSample(mongoId.ID)
	if err != nil {
		network.SendNotFoundError(ctx, "sample not found", err)
		return
	}

	data, err := utility.MapTo[dto.InfoSample](sample)
	if err != nil {
		network.SendInternalServerError(ctx, "something went wrong", err)
		return
	}

	network.SendSuccessDataResponse(ctx, "success", data)
}
```

## Testing Architecture

### Unit Tests

```go
func TestAuthenticationProvider_NoAccessToken(t *testing.T) {
	mockAuthService := new(auth.MockService)
	mockUserService := new(user.MockService)

	mockAuthService.AssertNotCalled(t, "VerifyToken", mock.Anything)

	rr := network.MockTestAuthenticationProvider(
		t,
		NewAuthenticationProvider(mockAuthService, mockUserService),
		network.MockSuccessMsgHandler("success"),
		nil,
	)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Contains(t, rr.Body.String(), `"message":"permission denied: missing Authorization"`)
	mockAuthService.AssertExpectations(t)
}
```

### Integration Tests

```go
func TestIntegrationAuthController_SignupSuccess(t *testing.T) {
	router, module, shutdown := startup.TestServer()
	defer shutdown()

	apikey, err := module.GetInstance().AuthService.CreateApiKey("test_key", 1, []model.Permission{"test"}, []string{"comment"})
	if err != nil {
		t.Fatalf("could not create apikey: %v", err)
	}

	body := `{"email":"test@abc.com","password":"123456","name":"test name"}`

	req, err := http.NewRequest("POST", "/auth/signup/basic", bytes.NewBuffer([]byte(body)))
	if err != nil {
		t.Fatalf("could not create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(network.ApiKeyHeader, apikey.Key)

	rr := httptest.NewRecorder()
	router.GetEngine().ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), `"message":"success"`)
	assert.Contains(t, rr.Body.String(), `"data"`)
	assert.Contains(t, rr.Body.String(), `"user"`)
	assert.Contains(t, rr.Body.String(), `"roles"`)
	assert.Contains(t, rr.Body.String(), `"tokens"`)

	_, err = module.GetInstance().AuthService.DeleteApiKey(apikey)
	if err != nil {
		t.Fatalf("could not delete apikey: %v", err)
	}

	_, err = module.GetInstance().UserService.DeleteUserByEmail("test@abc.com")
	if err != nil {
		t.Fatalf("could not delete user: %v", err)
	}
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
