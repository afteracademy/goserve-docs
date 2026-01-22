# Configuration

This project uses environment variables for configuration. All settings are loaded from `.env` files using [Viper](https://github.com/spf13/viper).

## Environment Files

- **`.env`** - Production/Development environment
- **`.test.env`** - Testing environment

::: tip Quick Setup
Run `go run .tools/copy/envs.go` to create `.env` and `.test.env` from their example templates.
:::

## Server Configuration

### GO_MODE
- **Type:** `string`
- **Default:** `debug`
- **Values:** `debug`, `release`
- **Description:** Sets the Gin framework mode. Use `release` for production to improve performance.

```bash
GO_MODE=debug
```

### SERVER_HOST
- **Type:** `string`
- **Default:** `0.0.0.0`
- **Description:** The host address the server binds to. Use `0.0.0.0` to accept connections from any network interface.

```bash
SERVER_HOST=0.0.0.0
```

### SERVER_PORT
- **Type:** `uint16`
- **Default:** `8080`
- **Description:** The port number the server listens on.

```bash
SERVER_PORT=8080
```

::: warning Port Conflicts
Ensure port 8080 is not occupied by another service. If needed, change this value in your `.env` file.
:::

## Database Configuration

### DB_HOST
- **Type:** `string`
- **Default:** `postgres` (Docker), `localhost` (local)
- **Description:** PostgreSQL server hostname.

```bash
# For Docker
DB_HOST=postgres

# For Local Development
DB_HOST=localhost
```

### DB_NAME
- **Type:** `string`
- **Default:** `goserve_example_db`
- **Description:** Name of the PostgreSQL database.

```bash
DB_NAME=goserve_example_db
```

### DB_PORT
- **Type:** `uint16`
- **Default:** `5432`
- **Description:** PostgreSQL server port.

```bash
DB_PORT=5432
```

::: warning Port Conflicts
Ensure port 5432 is not occupied. Change this value if another PostgreSQL instance is running.
:::

### DB_USER
- **Type:** `string`
- **Default:** `goserve_example_user`
- **Description:** PostgreSQL database username.

```bash
DB_USER=goserve_example_user
```

### DB_USER_PWD
- **Type:** `string`
- **Default:** `changeit`
- **Description:** PostgreSQL database password.

```bash
DB_USER_PWD=changeit
```

::: danger Security Warning
Always use a strong password in production and never commit credentials to version control.
:::

### DB_MIN_POOL_SIZE
- **Type:** `uint16`
- **Default:** `2`
- **Description:** Minimum number of connections in the database pool.

```bash
DB_MIN_POOL_SIZE=2
```

### DB_MAX_POOL_SIZE
- **Type:** `uint16`
- **Default:** `10`
- **Description:** Maximum number of connections in the database pool.

```bash
DB_MAX_POOL_SIZE=10
```

### DB_QUERY_TIMEOUT_SEC
- **Type:** `uint16`
- **Default:** `10`
- **Description:** Query execution timeout in seconds.

```bash
DB_QUERY_TIMEOUT_SEC=10
```

## Redis Configuration

### REDIS_HOST
- **Type:** `string`
- **Default:** `redis` (Docker), `localhost` (local)
- **Description:** Redis server hostname.

```bash
# For Docker
REDIS_HOST=redis

# For Local Development
REDIS_HOST=localhost
```

### REDIS_PORT
- **Type:** `uint16`
- **Default:** `6379`
- **Description:** Redis server port.

```bash
REDIS_PORT=6379
```

::: warning Port Conflicts
Ensure port 6379 is not occupied. Change this value if another Redis instance is running.
:::

### REDIS_PASSWORD
- **Type:** `string`
- **Default:** `changeit`
- **Description:** Redis server password (if authentication is enabled).

```bash
REDIS_PASSWORD=changeit
```

### REDIS_DB
- **Type:** `int`
- **Default:** `0`
- **Description:** Redis database number (0-15).

```bash
REDIS_DB=0
```

## RSA Keys Configuration

RSA keys are used for JWT token signing and verification.

### RSA_PRIVATE_KEY_PATH
- **Type:** `string`
- **Default:** `keys/private.pem`
- **Description:** Path to the RSA private key file used for signing JWT tokens.

```bash
RSA_PRIVATE_KEY_PATH=keys/private.pem
```

### RSA_PUBLIC_KEY_PATH
- **Type:** `string`
- **Default:** `keys/public.pem`
- **Description:** Path to the RSA public key file used for verifying JWT tokens.

```bash
RSA_PUBLIC_KEY_PATH=keys/public.pem
```

::: tip Generate RSA Keys
Run `go run .tools/rsa/keygen.go` or `make setup` to generate RSA key pairs.
:::

## Token Configuration

### ACCESS_TOKEN_VALIDITY_SEC
- **Type:** `uint64`
- **Default:** `10800` (3 hours)
- **Description:** Access token validity duration in seconds.

```bash
ACCESS_TOKEN_VALIDITY_SEC=10800
```

### REFRESH_TOKEN_VALIDITY_SEC
- **Type:** `uint64`
- **Default:** `2592000` (30 days)
- **Description:** Refresh token validity duration in seconds.

```bash
REFRESH_TOKEN_VALIDITY_SEC=2592000
```

### TOKEN_ISSUER
- **Type:** `string`
- **Default:** `https://api.afteracademy.com`
- **Description:** JWT token issuer claim (iss).

```bash
TOKEN_ISSUER=https://api.afteracademy.com
```

### TOKEN_AUDIENCE
- **Type:** `string`
- **Default:** `https://afteracademy.com`
- **Description:** JWT token audience claim (aud).

```bash
TOKEN_AUDIENCE=https://afteracademy.com
```

## Complete Example

Here's a complete `.env` file example:

```bash
# Server Configuration
GO_MODE=debug
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database Configuration
DB_HOST=postgres
DB_NAME=goserve_example_db
DB_PORT=5432
DB_USER=goserve_example_user
DB_USER_PWD=changeit
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=10
DB_QUERY_TIMEOUT_SEC=10

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeit
REDIS_DB=0

# RSA Keys
RSA_PRIVATE_KEY_PATH=keys/private.pem
RSA_PUBLIC_KEY_PATH=keys/public.pem

# Token Configuration
ACCESS_TOKEN_VALIDITY_SEC=10800
REFRESH_TOKEN_VALIDITY_SEC=2592000
TOKEN_ISSUER=https://api.afteracademy.com
TOKEN_AUDIENCE=https://afteracademy.com
```

## Loading Configuration

Configuration is loaded in `config/env.go`:

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

	// Allow environment variables to override .env file
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

## Environment-Specific Configuration

### Development (Docker)
```bash
DB_HOST=postgres
REDIS_HOST=redis
GO_MODE=debug
```

### Local Development
```bash
DB_HOST=localhost
REDIS_HOST=localhost
GO_MODE=debug
```

### Production
```bash
GO_MODE=release
DB_MAX_POOL_SIZE=20
ACCESS_TOKEN_VALIDITY_SEC=3600
```

## Best Practices

1. **Never commit sensitive data** - Use `.gitignore` to exclude `.env` files
2. **Use strong passwords** - Especially for production databases
3. **Adjust pool sizes** - Based on your application's load
4. **Set appropriate timeouts** - Balance between user experience and resource usage
5. **Use environment-specific files** - Separate configurations for dev, test, and prod
6. **Override with environment variables** - Use `override=true` for container deployments

## Related

- Learn about [Getting Started](/postgres/getting-started) to run the application
- Understand [Architecture](/postgres/architecture) for project structure
- Review [Core Concepts](/postgres/core-concepts) for implementation patterns