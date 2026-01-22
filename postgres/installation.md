docker compose up --build
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
go mod download
go mod tidy
go run cmd/main.go
docker compose up postgres redis
go run cmd/main.go
docker compose ps postgres
docker compose ps redis
go clean -modcache
go mod download
go mod tidy
go mod verify
docker system prune -a
docker compose build --no-cache
# Installation

This page now points to a single source of truth. Follow [Getting Started](/getting-started) for:

- Docker-first setup (recommended)
- Local-only workflow
- Hybrid (local app, Docker services)
- Quick health check and first API calls

If you need environment variable details, see [Configuration](/configuration).
docker compose logs api
```

## Next Steps

- ✅ Installation complete? Learn about [Project Architecture](/architecture)
- 🔧 Configure your environment: [Configuration Guide](/configuration)
- 🚀 Start building: [Examples](/examples)
