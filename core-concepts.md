# Core Concepts

This guide covers the fundamental concepts and patterns used in the goserve framework. It is intended for developers who want to understand how to build scalable and maintainable web applications using goserve.

## DTOs (Data Transfer Objects)

Predefined DTOs to standardize data handling across your application.

`package coredto`

### MongoId

A DTO for handling MongoDB ObjectIDs in URI parameters.

```go
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
```

### Pagination

A DTO for handling pagination parameters in API requests.

```go
type Pagination struct {
	Page  int64 `form:"page" binding:"required" validate:"required,min=1,max=1000"`
	Limit int64 `form:"limit" binding:"required" validate:"required,min=1,max=1000"`
}
```

### Slug

A DTO for handling slug parameters in URI.

```go
type Slug struct {
	Slug string `uri:"slug" validate:"required,min=3,max=200"`
}
```

### UUID

A DTO for handling UUID parameters in URI.

```go
type UUID struct {
	Id string    `uri:"id" binding:"required" validate:"required,uuid"`
	ID uuid.UUID `uri:"-" validate:"-"`
}

func (d *UUID) GetValue() *UUID {
	id, err := uuid.Parse(d.Id)
	if err == nil {
		d.ID = id
	}
	return d
}
```

## Using Request DTOs

You can use these DTOs in your route handlers to easily bind and validate incoming request parameters. For example:

```go
// Example: Extracting path parameter "id"
uuidParam, err := network.ReqParams[coredto.UUID](ctx)

// Example: Extracting path parameter "id"
mongoId, err := network.ReqParams[coredto.MongoId](ctx)

// Example: Extracting path parameter "slug"
slugParam, err := network.ReqParams[coredto.Slug](ctx)

// Example: Extracting query parameters for pagination
pagination, err := network.ReqQuery[coredto.Pagination](ctx)
```

## API DTOs

You can define your own DTOs in a similar manner to standardize data handling in your application. DTO can be created by implementing the `Dto[T]` or `DtoV[T]` interfaces or just plain structs.

```go
type Dto[T any] interface {
	GetValue() *T
}

type DtoV[T any] interface {
	Dto[T]
	ValidateErrors(errs validator.ValidationErrors) ([]string, error)
}
```

Example:

```go
type CreateBlog struct {
	Title       string `json:"title" binding:"required" validate:"required,min=3,max=200"`
	Description string `json:"description" binding:"required" validate:"required,min=10,max=500"`
	Body        string `json:"body" binding:"required" validate:"required,min=100"`
}
```

If you need custom validation error handling, implement the `DtoV[T]` interface:

```go
func (d *Pagination) ValidateErrors(errs validator.ValidationErrors) ([]string, error) {
	var msgs []string
	for _, err := range errs {
		switch err.Tag() {
		case "required":
			msgs = append(msgs, fmt.Sprintf("%s is required", err.Field()))
		case "min":
			msgs = append(msgs, fmt.Sprintf("%s must be min %s", err.Field(), err.Param()))
		case "max":
			msgs = append(msgs, fmt.Sprintf("%s must be max%s", err.Field(), err.Param()))
		default:
			msgs = append(msgs, fmt.Sprintf("%s is invalid", err.Field()))
		}
	}
	return msgs, nil
}
```

## Request

Helper functions to extract and validate request parameters. These functions automatically bind and validate the request data against the provided DTOs, returning errors if validation fails.

`package network`

```go
// Example: Extracting JSON request body
body, err := network.ReqBody[dto.CreateBlog](ctx)
// Example: Extracting query parameters for pagination
pagination, err := network.ReqQuery[coredto.Pagination](ctx)
// Example: Extracting path parameter "id"
uuidParam, err := network.ReqParams[coredto.UUID](ctx)
// Example: Extracting path parameter "slug"
slugParam, err := network.ReqParams[coredto.Slug](ctx)
// Example: Extracting header parameter "some-header"
someHeader, err := network.ReqHeader[dtos.SomeHeader](ctx, "some-header")
```

