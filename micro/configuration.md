# Configuration

Configure the gomicro microservices project components.

## Overview

gomicro uses a distributed configuration approach where each service has its own environment variables while sharing common infrastructure settings.

## Environment Variables

### Global Configuration

```bash
# ===========================================
# INFRASTRUCTURE CONFIGURATION
# ===========================================
GO_ENV=development
LOG_LEVEL=info

# ===========================================
# JWT CONFIGURATION (Shared)
# ===========================================
JWT_SECRET_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_HOURS=24
```

### Kong API Gateway

```bash
# ===========================================
# KONG CONFIGURATION
# ===========================================
KONG_ADMIN_PORT=8000
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/kong/kong.yml
KONG_PLUGINSERVER_AUTH_PLUGIN=/kong/plugins/apikey-auth
```

### NATS Messaging

```bash
# ===========================================
# NATS CONFIGURATION
# ===========================================
NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=gomicro
```

## Auth Service Configuration

### Database (PostgreSQL)

```bash
# ===========================================
# AUTH SERVICE - DATABASE
# ===========================================
AUTH_DB_HOST=postgres
AUTH_DB_PORT=5432
AUTH_DB_NAME=gomicro
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=password
AUTH_DB_SSL_MODE=disable
AUTH_DB_MAX_CONNECTIONS=25
AUTH_DB_MAX_IDLE_CONNECTIONS=5
```

### Redis Cache

```bash
# ===========================================
# AUTH SERVICE - REDIS
# ===========================================
AUTH_REDIS_HOST=redis
AUTH_REDIS_PORT=6379
AUTH_REDIS_PASSWORD=
AUTH_REDIS_DB=0
AUTH_REDIS_POOL_SIZE=10
```

### Service Settings

```bash
# ===========================================
# AUTH SERVICE - GENERAL
# ===========================================
AUTH_SERVICE_PORT=8001
AUTH_SERVICE_HOST=0.0.0.0
AUTH_BCRYPT_COST=12
```

## Blog Service Configuration

### Database (MongoDB)

```bash
# ===========================================
# BLOG SERVICE - DATABASE
# ===========================================
BLOG_DB_HOST=mongo
BLOG_DB_PORT=27017
BLOG_DB_NAME=gomicro
BLOG_DB_USER=
BLOG_DB_PASSWORD=
BLOG_DB_TIMEOUT=30s
BLOG_DB_MAX_POOL_SIZE=100
BLOG_DB_MIN_POOL_SIZE=10
```

### Redis Cache

```bash
# ===========================================
# BLOG SERVICE - REDIS
# ===========================================
BLOG_REDIS_HOST=redis
BLOG_REDIS_PORT=6379
BLOG_REDIS_PASSWORD=
BLOG_REDIS_DB=1  # Different DB from auth service
BLOG_REDIS_POOL_SIZE=10
```

### Service Settings

```bash
# ===========================================
# BLOG SERVICE - GENERAL
# ===========================================
BLOG_SERVICE_PORT=8002
BLOG_SERVICE_HOST=0.0.0.0
```

## Docker Compose Configuration

### Standard Deployment

```yaml
version: '3.8'
services:
  kong:
    image: kong:3.0
    ports:
      - "${KONG_ADMIN_PORT:-8000}:8000"
    environment:
      KONG_DATABASE: ${KONG_DATABASE}
      KONG_DECLARATIVE_CONFIG: ${KONG_DECLARATIVE_CONFIG}
    volumes:
      - ./kong:/kong
    depends_on:
      - auth-service
      - blog-service

  nats:
    image: nats:2.9
    ports:
      - "4222:4222"

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ${AUTH_DB_NAME}
      POSTGRES_USER: ${AUTH_DB_USER}
      POSTGRES_PASSWORD: ${AUTH_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./auth_service/.setup:/docker-entrypoint-initdb.d
    ports:
      - "${AUTH_DB_PORT:-5432}:5432"

  mongo:
    image: mongo:5
    environment:
      MONGO_INITDB_DATABASE: ${BLOG_DB_NAME}
    volumes:
      - mongo_data:/data/db
      - ./blog_service/.setup:/docker-entrypoint-initdb.d
    ports:
      - "${BLOG_DB_PORT:-27017}:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "${AUTH_REDIS_PORT:-6379}:6379"

  auth-service:
    build: ./auth_service
    ports:
      - "${AUTH_SERVICE_PORT:-8001}:${AUTH_SERVICE_PORT:-8001}"
    environment:
      - DB_HOST=${AUTH_DB_HOST}
      - DB_PORT=${AUTH_DB_PORT}
      - DB_NAME=${AUTH_DB_NAME}
      - DB_USER=${AUTH_DB_USER}
      - DB_PASSWORD=${AUTH_DB_PASSWORD}
      - REDIS_HOST=${AUTH_REDIS_HOST}
      - REDIS_PORT=${AUTH_REDIS_PORT}
      - SERVICE_PORT=${AUTH_SERVICE_PORT}
      - NATS_URL=${NATS_URL}
      - JWT_SECRET_KEY_PATH=${JWT_SECRET_KEY_PATH}
      - JWT_PUBLIC_KEY_PATH=${JWT_PUBLIC_KEY_PATH}
    volumes:
      - ./keys:/app/keys:ro
    depends_on:
      - postgres
      - redis
      - nats

  blog-service:
    build: ./blog_service
    ports:
      - "${BLOG_SERVICE_PORT:-8002}:${BLOG_SERVICE_PORT:-8002}"
    environment:
      - DB_HOST=${BLOG_DB_HOST}
      - DB_PORT=${BLOG_DB_PORT}
      - DB_NAME=${BLOG_DB_NAME}
      - REDIS_HOST=${BLOG_REDIS_HOST}
      - REDIS_PORT=${BLOG_REDIS_PORT}
      - SERVICE_PORT=${BLOG_SERVICE_PORT}
      - NATS_URL=${NATS_URL}
      - JWT_SECRET_KEY_PATH=${JWT_SECRET_KEY_PATH}
      - JWT_PUBLIC_KEY_PATH=${JWT_PUBLIC_KEY_PATH}
    volumes:
      - ./keys:/app/keys:ro
    depends_on:
      - mongo
      - redis
      - nats
      - auth-service

volumes:
  postgres_data:
  mongo_data:
```

