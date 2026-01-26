---
title: Microservices Configuration - gomicro Environment Setup
description: Configure gomicro distributed microservices with environment variables for Kong gateway, NATS messaging, PostgreSQL, MongoDB, Redis, and JWT settings.
---

# Configuration

Configure the gomicro microservices project components.

## Overview

gomicro uses a distributed configuration approach where each service has its own environment variables while sharing common infrastructure settings.

## Environment Variables

### Global Environment Variables

.env

```bash
NATS_CLIENT_PORT=4222
NATS_MANAGEMENT_PORT=8222
```

### auth_service Environment Variables

auth_service/.env

```bash
# debug, release, test
GO_MODE=debug

SERVER_HOST=0.0.0.0
SERVER_PORT=8000

# DB_HOST=localhost
DB_HOST=postgres
DB_PORT=5432
DB_NAME=auth_db
DB_USER=auth_db_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# PostgreSQL Docker container variables
POSTGRES_DB=auth_db
POSTGRES_USER=auth_db_user
POSTGRES_PASSWORD=changeit

# REDIS_HOST=localhost
REDIS_HOST=redis-auth
REDIS_PORT=6379
REDIS_PASSWORD=changeit
REDIS_DB=0

# NATS_URL=nats://localhost:4222
NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=auth
NATS_SERVICE_VERSION=1.0.0
NATS_TIMEOUT_SEC=120

# 2 DAYS: 172800 Sec
ACCESS_TOKEN_VALIDITY_SEC=172800
# 7 DAYS: 604800 Sec
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.goserve.afteracademy.com
TOKEN_AUDIENCE=goserve.afteracademy.com

RSA_PRIVATE_KEY_PATH="keys/private.pem"
RSA_PUBLIC_KEY_PATH="keys/public.pem"
```

auth_service/.test.env

```bash
# debug, release, test
GO_MODE=test

SERVER_HOST=0.0.0.0
SERVER_PORT=8001

DB_HOST=postgres
DB_PORT=5432
DB_NAME=auth_test_db
DB_USER=auth_test_db_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=1
DB_MAX_POOL_SIZE=2
DB_QUERY_TIMEOUT_SEC=60

REDIS_HOST=redis-auth
REDIS_PORT=6379
REDIS_PASSWORD=changeit
REDIS_DB=1

NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=auth
NATS_SERVICE_VERSION=1.0.0
NATS_TIMEOUT_SEC=120

# 2 DAYS: 172800 Sec
ACCESS_TOKEN_VALIDITY_SEC=172800
# 7 DAYS: 604800 Sec
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.goserve.afteracademy.com
TOKEN_AUDIENCE=goserve.afteracademy.com

RSA_PRIVATE_KEY_PATH="../keys/private.pem"
RSA_PUBLIC_KEY_PATH="../keys/public.pem"
```

### blog_service Environment Variables

./blog_service/.env

```bash
# debug, release, test
GO_MODE=debug

SERVER_HOST=0.0.0.0
SERVER_PORT=8000
# SERVER_PORT=8001

# DB_HOST=localhost
DB_HOST=mongo
DB_PORT=27017
DB_NAME=blog-db
DB_USER=blog-db-user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# MongoDB Docker container variables
MONGO_INITDB_DATABASE=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeit

# REDIS_HOST=localhost
REDIS_HOST=redis-blog
REDIS_PORT=6379
REDIS_PASSWORD=changeit
REDIS_DB=2

# NATS_URL=nats://localhost:4222
NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=blog
NATS_SERVICE_VERSION=1.0.0
NATS_TIMEOUT_SEC=120
```

./blog_service/.test.env

```bash
# debug, release, test
GO_MODE=test

SERVER_HOST=0.0.0.0
SERVER_PORT=8001

DB_HOST=mongo
DB_PORT=27017
DB_NAME=blog-test-db
DB_USER=blog-test-db-user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=1
DB_MAX_POOL_SIZE=2
DB_QUERY_TIMEOUT_SEC=60

REDIS_HOST=redis-blog
REDIS_PORT=6379
REDIS_PASSWORD=changeit
REDIS_DB=3

NATS_URL=nats://nats:4222
NATS_SERVICE_NAME=blog
NATS_SERVICE_VERSION=1.0.0

```

