---
title: MongoDB Configuration - Environment Variables & Settings
description: Configure goserve MongoDB REST API with environment variables for database, Redis, JWT authentication, server settings, and logging.
---

# Configuration

Configure the goserve MongoDB example project.

## Environment Variables

The application uses environment variables for configuration. All settings are loaded from `.env` files using Viper.

## Database Configuration

### MongoDB Settings

```
# DB_HOST=localhost
DB_HOST=mongo
DB_PORT=27017
DB_NAME=goserver-dev-db
DB_USER=goserver-dev-db-user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# MongoDB Admin Credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeit
MONGO_INITDB_DATABASE=admin
```

## Redis Configuration

```
# REDIS_HOST=localhost
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeit
```

## JWT Configuration

```
# 2 DAYS: 172800 Sec
ACCESS_TOKEN_VALIDITY_SEC=172800
# 7 DAYS: 604800 Sec
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.goserve.afteracademy.com
TOKEN_AUDIENCE=goserve.afteracademy.com

RSA_PRIVATE_KEY_PATH="keys/private.pem"
RSA_PUBLIC_KEY_PATH="keys/public.pem"
```

## Server Configuration

```bash
# debug, release, test
GO_MODE=debug

SERVER_HOST=0.0.0.0
SERVER_PORT=8080
```

## .env File

```
# debug, release, test
GO_MODE=debug

SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# DB_HOST=localhost
DB_HOST=mongo
DB_PORT=27017
DB_NAME=goserver-dev-db
DB_USER=goserver-dev-db-user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# MongoDB Admin Credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeit
MONGO_INITDB_DATABASE=admin

# REDIS_HOST=localhost
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeit

# 2 DAYS: 172800 Sec
ACCESS_TOKEN_VALIDITY_SEC=172800
# 7 DAYS: 604800 Sec
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.goserve.afteracademy.com
TOKEN_AUDIENCE=goserve.afteracademy.com

RSA_PRIVATE_KEY_PATH="keys/private.pem"
RSA_PUBLIC_KEY_PATH="keys/public.pem"
```

## .test.env File

```
# debug, release, test
GO_MODE=test

# DB_HOST=localhost
DB_HOST=mongo
DB_PORT=27017
DB_NAME=goserver-test-db
DB_USER=goserver-test-db-user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60
DB_ADMIN=admin
DB_ADMIN_PWD=changeit

# REDIS_HOST=localhost
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeit

# 2 DAYS: 172800 Sec
ACCESS_TOKEN_VALIDITY_SEC=172800
# 7 DAYS: 604800 Sec
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.goserve.afteracademy.com
TOKEN_AUDIENCE=goserve.afteracademy.com

RSA_PRIVATE_KEY_PATH="../keys/private.pem"
RSA_PUBLIC_KEY_PATH="../keys/public.pem"
```

## Configuration Loading

The configuration is loaded using the following pattern:

```go
package config

import (
	"log"

	"github.com/spf13/viper"
)

type Env struct {
	// server
	GoMode     string `mapstructure:"GO_MODE"`
	ServerHost string `mapstructure:"SERVER_HOST"`
	ServerPort uint16 `mapstructure:"SERVER_PORT"`
	// database
	DBHost         string `mapstructure:"DB_HOST"`
	DBName         string `mapstructure:"DB_NAME"`
	DBPort         uint16 `mapstructure:"DB_PORT"`
	DBUser         string `mapstructure:"DB_USER"`
	DBUserPwd      string `mapstructure:"DB_USER_PWD"`
	DBMinPoolSize  uint16 `mapstructure:"DB_MIN_POOL_SIZE"`
	DBMaxPoolSize  uint16 `mapstructure:"DB_MAX_POOL_SIZE"`
	DBQueryTimeout uint16 `mapstructure:"DB_QUERY_TIMEOUT_SEC"`
	// redis
	RedisHost string `mapstructure:"REDIS_HOST"`
	RedisPort uint16 `mapstructure:"REDIS_PORT"`
	RedisPwd  string `mapstructure:"REDIS_PASSWORD"`
	RedisDB   int    `mapstructure:"REDIS_DB"`
	// keys
	RSAPrivateKeyPath string `mapstructure:"RSA_PRIVATE_KEY_PATH"`
	RSAPublicKeyPath  string `mapstructure:"RSA_PUBLIC_KEY_PATH"`
	// Token
	AccessTokenValiditySec  uint64 `mapstructure:"ACCESS_TOKEN_VALIDITY_SEC"`
	RefreshTokenValiditySec uint64 `mapstructure:"REFRESH_TOKEN_VALIDITY_SEC"`
	TokenIssuer             string `mapstructure:"TOKEN_ISSUER"`
	TokenAudience           string `mapstructure:"TOKEN_AUDIENCE"`
}

func NewEnv(filename string, override bool) *Env {
	env := Env{}
	viper.SetConfigFile(filename)

	if override {
		viper.AutomaticEnv()
	}

	err := viper.ReadInConfig()
	if err != nil {
		log.Fatal("Error reading environment file", err)
	}

	err = viper.Unmarshal(&env)
	if err != nil {
		log.Fatal("Error loading environment file", err)
	}

	return &env
}

```

