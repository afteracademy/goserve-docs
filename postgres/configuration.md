# Configuration

Configure the goserve PostgreSQL example project.

## Environment Variables

The application uses environment variables for configuration. All settings are loaded from `.env` files using Viper.

## Database Configuration

### PostgreSQL Settings

```
# DB_HOST=localhost
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goserver_dev_db
DB_USER=goserver_dev_db_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# PostgreSQL Docker container variables
POSTGRES_DB=goserver_dev_db
POSTGRES_USER=goserver_dev_db_user
POSTGRES_PASSWORD=changeit
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
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goserver_dev_db
DB_USER=goserver_dev_db_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

# PostgreSQL Docker container variables
POSTGRES_DB=goserver_dev_db
POSTGRES_USER=goserver_dev_db_user
POSTGRES_PASSWORD=changeit

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
GO_MODE=debug

SERVER_HOST=0.0.0.0
SERVER_PORT=8081

# DB_HOST=localhost
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goserver_test_db
DB_USER=goserver_test_db_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
DB_QUERY_TIMEOUT_SEC=60

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

# test run from the test directory one level below the src
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
    container_name: goserver-postgres
    restart: unless-stopped
    env_file: .env
    ports:
      - '${SERVER_PORT}:${SERVER_PORT}'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    networks:
      - goserve-postgres-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:18.1
    restart: unless-stopped
    env_file: .env
    ports:
      - '${DB_PORT}:5432'
    volumes:
      - dbdata:/data/db
      # optional pg seed scripts
      - ./.extra/setup/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql:ro
      - ./.extra/setup/pgseed.sql:/docker-entrypoint-initdb.d/pgseed.sql:ro
    networks:
      - goserve-postgres-network
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -h localhost -p 5432 -U \"$${POSTGRES_USER}\" -d \"$${POSTGRES_DB}\""
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  redis:
    image: redis:8.4.0
    restart: unless-stopped
    env_file: .env
    ports:
      - '${REDIS_PORT}:6379'
    command: redis-server --bind 0.0.0.0 --save 20 1 --loglevel warning --requirepass ${REDIS_PASSWORD}
    volumes:
      - cache:/data/cache
    networks:
      - goserve-postgres-network
    healthcheck:
      test:
        [
          "CMD",
          "redis-cli",
          "-a", "${REDIS_PASSWORD}",
          "ping"
        ]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s

  migrate:
    image: migrate/migrate
    env_file: .test.env
    volumes:
      - ./migrations:/migrations
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - goserve-postgres-network
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        migrate -path /migrations -database "postgres://$${DB_USER}:$${DB_USER_PWD}@postgres:5432/$${DB_NAME}?sslmode=disable" up

networks:
  goserve-postgres-network:
    driver: bridge

volumes:
  dbdata:
  cache:
    driver: local
```

## PostgreSQL Initialization

### .extra/pgseed.sql

```sql
-- Enable UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Tables
-- ----------------

-- Api Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    permissions TEXT[],
    comments TEXT[],
    version INTEGER,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Api Keys Indexes
CREATE INDEX IF NOT EXISTS api_keys_key_status_idx
ON api_keys (key, status);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
		profile_pic_url TEXT,
		verified BOOLEAN DEFAULT FALSE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Join Table for Users <-> Roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Keystore Table
CREATE TABLE IF NOT EXISTS keystore (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	p_key TEXT NOT NULL,
	s_key TEXT NOT NULL,
	status BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keystore Table Indexes
CREATE INDEX IF NOT EXISTS keystore_user_status_idx
ON keystore (user_id, status);

CREATE INDEX IF NOT EXISTS keystore_user_pkey_status_idx
ON keystore (user_id, p_key, status);

CREATE INDEX IF NOT EXISTS keystore_user_pkey_skey_status_idx
ON keystore (user_id, p_key, s_key, status);

-- Messages Table
CREATE TABLE messages (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	type TEXT NOT NULL,
	msg TEXT NOT NULL,
	status BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	text TEXT,
	draft_text TEXT NOT NULL,
	tags TEXT[],
	author_id UUID NOT NULL REFERENCES users(id),
	img_url TEXT,
	slug TEXT NOT NULL UNIQUE,
	score DOUBLE PRECISION DEFAULT 0.01,
	submitted BOOLEAN DEFAULT FALSE,
	drafted BOOLEAN DEFAULT TRUE,
	published BOOLEAN DEFAULT FALSE,
	status BOOLEAN DEFAULT TRUE,
	published_at TIMESTAMP,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blogs Table Indexes
CREATE INDEX IF NOT EXISTS blogs_publish_idx
ON blogs (published_at DESC, score DESC)
WHERE published = TRUE AND status = TRUE;

CREATE INDEX IF NOT EXISTS blogs_tags_gin_idx
ON blogs
USING GIN (tags);

CREATE INDEX IF NOT EXISTS blogs_search_idx
ON blogs
USING GIN (to_tsvector('english', title));

-- Insert Data
-- --------------

-- Insert API Key
INSERT INTO api_keys (key, permissions, comments, version, status, created_at, updated_at)
VALUES (
    '1D3F2DD1A5DE725DD4DF1D82BBB37',
    ARRAY['GENERAL'],
    ARRAY['To be used by the xyz vendor'],
    1,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Insert Roles
INSERT INTO roles (code, status, created_at, updated_at)
VALUES 
    ('LEARNER', true, NOW(), NOW()),
    ('AUTHOR', true, NOW(), NOW()),
    ('EDITOR', true, NOW(), NOW()),
    ('ADMIN', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert Admin User
INSERT INTO users (name, email, password, status, created_at, updated_at)
VALUES (
    'Admin', 
    'admin@afteracademy.com', 
    '$2a$10$psWmSrmtyZYvtIt/FuJL1OLqsK3iR1fZz5.wUYFuSNkkt.EOX9mLa',
    true, 
    NOW(), 
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Map Admin User to ALL Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@afteracademy.com'
ON CONFLICT DO NOTHING;
```

### .extra/init-test-db.sql
```sql
-- Create test user
CREATE USER goserver_test_db_user WITH PASSWORD 'changeit';

-- Create test database
CREATE DATABASE goserver_test_db OWNER goserver_test_db_user;

GRANT ALL PRIVILEGES ON DATABASE goserver_test_db TO goserver_test_db_user;
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