## Response

Standardized API response structure and helper functions to send responses.

`package network`

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

### Error Handling Middleware

The framework includes a global error catcher middleware to handle panics and send structured error responses.

```go
type errorCatcher struct {
}

func NewErrorCatcher() network.RootMiddleware {
	return &errorCatcher{}
}

func (m *errorCatcher) Attach(engine *gin.Engine) {
	engine.Use(m.Handler)
}

func (m *errorCatcher) Handler(ctx *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			if err, ok := r.(error); ok {
				network.SendInternalServerError(ctx, err.Error(), err)
			} else {
				network.SendInternalServerError(ctx, "something went wrong", nil)
			}
			ctx.Abort()
		}
	}()
	ctx.Next()
}
```

### Notfound Middleware

This middleware handles 404 Not Found errors for unmatched routes.

```go
type notFound struct {
}

func NewNotFound() network.RootMiddleware {
	return &notFound{}
}

func (m *notFound) Attach(engine *gin.Engine) {
	engine.NoRoute(m.Handler)
}

func (m *notFound) Handler(ctx *gin.Context) {
	network.SendNotFoundError(ctx, "url not found", nil)
}
```

## Providers

Providers are specialized middleware for providing authentication and authorization handlers.

```go
type AuthenticationProvider Param0MiddlewareProvider
type AuthorizationProvider ParamNMiddlewareProvider[string]
```

#### Authentication Provider

You can implement this middleware to validates tokens in the `Authorization` header.

```go
type authenticationProvider struct {
	// dependencies
}

func NewAuthenticationProvider(/*dependencies*/) network.AuthenticationProvider {
	return &authenticationProvider{
		// initialize dependencies
	}
}

func (m *authenticationProvider) Middleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// implement token validation logic here
		ctx.Next()
	}
}
```

#### Authorization Provider

You can implement this middleware to check if the authenticated user has the required roles.

```go
type authorizationProvider struct {
	// dependencies
}

func NewAuthorizationProvider() network.AuthorizationProvider {
	return &authorizationProvider{
		// initialize dependencies
	}
}

func (m *authorizationProvider) Middleware(roleNames ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// implement role checking logic here
		ctx.Next()
	}
}
```

## Controllers

Controllers group related routes and handlers together for better organization.

`package network`

```go
type Controller interface {
	Path() string
	Authentication() gin.HandlerFunc
	Authorization(role string) gin.HandlerFunc
	MountRoutes(group *gin.RouterGroup)
}
```

You can create controllers by implementing the `Controller` interface:

```go
type controller struct {
	network.Controller
	// dependencies
}

func NewController(
	authProvider network.AuthenticationProvider, // provide authentication middleware
	authorizeProvider network.AuthorizationProvider, // provide authorization middleware
	// other dependencies
) network.Controller {
	return &controller{
		Controller: network.NewController("/auth", authProvider, authorizeProvider),
		// initialize other dependencies
	}
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
	group.GET("/endpoint-1", c.endpoint1Handler)
	group.GET("/endpoint-2", c.Authentication(), c.endpoint2Handler)
	group.GET("/endpoint-3", c.Authentication(), c.Authorization("role1", "role2"), c.endpoint3Handler)
	// other routes
}

func (c *controller) endpoint1Handler(ctx *gin.Context) {
	// handler implementation
}

// other handler implementations
```

## Service

Services encapsulate business logic and interact with data sources. You can define services as structs with methods for various operations.

Example:

```go
type Service interface {
	SaveMessage(d *dto.CreateMessage) (*model.Message, error)
	FindMessage(id primitive.ObjectID) (*model.Message, error)
	FindPaginatedMessage(p *coredto.Pagination) ([]*model.Message, error)
}

type service struct {
	messageQueryBuilder mongo.QueryBuilder[model.Message]
}

func NewService(db mongo.Database) Service {
	return &service{
		messageQueryBuilder: mongo.NewQueryBuilder[model.Message](db, model.CollectionName),
	}
}

func (s *service) SaveMessage(d *dto.CreateMessage) (*model.Message, error) {
	msg, err := model.NewMessage(d.Type, d.Msg)
	if err != nil {
		return nil, err
	}

	result, err := s.messageQueryBuilder.SingleQuery().InsertAndRetrieveOne(msg)
	if err != nil {
		return nil, err
	}

	return result, nil
}
```

