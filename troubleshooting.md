# Troubleshooting

Common issues and their solutions when working with goserve.

## Installation Issues

### Port Already in Use

**Problem:** Docker compose fails with "port is already allocated" error.

```bash
Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use
```

**Solutions:**

1. **Find what's using the port:**
```bash
# macOS/Linux
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

2. **Stop the conflicting process or change the port:**
```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "8081:8080"  # Changed from 8080:8080
```

3. **Stop all containers and restart:**
```bash
docker compose down
docker compose up --build -d
```

### Docker Daemon Not Running

**Problem:** `Cannot connect to the Docker daemon`

**Solutions:**

1. **Start Docker Desktop** (macOS/Windows)
2. **Start Docker service** (Linux):
```bash
sudo systemctl start docker
```

3. **Verify Docker is running:**
```bash
docker ps
```

---

## Database Issues

### PostgreSQL Connection Refused

**Problem:** Application can't connect to PostgreSQL.

```
error connecting to database: dial tcp 127.0.0.1:5432: connect: connection refused
```

**Solutions:**

1. **Check container is running:**
```bash
docker ps | grep goserver-postgres
```

2. **Check container health:**
```bash
docker compose ps
docker compose logs goserver-postgres
```

3. **Verify environment variables:**
```bash
# Check .env file has correct database URL
cat .env | grep DATABASE_URL
```

4. **Test direct connection:**
```bash
docker exec -it goserver-postgres psql -U goserve -d goserve_db
```

### MongoDB Connection Issues

**Problem:** Application can't reach MongoDB.

**Solutions:**

1. **Check container status:**
```bash
docker ps | grep goserver-mongo
docker compose logs goserver-mongo
```

2. **Test MongoDB health:**
```bash
docker exec -it goserver-mongo mongosh --eval "db.adminCommand('ping')"
```

3. **Verify connection string in .env:**
```env
DATABASE_URL=mongodb://goserve:changeit@goserver-mongo:27017/goserve_db?authSource=goserve_db
```

### Database Not Initialized

**Problem:** Tables/collections don't exist after first run.

**PostgreSQL Solution:**
```bash
# Recreate database with fresh migration
docker compose down -v
docker compose up --build -d
```

**MongoDB Solution:**
```bash
# MongoDB creates collections automatically
# Check if indexes are created:
docker exec -it goserver-mongo mongosh goserve_db --eval "db.getCollectionNames()"
```

---

## Authentication Issues

### JWT Keys Not Found

**Problem:** Application crashes with "unable to load keys" or "no such file or directory".

```
panic: unable to load keys from /app/keys: open /app/keys/private.pem: no such file or directory
```

**Solutions:**

1. **Generate RSA keys:**
```bash
go run .tools/rsa/keygen.go
```

2. **Verify keys exist:**
```bash
ls -la keys/
# Should show: private.pem, public.pem
```

3. **Check Docker volume mount:**
```yaml
# docker-compose.yml
volumes:
  - ./keys:/app/keys  # Ensure this line exists