### Load Balanced Deployment

```yaml
version: '3.8'
services:
  # ... (same as above)

  auth-service:
    build: ./auth_service
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
    # ... (environment same as above)

  blog-service:
    build: ./blog_service
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    # ... (environment same as above)
```

## Kong Configuration

### kong/kong.yml

```yaml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:8001
    plugins:
      - name: apikey-auth
        config:
          api_key_header: "x-api-key"
    routes:
      - name: auth-signup
        paths:
          - "/auth/signup"
        methods: ["POST"]
      - name: auth-signin
        paths:
          - "/auth/signin"
        methods: ["POST"]
      - name: auth-refresh
        paths:
          - "/auth/refresh"
        methods: ["POST"]
      - name: auth-verify
        paths:
          - "/auth/verify"
        methods: ["POST"]

  - name: blog-service
    url: http://blog-service:8002
    plugins:
      - name: apikey-auth
        config:
          api_key_header: "x-api-key"
    routes:
      - name: blog-public
        paths:
          - "/blog$"
          - "/blog/id/"
        methods: ["GET"]
      - name: blog-author
        paths:
          - "/blog/author"
        methods: ["GET", "POST", "PUT"]
      - name: blog-editor
        paths:
          - "/blog/editor"
        methods: ["PUT"]
```

## Environment File Templates

### .env (Standard Deployment)

```bash
# Infrastructure
GO_ENV=development
LOG_LEVEL=info

# JWT
JWT_SECRET_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_HOURS=24

# Kong
KONG_ADMIN_PORT=8000
KONG_DATABASE=off
KONG_DECLARATIVE_CONFIG=/kong/kong.yml

# NATS
NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=gomicro

# Auth Service - PostgreSQL
AUTH_DB_HOST=postgres
AUTH_DB_PORT=5432
AUTH_DB_NAME=gomicro
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=password
AUTH_DB_SSL_MODE=disable
AUTH_DB_MAX_CONNECTIONS=25
AUTH_DB_MAX_IDLE_CONNECTIONS=5

# Auth Service - Redis
AUTH_REDIS_HOST=redis
AUTH_REDIS_PORT=6379
AUTH_REDIS_PASSWORD=
AUTH_REDIS_DB=0
AUTH_REDIS_POOL_SIZE=10

# Auth Service - General
AUTH_SERVICE_PORT=8001
AUTH_SERVICE_HOST=0.0.0.0
AUTH_BCRYPT_COST=12

# Blog Service - MongoDB
BLOG_DB_HOST=mongo
BLOG_DB_PORT=27017
BLOG_DB_NAME=gomicro
BLOG_DB_USER=
BLOG_DB_PASSWORD=
BLOG_DB_TIMEOUT=30s
BLOG_DB_MAX_POOL_SIZE=100
BLOG_DB_MIN_POOL_SIZE=10

# Blog Service - Redis
BLOG_REDIS_HOST=redis
BLOG_REDIS_PORT=6379
BLOG_REDIS_PASSWORD=
BLOG_REDIS_DB=1
BLOG_REDIS_POOL_SIZE=10

# Blog Service - General
BLOG_SERVICE_PORT=8002
BLOG_SERVICE_HOST=0.0.0.0
```

### .test.env (Testing)

```bash
# Test environment
GO_ENV=test
LOG_LEVEL=debug

# Use test databases
AUTH_DB_NAME=gomicro_test
BLOG_DB_NAME=gomicro_test

# Shorter token expiry for tests
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=1
JWT_REFRESH_TOKEN_EXPIRY_HOURS=1

# Shorter cache TTL
AUTH_REDIS_DB=2
BLOG_REDIS_DB=3
```

## Configuration Best Practices

### Environment Separation

1. **Development** - Local development with debug logging
2. **Testing** - Isolated databases and short token expiry
3. **Production** - Secure credentials and optimized settings

### Service Isolation

1. **Separate Databases** - Each service uses its own database/schema
2. **Different Redis DBs** - Services use different Redis databases
3. **Port Separation** - Each service runs on its own port
4. **Independent Scaling** - Services can be scaled independently

### Security Considerations

1. **API Keys** - Rotate regularly and monitor usage
2. **JWT Keys** - Use strong RSA keys, rotate periodically
3. **Database Credentials** - Use environment variables, never commit
4. **Network Security** - Services only accessible through Kong

### Performance Tuning

1. **Connection Pools** - Configure appropriate pool sizes
2. **Database Indexes** - Ensure proper indexing
3. **Cache TTL** - Adjust based on data volatility
4. **Service Limits** - Set memory and CPU limits

## Next Steps

- Learn about [Getting Started](/micro/getting-started) to run the services
- Understand [Architecture](/micro/architecture) for design details
- Review [Core Concepts](/micro/core-concepts) for implementation patterns