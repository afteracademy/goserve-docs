# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve MongoDB example.

## Table of Contents

- [Request](#request)
- [Payload](#payload)
- [Response](#response)
- [Controllers](#controllers)
- [Services](#services)
- [Models](#models)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Middleware](#middleware)
- [Config](#config)
- [Module](#module)
- [Routes](#routes)
- [Startup](#startup)
- [Database Operations](#database-operations)
- [Caching](#caching)
- [Docker](#docker)

## Request
Requests are handled using goserve's network utilities for extracting parameters, query strings, and request bodies.

```go
// Example: Extracting path parameter "id"
mongoId, err := network.ReqParams[coredto.MongoId](ctx)

// Example: Extracting JSON request body
body, err := network.ReqBody[dto.CreateBlog](ctx)

pagination, err := network.ReqQuery[coredto.Pagination](ctx)
```

The framework provides a few built-in validation for request DTOs using `coredto` package.
```go
// blog/id/:id
type MongoId struct {
	Id string             `uri:"id" binding:"required" validate:"required,len=24"`
	ID primitive.ObjectID `uri:"-" validate:"-"`
}

func (d *MongoId) GetValue() *MongoId {
	id, err := mongo.NewObjectID(d.Id)
	if err == nil {
		d.ID = id
	}
	return d
}

// blogs/latest?page=1&limit=10
type Pagination struct {
	Page  int64 `form:"page" binding:"required" validate:"required,min=1,max=1000"`
	Limit int64 `form:"limit" binding:"required" validate:"required,min=1,max=1000"`
}

// blog/slug/:slug
type Slug struct {
	Slug string `uri:"slug" validate:"required,min=3,max=200"`
}
```

## Payload
The payload is a context wrapper that helps store and retrieve request-scoped data such as the authenticated user and API key.
```go
// common/payload.go
const (
	payloadApiKey   string = "apikey"
	payloadUser     string = "user"
	payloadKeystore string = "keystore"
)

type ContextPayload interface {
	SetApiKey(ctx *gin.Context, value *authModel.ApiKey)
	MustGetApiKey(ctx *gin.Context) *authModel.ApiKey
	SetUser(ctx *gin.Context, value *userModel.User)
	MustGetUser(ctx *gin.Context) *userModel.User
	SetKeystore(ctx *gin.Context, value *authModel.Keystore)
	MustGetKeystore(ctx *gin.Context) *authModel.Keystore
}

type payload struct{}

func NewContextPayload() ContextPayload {
	return &payload{}
}

func (u *payload) SetApiKey(ctx *gin.Context, value *authModel.ApiKey) {
	ctx.Set(payloadApiKey, value)
}

func (u *payload) MustGetApiKey(ctx *gin.Context) *authModel.ApiKey {
	value, ok := ctx.MustGet(payloadApiKey).(*authModel.ApiKey)
	if !ok {
		panic(errors.New(payloadApiKey + " missing in context"))
	}
	return value
}

func (u *payload) SetUser(ctx *gin.Context, value *userModel.User) {
	ctx.Set(payloadUser, value)
}

func (u *payload) MustGetUser(ctx *gin.Context) *userModel.User {
	value, ok := ctx.MustGet(payloadUser).(*userModel.User)
	if !ok {
		panic(errors.New(payloadUser + " missing for context"))
	}
	return value
}

func (u *payload) SetKeystore(ctx *gin.Context, value *authModel.Keystore) {
	ctx.Set(payloadKeystore, value)
}

func (u *payload) MustGetKeystore(ctx *gin.Context) *authModel.Keystore {
	value, ok := ctx.MustGet(payloadKeystore).(*authModel.Keystore)
	if !ok {
		panic(errors.New(payloadKeystore + " missing for context"))
	}
	return value
}

```
These are used in middlewares and controllers to set and get the API key, user, and keystore associated with the request.

**Example**
```go
func (c *controller) postBlogHandler(ctx *gin.Context) {
	body, err := network.ReqBody[dto.CreateBlog](ctx)
	if err != nil {
		network.SendBadRequestError(ctx, err.Error(), err)
		return
	}

	// Get the authenticated user from the context set by the authentication middleware
	user := c.MustGetUser(ctx)

	b, err := c.service.CreateBlog(body, user)
	if err != nil {
		network.SendMixedError(ctx, err)
		return
	}

	network.SendSuccessDataResponse(ctx, "blog created successfully", b)
}
```

## Response
Responses are sent using goserve's network package for consistent formatting. 

**Response Structure**
```go
type ResCode string

const (
	success_code ResCode = "10000"
	failue_code  ResCode = "10001"
)

type response[T any] struct {
	ResCode ResCode `json:"code" binding:"required"`
	Status  int     `json:"status" binding:"required"`
	Message string  `json:"message" binding:"required"`
	Data    *T      `json:"data,omitempty" binding:"required,omitempty"`
}
```

Helper functions to send responses are defined in the network package:
```go
// Send success response with data
func SendSuccessDataResponse[T any](ctx *gin.Context, message string, data T)
// Send bad request error response
func SendBadRequestError(ctx *gin.Context, message string, err error)
// Send not found error response
func SendNotFoundError(ctx *gin.Context, message string, err error)
// Send internal server error response
func SendInternalServerError(ctx *gin.Context, message string, err error)
// Send unauthorized error response
func SendUnauthorizedError(ctx *gin.Context, message string, err error)
// Send forbidden error response
func SendForbiddenError(ctx *gin.Context, message string, err error)	
// Send mixed error response based on error type
func SendMixedError(ctx *gin.Context, err error)
```


## Controllers

Controllers are responsible for handling HTTP requests and responses. They define API endpoints and delegate business logic to services.

### Controller Interface

```go
type Controller interface {
	Path() string
	Authentication() gin.HandlerFunc
	Authorization(role string) gin.HandlerFunc
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
	authMFunc network.AuthenticationProvider,
	authorizeMFunc network.AuthorizationProvider,
	service Service,
) network.Controller {
	return &controller{
		Controller: network.NewController("/sample", authMFunc, authorizeMFunc),
		ContextPayload: common.NewContextPayload(),
		service:  service,
	}
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
	group.GET("/id/:id", c.getSampleHandler)
}

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

## Services

Services contain business logic and coordinate between controllers and the database.

### Service Pattern

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

## Models

Models represent MongoDB documents and implement the document interface.

### Document Interface

Models implement the `mongo.Document[T]` interface:

```go
type Document[T any] interface {
    EnsureIndexes(Database)
}
```

### MongoDB Document Model

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

## DTOs (Data Transfer Objects)

DTOs define the structure of data transferred between layers. DTO can be created by implementing the `Dto[T]` or `DtoV[T]` interfaces or plain structs.

```go
type Dto[T any] interface {
	GetValue() *T
}

type DtoV[T any] interface {
	Dto[T]
	ValidateErrors(errs validator.ValidationErrors) ([]string, error)
}
```

### Request/Response DTOs
Most often, plain structs are sufficient, since the validations are handled by the architecture out of the box. But for more complex cases, you can implement your own interfaces to ValidateErrors.

**Example:**

```go
type InfoSample struct {
	ID        primitive.ObjectID `json:"_id" binding:"required"`
	Field     string             `json:"field" binding:"required"`
	CreatedAt time.Time          `json:"createdAt" binding:"required"`
}
```

Note: The response DTOs are also validated using the `binding` tags.

## Middleware
Middleware functions are used for authentication, authorization, logging, etc. They can be defined and applied at the controller or route level. There are predefined interfaces for middleware in goserve:
```go
type RootMiddleware interface {
	Attach(engine *gin.Engine)
	Handler(ctx *gin.Context)
}

type Param0MiddlewareProvider interface {
	Middleware() gin.HandlerFunc
}

type Param1MiddlewareProvider[T any] interface {
	Middleware(param1 T) gin.HandlerFunc
}

type Param2MiddlewareProvider[T any, V any] interface {
	Middleware(param1 T, param2 V) gin.HandlerFunc
}

type Param3MiddlewareProvider[T any, V any, W any] interface {
	Middleware(param1 T, param2 V, param3 W) gin.HandlerFunc
}

type ParamNMiddlewareProvider[T any] interface {
	Middleware(params ...T) gin.HandlerFunc
}
```

### Root Middlewares
They are applied globally for all routes.

#### keyProtection
This middleware checks for the presence and validity of the `x-api-key` header in incoming requests.

```go
// api/auth/middleware/keyprotection.go

type keyProtection struct {
	common.ContextPayload
	authService auth.Service
}

func NewKeyProtection(authService auth.Service) network.RootMiddleware {
	return &keyProtection{
		ContextPayload: common.NewContextPayload(),
		authService:    authService,
	}
}

func (m *keyProtection) Attach(engine *gin.Engine) {
	engine.Use(m.Handler)
}

func (m *keyProtection) Handler(ctx *gin.Context) {
	key := ctx.GetHeader(network.ApiKeyHeader)
	if len(key) == 0 {
		network.SendUnauthorizedError(ctx, "permission denied: missing x-api-key header", nil)
		return
	}

	apikey, err := m.authService.FindApiKey(key)
	if err != nil {
		network.SendForbiddenError(ctx, "permission denied: invalid x-api-key", err)
		return
	}

	m.SetApiKey(ctx, apikey)

	ctx.Next()
}
```

#### Authentication Middleware
This middleware validates JWT tokens in the `Authorization` header.
```go
type authenticationProvider struct {
	common.ContextPayload
	authService auth.Service
	userService user.Service
}

func NewAuthenticationProvider(authService auth.Service, userService user.Service) network.AuthenticationProvider {
	return &authenticationProvider{
		ContextPayload: common.NewContextPayload(),
		authService:    authService,
		userService:    userService,
	}
}

func (m *authenticationProvider) Middleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader(network.AuthorizationHeader)
		if len(authHeader) == 0 {
			network.SendUnauthorizedError(ctx, "permission denied: missing Authorization", nil)
			return
		}

		token := utils.ExtractBearerToken(authHeader)
		if token == "" {
			network.SendUnauthorizedError(ctx, "permission denied: invalid Authorization", nil)
			return
		}

		claims, err := m.authService.VerifyToken(token)
		if err != nil {
			network.SendUnauthorizedError(ctx, err.Error(), err)
			return
		}

		valid := m.authService.ValidateClaims(claims)
		if !valid {
			network.SendUnauthorizedError(ctx, "permission denied: invalid claims", nil)
			return
		}

		userId, err := mongo.NewObjectID(claims.Subject)
		if err != nil {
			network.SendUnauthorizedError(ctx, "permission denied: invalid claims subject", nil)
			return
		}

		user, err := m.userService.FindUserById(userId)
		if err != nil {
			network.SendUnauthorizedError(ctx, "permission denied: claims subject does not exists", err)
			return
		}

		keystore, err := m.authService.FindKeystore(user, claims.ID)
		if err != nil || keystore == nil {
			network.SendUnauthorizedError(ctx, "permission denied: invalid access token", err)
			return
		}

		m.SetUser(ctx, user)
		m.SetKeystore(ctx, keystore)

		ctx.Next()
	}
}
```

#### Authorization Middleware
This middleware checks if the authenticated user has the required role to access the endpoint.
```go
type authorizationProvider struct {
	common.ContextPayload
}

func NewAuthorizationProvider() network.AuthorizationProvider {
	return &authorizationProvider{
		ContextPayload: common.NewContextPayload(),
	}
}

func (m *authorizationProvider) Middleware(roleNames ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if len(roleNames) == 0 {
			network.SendForbiddenError(ctx, "permission denied: role missing", nil)
			return
		}

		user := m.MustGetUser(ctx)

		hasRole := false
		for _, code := range roleNames {
			for _, role := range user.RoleDocs {
				if role.Code == model.RoleCode(code) {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			network.SendForbiddenError(ctx, "permission denied: does not have suffient role", nil)
			return
		}

		ctx.Next()
	}
}
```

## Database Operations

### MongoDB Query Patterns

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

shutdown := func() {
	db.Disconnect()
	//...
}
```

## Caching

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