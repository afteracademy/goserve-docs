---
title: API Key Setup Guide - goserve Authentication
description: Configure API key authentication for goserve PostgreSQL, MongoDB, and microservices examples. Secure your REST API endpoints with x-api-key headers.
---

# API Key Setup

All example stacks protect endpoints with an `x-api-key` header except the `/health` endpoint. Use one stable key in your shell (`API_KEY`) and reuse it across requests.

Note: API_KEY `1D3F2DD1A5DE725DD4DF1D82BBB37` is used in the example projects for demonstration by default using init scripts.

## Postgres example (recommended flow)

```bash
export API_KEY=dev-$(openssl rand -hex 6)

# With Docker Compose defaults
docker compose exec postgres \
  psql -U goserve_dev_user -d goserve_dev_db \
  -c "INSERT INTO api_keys (key, permissions, comments, version) VALUES ('$API_KEY', '{\"GENERAL\"}', '{\"docs\"}', 1);"
```

- Health check: `curl http://localhost:8080/health`
- Use `$API_KEY` for auth, blog, and other endpoints.

## Mongo example

The Mongo sample also enforces `x-api-key`. If your database has no key, generate one and insert it into your `api_keys` collection (or use the seed key if provided in your environment). Keep the value in `$API_KEY` and reuse it in requests.

## gomicro example

Kong enforces the API key at the gateway. Use the same `$API_KEY` pattern; ensure the auth service stores the key and Kong’s plugin points to it. If you bootstrap a fresh database, insert the key in the auth service store before calling other services.