## Docker Compose Configuration

### Standard Deployment

### Docker Compose Auth Service

auth_service/Dockerfile

```Dockerfile
FROM golang:1.25.6-alpine

RUN apk add --no-cache curl

RUN adduser --disabled-password --gecos '' gouser

RUN mkdir -p /home/gouser/project

WORKDIR /home/gouser/project

COPY . .

RUN chown -R gouser:gouser /home/gouser/project

USER gouser

ENV SERVER_PORT=8000

RUN go mod tidy
RUN go build -o build/server cmd/main.go

EXPOSE 8000

CMD ["./build/server"]

```

### Docker Compose Blog Service

blog_service/Dockerfile

```Dockerfile
FROM golang:1.25.6-alpine

RUN apk add --no-cache curl

RUN adduser --disabled-password --gecos '' gouser

RUN mkdir -p /home/gouser/project

WORKDIR /home/gouser/project

COPY . .

RUN chown -R gouser:gouser /home/gouser/project

USER gouser

ENV SERVER_PORT=8000

RUN go mod tidy
RUN go build -o build/server cmd/main.go

EXPOSE 8000

CMD ["./build/server"]
```

kong/Dockerfile

```Dockerfile
# Stage 1: Build the Go plugin
FROM golang:1.25.6-alpine AS builder

WORKDIR /plugins
COPY . .
WORKDIR /plugins/apikey_auth_plugin
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /plugins/apikey-auth-plugin main.go

# Stage 2: Build the Kong Docker image
FROM kong:3.9.1

COPY --from=builder /plugins/apikey-auth-plugin /usr/local/bin/apikey-auth-plugin

USER root
RUN chmod +x /usr/local/bin/apikey-auth-plugin
USER kong

COPY kong.yml /etc/kong/kong.yml

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_LISTEN=0.0.0.0:8001
ENV KONG_PLUGINS=bundled,apikey-auth-plugin
ENV KONG_PLUGINSERVER_NAMES=apikey-auth-plugin

EXPOSE 8000 8443 8001 8444

CMD ["sh", "-c", "export KONG_PLUGINSERVER_APIKEY_AUTH_PLUGIN_QUERY_CMD='/usr/local/bin/apikey-auth-plugin -dump' && kong start -c /etc/kong/kong.yml"]
```

kong/Dockerfile-load-balanced

```Dockerfile
# Stage 1: Build the Go plugin
FROM golang:1.25.6-alpine AS builder

WORKDIR /plugins
COPY . .
WORKDIR /plugins/apikey_auth_plugin
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /plugins/apikey-auth-plugin main.go

# Stage 2: Build the Kong Docker image
FROM kong:3.9.1

COPY --from=builder /plugins/apikey-auth-plugin /usr/local/bin/apikey-auth-plugin

USER root
RUN chmod +x /usr/local/bin/apikey-auth-plugin
USER kong

COPY kong-load-balanced.yml /etc/kong/kong.yml

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr
ENV KONG_PLUGINS=bundled,apikey-auth-plugin
ENV KONG_PLUGINSERVER_NAMES=apikey-auth-plugin

EXPOSE 8000 8443 8001 8444

CMD ["sh", "-c", "export KONG_PLUGINSERVER_APIKEY_AUTH_PLUGIN_QUERY_CMD='/usr/local/bin/apikey-auth-plugin -dump' && kong start -c /etc/kong/kong.yml"]
```

docker-compose.yml