## Module

Modules initialize and wire up related controllers, services, and data sources. You can define your modules by implementing the `Module` interface.

`package network`

```go
type BaseModule[T any] interface {
	GetInstance() *T
	RootMiddlewares() []RootMiddleware
	AuthenticationProvider() AuthenticationProvider
	AuthorizationProvider() AuthorizationProvider
}

type Module[T any] interface {
	BaseModule[T]
	Controllers() []Controller
}

type Module network.Module[module] // your module struct
```

## Router

Router sets up the Gin engine, applies global middlewares, and mounts modules.

`package network`

```go
type BaseRouter interface {
	GetEngine() *gin.Engine
	RegisterValidationParsers(tagNameFunc validator.TagNameFunc)
	LoadRootMiddlewares(middlewares []RootMiddleware)
	Start(ip string, port uint16)
}

type Router interface {
	BaseRouter
	LoadControllers(controllers []Controller)
}
```

You can use the framework Router to set up your application:

```go
router := network.NewRouter(env.GoMode)
router.RegisterValidationParsers(network.CustomTagNameFunc())
router.LoadControllers(module.GetInstance().OpenControllers())
router.LoadRootMiddlewares(module.RootMiddlewares())
router.LoadControllers(module.Controllers())
```

## Redis Caching

goserve provides built-in support for Redis caching to improve application performance. You can easily set up and use Redis in your services.

`package redis`

### Store

```go
type Config struct {
	Host string
	Port uint16
	Pwd  string
	DB   int
}

type Store interface {
	GetInstance() *store
	Connect()
	Disconnect()
}
```

Connect to Redis server and manage the connection lifecycle.

```go
redisConfig := redis.Config{
	Host: // Redis host,
	Port: // Redis port,
	Pwd:  // Redis password,
	DB:   // Redis database number,
}

store := redis.NewStore(context, &redisConfig)
store.Connect()
defer store.Disconnect()
```

### Cache

```go
type Cache[T any] interface {
	SetJSON(key string, value *T, expiration time.Duration) error
	GetJSON(key string) (*T, error)
	SetJSONList(key string, values []*T, expiration time.Duration) error
	GetJSONList(key string) ([]*T, error)
}
```

Use the Cache interface to store and retrieve JSON-serializable data.

```go
publicBlogCache: redis.NewCache[dto.BlogPublic](store),
key := "blog_" + blog.ID.String()

// Storing in cache
publicBlogCache.SetJSON(key, blog, time.Duration(10*time.Minute))

// Retrieving from cache
publicBlogCache.GetJSON(key)
```

## Postgres

Wrapper to pgx with connection pooling and query helpers.

`package postgres`

```go
type DbConfig struct {
	User        string
	Pwd         string
	Host        string
	Port        uint16
	Name        string
	MinPoolSize uint16
	MaxPoolSize uint16
	Timeout     time.Duration
	SSLMode     string
}

type Database interface {
	GetInstance() *database
	Connect()
	Disconnect()
	Pool() *pgxpool.Pool
}
```

Connect to PostgreSQL database with connection pooling.

```go
context := context.Background()

dbConfig := postgres.DbConfig{
	User:        env.DBUser,
	Pwd:         env.DBUserPwd,
	Host:        env.DBHost,
	Port:        env.DBPort,
	Name:        env.DBName,
	MinPoolSize: env.DBMinPoolSize,
	MaxPoolSize: env.DBMaxPoolSize,
	Timeout:     time.Duration(env.DBQueryTimeout) * time.Second,
}

db := postgres.NewDatabase(context, dbConfig)
db.Connect()
defer db.Disconnect()
```

Use the connection pool for executing queries.

