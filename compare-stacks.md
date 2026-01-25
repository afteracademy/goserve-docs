# Choosing a Stack

Pick the example that fits your needs.

| Use case | Start here | Highlights |
| --- | --- | --- |
| Production-ready monolith | [PostgreSQL example](/postgres/) | JWT + roles, pgx, Redis cache, integration tests, API key middleware |
| Document-first backend | [MongoDB example](/mongo/) | Mongo + Redis, JWT + API keys, sample CRUD with DTO validation |
| Distributed system | [gomicro](/micro/) | Kong gateway, NATS messaging, Postgres + Mongo per service, API key plugin, service-to-service JWT validation |

Notes:
- All stacks share the goserve patterns (feature-based modules, DTO validation, layered services).
- Start with PostgreSQL unless you specifically need document storage or a service mesh/gateway.