## Docker Configuration

### Dockerfile

```dockerfile
# Use Go v1.25.6 as the base image
FROM golang:1.25.6-alpine

RUN apk add --no-cache curl

# Create a new user in the docker image
RUN adduser --disabled-password --gecos '' gouser

# Create a new directory for goserve files and set the path in the container
RUN mkdir -p /home/gouser/goserve

# Set the working directory in the container
WORKDIR /home/gouser/goserve

# Copy the project files into the container
COPY . .

# Set the ownership of the goserve directory to gouser
RUN chown -R gouser:gouser /home/gouser/goserve

# Switch to the gouser user
USER gouser

# Download dependencies and build the project
RUN go mod tidy
RUN go build -o build/server cmd/main.go

# Expose the server port (replace 8080 with your actual port)
EXPOSE 8080

# Command to run the server
CMD ["./build/server"]
```

### docker-compose.yml

```yaml
services:
  goserver:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: goserver-mongo
    restart: unless-stopped
    env_file: .env
    ports:
      - "${SERVER_PORT}:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - goserve-mongo-network

  mongo:
    image: mongo:8.0.9
    restart: unless-stopped
    env_file: .env
    ports:
      - "${DB_PORT}:27017"
    command: mongod --bind_ip_all
    volumes:
      - ./.extra/setup/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
      - dbdata:/data/db
    healthcheck:
      test:
        [
          "CMD",
          "mongosh",
          "--quiet",
          "-u",
          "${MONGO_INITDB_ROOT_USERNAME}",
          "-p",
          "${MONGO_INITDB_ROOT_PASSWORD}",
          "--authenticationDatabase",
          "admin",
          "--eval",
          "db.runCommand({ ping: 1 }).ok",
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    networks:
      - goserve-mongo-network

  redis:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: .env
    ports:
      - "${REDIS_PORT}:6379"
    command: redis-server --bind localhost --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass ${REDIS_PASSWORD}
    volumes:
      - cache:/data/cache
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - goserve-mongo-network

networks:
  goserve-mongo-network:
    driver: bridge

volumes:
  dbdata:
  cache:
    driver: local
```

## MongoDB Initialization

### .extra/init-mongo.js

```javascript
function seed(dbName, user, password) {
  db = db.getSiblingDB(dbName);
  db.createUser({
    user: user,
    pwd: password,
    roles: [{ role: "readWrite", db: dbName }],
  });

  db.createCollection("api_keys");
  db.createCollection("roles");

  db.api_keys.insert({
    key: "1D3F2DD1A5DE725DD4DF1D82BBB37",
    permissions: ["GENERAL"],
    comments: ["To be used by the xyz vendor"],
    version: 1,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  db.roles.insertMany([
    {
      code: "LEARNER",
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: "AUTHOR",
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: "EDITOR",
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: "ADMIN",
      status: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  db.users.insert({
    name: "Admin",
    email: "admin@afteracademy.com",
    password: "$2a$10$psWmSrmtyZYvtIt/FuJL1OLqsK3iR1fZz5.wUYFuSNkkt.EOX9mLa", // hash of password: changeit
    roles: db.roles
      .find({})
      .toArray()
      .map((role) => role._id),
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

seed("goserver-prod-db", "goserver-prod-db-user", "changeit");
seed("goserver-dev-db", "goserver-dev-db-user", "changeit");
seed("goserver-test-db", "goserver-test-db-user", "changeit");
```

## Configuration Best Practices

### Environment Separation

1. **Development** - Local development with relaxed settings
2. **Testing** - Isolated test databases and short cache TTL
3. **Production** - Secure credentials and optimized settings

### Security Considerations

1. **Never commit secrets** - Use environment variables for sensitive data
2. **Use strong passwords** - For database and Redis connections
3. **Limit permissions** - Database users should have minimal required permissions
4. **Rotate keys regularly** - JWT keys and API secrets should be rotated

### Performance Tuning

1. **Connection pooling** - Configure appropriate pool sizes for your workload
2. **Timeout settings** - Set reasonable timeouts to prevent hanging connections
3. **Cache TTL** - Adjust cache expiration based on data volatility
4. **Database indexes** - Ensure proper indexing for query performance