```go
// db postgres.Database
ctx := context.Background()
msg := model.Message{}

query := `
	INSERT INTO messages (
		type,
		msg
	)
	VALUES ($1, $2)
	RETURNING
		id,
		type,
		msg,
		status,
		created_at,
		updated_at
`

err := db.Pool().QueryRow(
	ctx,
	query,
	dto.Type,
	dto.Msg,
).Scan(
	&msg.ID,
	&msg.Type,
	&msg.Msg,
	&msg.Status,
	&msg.CreatedAt,
	&msg.UpdatedAt,
)
```

## Mongo

Wrapper to official MongoDB Go driver with connection management.

`package mongo`

```go
type DbConfig struct {
	User        string
	Pwd         string
	Host        string
	Port        uint16
	Name        string
	MinPoolSize uint16
	MaxPoolSize uint16
	Timeout     time.Duration
}

type Document[T any] interface {
	EnsureIndexes(Database)
}

type Database interface {
	GetInstance() *database
	Connect()
	Disconnect()
}
```

Connect to MongoDB database with connection management.

```go
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
defer db.Disconnect()

if env.GoMode != gin.TestMode {
	EnsureDbIndexes(db)
}
```

### Query

Query interface with common CRUD operations. Framework provides generic implementations for collections to simplify data access.

```go
type Query[T any] interface {
	Close()
	CreateIndexes(indexes []mongo.IndexModel) error
	FindOne(filter bson.M, opts *options.FindOneOptions) (*T, error)
	FindAll(filter bson.M, opts *options.FindOptions) ([]*T, error)
	FindPaginated(filter bson.M, page int64, limit int64, opts *options.FindOptions) ([]*T, error)
	InsertOne(doc *T) (*primitive.ObjectID, error)
	InsertAndRetrieveOne(doc *T) (*T, error)
	InsertMany(doc []*T) ([]primitive.ObjectID, error)
	InsertAndRetrieveMany(doc []*T) ([]*T, error)
	UpdateOne(filter bson.M, update bson.M) (*mongo.UpdateResult, error)
	UpdateMany(filter bson.M, update bson.M) (*mongo.UpdateResult, error)
	DeleteOne(filter bson.M) (*mongo.DeleteResult, error)
}
```

#### QueryBuilder

Helper to create query instances for collections.

```go
type QueryBuilder[T any] interface {
	GetCollection() *mongo.Collection
	SingleQuery() Query[T]
	Query(context context.Context) Query[T]
}
```

Use the QueryBuilder to perform CRUD operations on a collection.

```go
messageQueryBuilder := mongo.NewQueryBuilder[model.Message](db, model.CollectionName),
result, err := messageQueryBuilder.SingleQuery().InsertAndRetrieveOne(msg)
```

## Microservices

goserve provides built-in support for building microservices using NATS as the messaging system.

`package micro` provides the necessary abstractions and helpers to create microservices that can communicate with each other using NATS. It includes modified versions of Controller and Router to facilitate microservice development. Most of the concepts from the main framework apply here as well.

## NATS Server Client

```go
type Config struct {
	NatsUrl            string
	NatsServiceName    string
	NatsServiceVersion string
	Timeout            time.Duration
}

type NatsClient interface {
	GetInstance() *natsClient
	Disconnect()
}
```

You can connect to a NATS server and manage the connection lifecycle.

```go
natsConfig := micro.Config{
	NatsUrl:            env.NatsUrl,
	NatsServiceName:    env.NatsServiceName,
	NatsServiceVersion: env.NatsServiceVersion,
	Timeout:            time.Duration(env.NatsTimeoutSec) * time.Second,
}

natsClient := micro.NewNatsClient(&natsConfig)
defer natsClient.Disconnect()
```

## NATS Message

Define NATS message structures as DTOs.

```go
type Text struct {
	Value string `json:"value" validate:"required"`
}

func NewText(value string) *Text {
	return &Text{
		Value: value,
	}
}

```

You can parse NATS messages using helper functions.