```yaml
name: "gomicro"
services:
  kong:
    build:
      context: ./kong
    user: root
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
      - "8444:8444"
    depends_on:
      - auth
      - blog
    networks:
      - gomicro-network

  auth:
    build:
      context: ./auth_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./auth_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      postgres:
        condition: service_healthy
      redis-auth:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network
    # Internal service - no external ports exposed (Kong routes traffic)

  blog:
    build:
      context: ./blog_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./blog_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      mongo:
        condition: service_healthy
      redis-blog:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network
    # Internal service - no external ports exposed (Kong routes traffic)

  # Auth Service Database (PostgreSQL)
  postgres:
    image: postgres:18.1
    restart: unless-stopped
    env_file: ./auth_service/.env
    ports:
      - "5432:5432"
    volumes:
      - ./auth_service/.setup/auth-init-pg-db.sql:/docker-entrypoint-initdb.d/auth-init-pg-db.sql:ro
      - ./auth_service/.setup/auth-init-pg-test-db.sql:/docker-entrypoint-initdb.d/auth-init-pg-test-db.sql:ro
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test:
        [
          "CMD-SHELL",
          'pg_isready -h localhost -p 5432 -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"',
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - gomicro-network

  # Database migration for auth service (test database)
  migrate-auth-test-db:
    image: migrate/migrate
    env_file: ./auth_service/.test.env
    volumes:
      - ./auth_service/migrations:/migrations
    depends_on:
      postgres:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        migrate -path /migrations -database "postgres://$${DB_USER}:$${DB_USER_PWD}@postgres:5432/$${DB_NAME}?sslmode=disable" up
    networks:
      - gomicro-network
    restart: on-failure

  # Blog Service Database (MongoDB)
  mongo:
    image: mongo:8.0.9
    restart: unless-stopped
    env_file: ./blog_service/.env
    ports:
      - "27017:27017"
    command: mongod --bind_ip_all
    volumes:
      - ./blog_service/.setup/blog-init-mongo.js:/docker-entrypoint-initdb.d/blog-init-mongo.js:ro
      - mongo-data:/data/db
    healthcheck:
      test:
        - CMD-SHELL
        - >
          mongosh --quiet
          -u "$$MONGO_INITDB_ROOT_USERNAME"
          -p "$$MONGO_INITDB_ROOT_PASSWORD"
          --authenticationDatabase admin
          --eval "db.runCommand({ ping: 1 }).ok"
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    networks:
      - gomicro-network

  # Redis for Auth Service
  redis-auth:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: ./auth_service/.env
    ports:
      - "6379:6379"
    command: redis-server --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass changeit
    volumes:
      - redis-auth-data:/data
    healthcheck:
      test:
        - CMD-SHELL
        - redis-cli -a "$$REDIS_PASSWORD" ping
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - gomicro-network

  # Redis for Blog Service
  redis-blog:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: ./blog_service/.env
    ports:
      - "6380:6379"
    command: redis-server --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass changeit
    volumes:
      - redis-blog-data:/data
    healthcheck:
      test:
        - CMD-SHELL
        - redis-cli -a "$$REDIS_PASSWORD" ping
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - gomicro-network

  # Message broker for inter-service communication
  nats:
    image: nats:2.12.3
    restart: unless-stopped
    env_file: .env
    ports:
      - "${NATS_CLIENT_PORT:-4222}:4222"
      - "${NATS_MANAGEMENT_PORT:-8222}:8222"
    networks:
      - gomicro-network

networks:
  gomicro-network:
    driver: bridge

volumes:
  postgres-data:
  mongo-data:
  redis-auth-data:
  redis-blog-data:
```

### Load Balanced Deployment

docker-compose.load-balanced.yml

