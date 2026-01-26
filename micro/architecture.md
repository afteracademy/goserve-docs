---
title: Go Microservices Architecture - gomicro with Kong & NATS
description: Learn gomicro's microservices architecture with Kong API Gateway, NATS messaging, service independence, event-driven communication, and polyglot persistence.
---

# Microservices Project Architecture

Understanding the gomicro microservices architecture and design patterns.

## Overview

gomicro demonstrates a complete microservices implementation using the goserve micro framework. The project breaks down a monolithic blog application into independent services that communicate via NATS messaging, orchestrated through Kong API gateway.

### Core Principles

1. **Service Independence** - Each service runs independently with its own database and cache
2. **API Gateway** - Centralized request routing and authentication through Kong
3. **Event-Driven Communication** - NATS messaging for inter-service communication
4. **Database per Service** - Independent data storage choices (PostgreSQL + MongoDB)
5. **Service Discovery** - Automatic service registration and discovery

## System Architecture

### Without Load Balancing

![System architecture without load balancing](/images/system.png)

### With Load Balancing

![System architecture with load balancing](/images/system-load-balanced.png)

## Deployment Configurations

### Kong API Gateway

**Purpose**: Centralized API management and routing

**Components**:

- **Custom Go Plugin**: API key authentication
- **Request Routing**: Routes to appropriate services
- **Load Balancing**: Distributes requests across service instances

**Configuration**:

```yaml
# kong/kong.yml
_format_version: "2.1"
_transform: true

services:
  - name: auth
    url: http://auth:8000
    routes:
      - name: auth
        paths:
          - /auth
  - name: blog
    url: http://blog:8000
    routes:
      - name: blog
        paths:
          - /blog
plugins:
  - name: apikey-auth-plugin
    config:
      verification_urls:
        - http://auth:8000/verify/apikey
```

### Auth Service

**Technology Stack**:

- **Framework**: goserve micro
- **Database**: PostgreSQL
- **Cache**: Redis
- **Communication**: NATS

**Responsibilities**:

- User authentication (signup/signin)
- JWT token validation
- Role-based authorization
- API key management
- User profile management

### Blog Service

**Technology Stack**:

- **Framework**: goserve micro
- **Database**: MongoDB
- **Cache**: Redis
- **Communication**: NATS

**Responsibilities**:

- Blog CRUD operations
- Author/editor workflows
- Content publishing
- Comment management
- Tag management

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