```go
// req micro.NatsRequest
text, err := micro.JsonToMsg[message.Text](req.Data())
```

## NATS Request
You can ask NATS for a response using services.

The framwork provides helper functions to send NATS requests and receive responses.

```go
// S - Sent message type
// R - Received message type
func RequestNats[S any, R any](client NatsClient, subject string, sData *S) (*R, error) 

// S - Sent message type
// R - Received message type
// Returns both the response data and the raw NATS message
func RequestNatsRaw[S any, R any](client NatsClient, subject string, sData *S) (*R, *nats.Msg, error)
```

Example usage in a service:
```go
// Framework creates NATS topic based on controller [path].[AddEndpoint name]
const NATS_TOPIC_AUTH = "auth.authentication" 

type Service interface {
	Authenticate(token string) (*message.User, error)
	// other methods
}

type service struct {
	natsClient micro.NatsClient
}

func NewService(natsClient micro.NatsClient) Service {
	return &service{
		natsClient: natsClient,
	}
}

func (s *service) Authenticate(token string) (*message.User, error) {
	msg := message.NewText(token)
	// Send NATS request and receive response in blocking manner
	return micro.RequestNats[message.Text, message.User](s.natsClient, NATS_TOPIC_AUTH, msg)
}

// other methods

```

## NATS Response

Helper functions to send NATS responses.

```go
// Send message response
func RespondNatsMessage[T any](req NatsRequest, data *T)
// Send error response
func RespondNatsError(req NatsRequest, err error)
```

The controllers AddEndpoint method allows you to register NATS endpoints and their handlers.

```go
func (c *controller) MountNats(group micro.NatsGroup) {
	group.AddEndpoint("authentication", micro.NatsHandlerFunc(c.authenticationHandler))
	// other endpoints
}

func (c *controller) authenticationHandler(req micro.NatsRequest) {
	text, err := micro.JsonToMsg[message.Text](req.Data())
	if err != nil {
		micro.RespondNatsError(req, err)
		return
	}

	user, _, err := c.service.Authenticate(text.Value)
	if err != nil {
		micro.RespondNatsError(req, err)
		return
	}

	micro.RespondNatsMessage(req, message.NewUser(user))
}
```

## Microservice Controller

It extends the base Controller interface to include NATS group mounting.

```go
type Controller interface {
	network.Controller
	MountNats(group NatsGroup)
}
```

You can create microservice controllers by implementing the Microservice Controller interface:

```go
type controller struct {
	micro.Controller
	// dependencies
}

func NewController(
	authProvider network.AuthenticationProvider,
	authorizeProvider network.AuthorizationProvider,
	// other dependencies
) micro.Controller {
	return &controller{
		Controller: micro.NewController("/", authProvider, authorizeProvider),
		// initialize other dependencies
	}
}

func (c *controller) MountNats(group micro.NatsGroup) {
	group.AddEndpoint("authentication", micro.NatsHandlerFunc(c.authenticationHandler))
	group.AddEndpoint("authorization", micro.NatsHandlerFunc(c.authorizationHandler))
}

func (c *controller) authenticationHandler(req micro.NatsRequest) {
	// handler implementation
}

func (c *controller) authorizationHandler(req micro.NatsRequest) {
	// handler implementation
}

func (c *controller) MountRoutes(group *gin.RouterGroup) {
	group.GET("/verify/apikey", c.verifyApikeyHandler)
	group.DELETE("/signout", c.Authentication(), c.signOutBasic)
	// other routes
}

func (c *controller) verifyApikeyHandler(ctx *gin.Context) {
	// handler implementation
}
```

## Microservice Module
It is very similar to the network Module interface but for microservices micro Controllers are used instead of network Controllers.

```go
type Module[T any] interface {
	network.BaseModule[T]
	Controllers() []Controller
}
```

## Microservice Router
It extends the base Router interface to include NATS client management and microservice controller loading.

```go
type Router interface {
	network.BaseRouter
	NatsClient() NatsClient
	LoadControllers(controllers []Controller)
}
```