```yaml
name: "gomicro_load_balanced"
services:
  kong:
    build:
      context: ./kong
      dockerfile: ./Dockerfile-load-balanced
    user: root
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
      - "8444:8444"
    depends_on:
      - auth1
      - auth2
      - blog1
      - blog2
    networks:
      - gomicro-network

  # Auth Service Instances for Load Balancing
  auth1:
    build:
      context: ./auth_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./auth_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      postgres:
        condition: service_healthy
      redis-auth:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network

  auth2:
    build:
      context: ./auth_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./auth_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      postgres:
        condition: service_healthy
      redis-auth:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network

  # Blog Service Instances for Load Balancing
  blog1:
    build:
      context: ./blog_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./blog_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      mongo:
        condition: service_healthy
      redis-blog:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network

  blog2:
    build:
      context: ./blog_service
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./blog_service/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      mongo:
        condition: service_healthy
      redis-blog:
        condition: service_healthy
      nats:
        condition: service_started
    networks:
      - gomicro-network

  # Auth Service Database (PostgreSQL)
  postgres:
    image: postgres:18.1
    restart: unless-stopped
    env_file: ./auth_service/.env
    ports:
      - "5432:5432"
    volumes:
      - ./auth_service/.setup/auth-init-pg-db.sql:/docker-entrypoint-initdb.d/auth-init-pg-db.sql:ro
      - ./auth_service/.setup/auth-init-pg-test-db.sql:/docker-entrypoint-initdb.d/auth-init-pg-test-db.sql:ro
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test:
        [
          "CMD-SHELL",
          'pg_isready -h localhost -p 5432 -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"',
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - gomicro-network

  # Database migration for auth service (test database)
  migrate-auth-test-db:
    image: migrate/migrate
    env_file: ./auth_service/.test.env
    volumes:
      - ./auth_service/migrations:/migrations
    depends_on:
      postgres:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        migrate -path /migrations -database "postgres://$${DB_USER}:$${DB_USER_PWD}@postgres:5432/$${DB_NAME}?sslmode=disable" up
    networks:
      - gomicro-network
    restart: on-failure

  # Blog Service Database (MongoDB)
  mongo:
    image: mongo:8.0.9
    restart: unless-stopped
    env_file: ./blog_service/.env
    ports:
      - "27017:27017"
    command: mongod --bind_ip_all
    volumes:
      - ./blog_service/.setup/blog-init-mongo.js:/docker-entrypoint-initdb.d/blog-init-mongo.js:ro
      - mongo-data:/data/db
    healthcheck:
      test:
        - CMD-SHELL
        - >
          mongosh --quiet
          -u "$$MONGO_INITDB_ROOT_USERNAME"
          -p "$$MONGO_INITDB_ROOT_PASSWORD"
          --authenticationDatabase admin
          --eval "db.runCommand({ ping: 1 }).ok"
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    networks:
      - gomicro-network

  # Redis for Auth Service
  redis-auth:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: ./auth_service/.env
    ports:
      - "6379:6379"
    command: redis-server --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass changeit
    volumes:
      - redis-auth-data:/data
    healthcheck:
      test:
        - CMD-SHELL
        - redis-cli -a "$$REDIS_PASSWORD" ping
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - gomicro-network

  # Redis for Blog Service
  redis-blog:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: ./blog_service/.env
    ports:
      - "6380:6379"
    command: redis-server --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass changeit
    volumes:
      - redis-blog-data:/data
    healthcheck:
      test:
        - CMD-SHELL
        - redis-cli -a "$$REDIS_PASSWORD" ping
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - gomicro-network

  # Message broker for inter-service communication
  nats:
    image: nats:2.12.3
    restart: unless-stopped
    env_file: .env
    ports:
      - "${NATS_CLIENT_PORT:-4222}:4222"
      - "${NATS_MANAGEMENT_PORT:-8222}:8222"
    networks:
      - gomicro-network

networks:
  gomicro-network:
    driver: bridge

volumes:
  postgres-data:
  mongo-data:
  redis-auth-data:
  redis-blog-data:
```

## Kong Configuration

kong/kong.yml

```yaml
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

kong/kong-load-balanced.yml

```yaml
_format_version: "2.1"
_transform: true

services:
  - name: auth
    url: http://auth_upstream
    routes:
      - name: auth
        paths:
          - /auth
  - name: blog
    url: http://blog_upstream
    routes:
      - name: blog
        paths:
          - /blog

upstreams:
  - name: auth_upstream
    targets:
      - target: auth1:8000
        weight: 100
      - target: auth2:8000
        weight: 100

  - name: blog_upstream
    targets:
      - target: blog1:8000
        weight: 100
      - target: blog2:8000
        weight: 100

plugins:
  - name: apikey-auth-plugin
    config:
      verification_urls:
        - http://auth1:8000/verify/apikey
        - http://auth2:8000/verify/apikey
```