```

4. **Rebuild containers:**
```bash
docker compose up --build -d
```

### Invalid Token Errors

**Problem:** API returns `401 Unauthorized` with valid-looking token.

**Solutions:**

1. **Check token expiration:**
```go
// Tokens expire based on .env settings
ACCESS_TOKEN_VALIDITY_SEC=3600    # 1 hour
REFRESH_TOKEN_VALIDITY_SEC=604800 # 7 days
```

2. **Verify key pairs match:**
```bash
# Regenerate both keys together
rm keys/*
go run .tools/rsa/keygen.go
docker compose restart
```

3. **Check clock synchronization:**
```bash
# System time must be accurate
date
# If off, sync your system clock
```

### API Key Authentication Failing

**Problem:** Request with `x-api-key` header returns 401.

**Solutions:**

1. **Verify API key format in database:**
```sql
-- PostgreSQL
SELECT * FROM api_keys WHERE status = true;

-- MongoDB
db.api_keys.find({ status: true })
```

2. **Check header name:**
```bash
# Correct header:
curl -H "x-api-key: your-key-here" http://localhost:8080/endpoint
```

3. **Verify middleware is registered:**
```go
// Should be in route setup
router.Use(middleware.ApiKeyValidator())
```

---

## Build & Compilation Issues

### Go Module Errors

**Problem:** `go: module requires Go 1.21 or later`

**Solutions:**

1. **Check Go version:**
```bash
go version
# Should be 1.21 or higher
```

2. **Update Go:** Download from [golang.org/dl](https://golang.org/dl/)

3. **Clean module cache:**
```bash
go clean -modcache
go mod download
```

### Dependency Download Failures

**Problem:** `go get` fails or times out.

**Solutions:**

1. **Use Go proxy:**
```bash
export GOPROXY=https://proxy.golang.org,direct
go mod download
```

2. **Clear and rebuild:**
```bash
go clean -modcache
rm go.sum
go mod tidy
```

---

## Microservices-Specific Issues

### Kong Gateway Not Starting

**Problem:** Kong container exits or shows errors.

**Solutions:**

1. **Check Kong logs:**
```bash
docker compose logs kong
```

2. **Verify database migrations:**
```bash
docker compose run --rm kong kong migrations bootstrap
docker compose up kong
```

3. **Check port conflicts:**
```bash
# Kong uses ports 8000 (HTTP) and 8001 (Admin)
lsof -i :8000
lsof -i :8001
```

### NATS Connection Issues

**Problem:** Services can't communicate via NATS.

**Solutions:**

1. **Check NATS is running:**
```bash
docker compose logs nats
docker compose ps | grep nats
```

2. **Verify NATS URL in .env:**
```env
NATS_URL=nats://nats:4222
```

3. **Test NATS connectivity:**
```bash
docker exec -it <service-container> nc -zv nats 4222
```

### Service Discovery Problems

**Problem:** Services can't find each other.

**Solutions:**

1. **Check Docker network:**
```bash
docker network ls
docker network inspect <network-name>
```

2. **Verify service names in environment:**
```env
# Services use container names for DNS
AUTH_SERVICE_URL=http://goserver-auth:8080
BLOG_SERVICE_URL=http://goserver-blog:8080
```

3. **Test inter-service connectivity:**
```bash
docker exec -it goserver-blog ping goserver-auth
```

---

## Redis Issues

### Redis Connection Timeout

**Problem:** Application can't connect to Redis.

**Solutions:**

1. **Check Redis container:**
```bash
docker compose logs redis
docker compose ps | grep redis
```

2. **Test Redis connection:**
```bash
docker exec -it <redis-container> redis-cli ping
# Should return: PONG
```

3. **Verify Redis URL:**
```env
REDIS_URL=redis:6379
```

### Cache Not Working

**Problem:** Data not being cached or stale data served.

**Solutions:**

1. **Clear Redis cache:**
```bash
docker exec -it <redis-container> redis-cli FLUSHALL
```

2. **Check cache keys:**
```bash
docker exec -it <redis-container> redis-cli KEYS '*'
```

3. **Verify cache TTL:**
```go
// Check cache expiration settings
cacheClient.Set(ctx, key, value, 10*time.Minute)
```

---

## Testing Issues

### Integration Tests Failing

**Problem:** Tests fail with database connection errors.

**Solutions:**

1. **Ensure test database is running:**
```bash
docker compose ps
```

2. **Check test environment variables:**
```bash
# Tests may use different env file
cat .env.test
```

3. **Run tests with verbose output:**
```bash
go test -v ./...
```

### Test Database Pollution

**Problem:** Tests fail due to existing data.

**Solutions:**

1. **Use transaction rollback:**
```go
// In test setup
tx := db.Begin()
defer tx.Rollback()
```

2. **Clean database between tests:**
```go
func (s *TestSuite) TearDownTest() {
    s.DB.Exec("TRUNCATE TABLE users CASCADE")
}
```

---

## Performance Issues

### Slow API Responses

**Solutions:**

1. **Check database indexes:**
```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Look for "Seq Scan" - add index if found
CREATE INDEX idx_users_email ON users(email);
```

2. **Monitor Redis cache hits:**
```bash
docker exec -it <redis-container> redis-cli INFO stats | grep hit
```

3. **Enable query logging:**
```go
// In database config
db.Logger = logger.Default.LogMode(logger.Info)
```

### High Memory Usage

**Solutions:**

1. **Check connection pool settings:**
```go
// Adjust in database config
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

2. **Monitor container resources:**
```bash
docker stats
```

---

## Environment Configuration

### Missing Environment Variables

**Problem:** Application crashes with "ENV variable not set".

**Solutions:**

1. **Copy example environment file:**
```bash
go run .tools/copy/envs.go
# Or manually:
cp .env.example .env
```

2. **Verify all required variables:**
```bash
# Check which variables are missing
cat .env.example
diff .env.example .env
```

3. **Load environment in development:**
```bash
# Using godotenv
export $(cat .env | xargs)
go run main.go
```

---

## Development Workflow Issues

### Hot Reload Not Working

**Problem:** Changes don't reflect without manual restart.

**Solutions:**

1. **Verify volume mounts:**
```yaml
# docker-compose.yml
volumes:
  - .:/app
```

2. **Check file watcher:**
```bash
# Install air for hot reload
go install github.com/cosmtrek/air@latest
air
```

### VS Code Debugger Not Attaching

**Problem:** Breakpoints not hitting in VS Code.

**Solutions:**

1. **Check launch.json configuration:**
```json
{
  "version": "0.2.0",
  "configurations": [{
    "name": "Launch Package",
    "type": "go",
    "request": "launch",
    "mode": "debug",
    "program": "${workspaceFolder}"
  }]
}
```

2. **Ensure Delve is installed:**
```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

---

## Getting More Help

If these solutions don't resolve your issue:

1. **Check GitHub Issues:** [github.com/afteracademy/goserve/issues](https://github.com/afteracademy/goserve/issues)
2. **Search Discussions:** [github.com/afteracademy/goserve/discussions](https://github.com/afteracademy/goserve/discussions)
3. **Ask the Community:** Post in GitHub Discussions with:
   - Full error message
   - Steps to reproduce
   - Environment details (OS, Go version, Docker version)
   - Relevant logs (`docker compose logs`)

4. **Watch Tutorials:** [YouTube Channel](https://www.youtube.com/@afteracad)

---

## Preventive Measures

### Before Starting Development

- ✅ Ensure Docker Desktop is running
- ✅ Verify Go 1.21+ is installed: `go version`
- ✅ Generate RSA keys: `go run .tools/rsa/keygen.go`
- ✅ Copy environment file: `go run .tools/copy/envs.go`
- ✅ Check port availability: `lsof -i :8080`

### Regular Maintenance

- 🔄 Update dependencies: `go get -u ./...`
- 🧹 Clean Docker: `docker system prune -a`
- 📦 Update goserve: Check [latest releases](https://github.com/afteracademy/goserve/releases)
- 🔐 Rotate JWT keys in production environments

### Best Practices

- 📝 Use `.env` files for configuration (never commit!)
- 🧪 Write tests for critical paths
- 📊 Monitor container logs: `docker compose logs -f`
- 🔍 Use `EXPLAIN` for slow queries
- 💾 Backup databases before major changes
