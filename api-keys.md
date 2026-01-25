# API Key Setup

All example stacks protect endpoints with an `x-api-key` header. Use one stable key in your shell (`API_KEY`) and reuse it across requests.

## Postgres example (recommended flow)

```bash
export API_KEY=dev-$(openssl rand -hex 6)

# With Docker Compose defaults
docker compose exec postgres \
  psql -U goserve_example_user -d goserve_example_db \
  -c "INSERT INTO api_keys (key, permissions, comments, version) VALUES ('$API_KEY', '{\"GENERAL\"}', '{\"docs\"}', 1);"
```

- Health check: `curl -H "x-api-key: $API_KEY" http://localhost:8080/health`
- Reuse `$API_KEY` for auth, blog, and other endpoints.

## Mongo example

The Mongo sample also enforces `x-api-key`. If your database has no key, generate one and insert it into your `api_keys` collection (or use the seed key if provided in your environment). Keep the value in `$API_KEY` and reuse it in requests.

## gomicro example

Kong enforces the API key at the gateway. Use the same `$API_KEY` pattern; ensure the auth service stores the key and Kong’s plugin points to it. If you bootstrap a fresh database, insert the key in the auth service store before calling other services.

## Tips
- Store the key in your shell profile for reuse: `echo "export API_KEY=$API_KEY" >> ~/.profile`
- Rotate keys per environment; mark them with comments (e.g., `docs`, `local dev`).
- If you see 401/403 on every request, re-check that the key exists and is active in the backing store.
