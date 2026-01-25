# Choose Your Architecture

Not sure which example to start with? This guide will help you choose the right architecture for your project.

## Quick Comparison

| Feature | PostgreSQL | MongoDB | Microservices |
|---------|-----------|---------|---------------|
| **Best For** | Traditional CRUD, relational data | Flexible schemas, rapid prototyping | Distributed systems, scalability |
| **Database** | PostgreSQL (pgx) | MongoDB (official driver) | Both (Postgres + Mongo) |
| **Complexity** | ⭐⭐ Medium | ⭐ Low | ⭐⭐⭐ High |
| **Scalability** | Vertical | Horizontal | Horizontal (per service) |
| **Team Size** | 1-5 developers | 1-3 developers | 5+ developers |
| **Deployment** | Single server | Single server | Multiple services + gateway |

## PostgreSQL Example

[![View Example](https://img.shields.io/badge/View-PostgreSQL%20Example-blue?style=for-the-badge)](/postgres/)

### ✅ Best For
- Traditional CRUD applications
- Relational data with complex relationships
- Strong data consistency requirements
- Transactional operations
- Applications requiring ACID compliance

### Key Features
- ✅ Complete JWT authentication system
- ✅ Role-based access control (LEARNER, AUTHOR, EDITOR, ADMIN)
- ✅ Redis caching layer
- ✅ Comprehensive test coverage (unit + integration)
- ✅ Database migrations
- ✅ Connection pooling with pgx

### Use Cases
- Blog platforms with user management
- E-commerce applications
- Content management systems
- Financial applications
- Any app with structured, relational data

### Getting Started
```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build -d
```

[Full PostgreSQL Guide →](/postgres/)

---

## MongoDB Example

[![View Example](https://img.shields.io/badge/View-MongoDB%20Example-green?style=for-the-badge)](/mongo/)

### ✅ Best For
- Document-based data models
- Rapid prototyping and iteration
- Flexible, evolving schemas
- Horizontal scaling needs
- Unstructured or semi-structured data

### Key Features
- ✅ JWT authentication with refresh tokens
- ✅ API key protection
- ✅ Redis caching
- ✅ MongoDB indexes and aggregations
- ✅ Schema-less flexibility
- ✅ Type-safe document handling

### Use Cases
- Content-heavy applications
- Real-time analytics
- IoT data collection
- Social media platforms
- Applications with frequently changing schemas

### Getting Started
```bash
git clone https://github.com/afteracademy/goserve-example-api-server-mongo.git
cd goserve-example-api-server-mongo
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build -d
```

[Full MongoDB Guide →](/mongo/)

---

## Microservices (gomicro)

[![View Example](https://img.shields.io/badge/View-Microservices-orange?style=for-the-badge)](/micro/)

### ✅ Best For
- Distributed systems architecture
- Service isolation and independent deployment
- High-traffic applications requiring scaling
- Teams working on different services
- Polyglot persistence (multiple databases)

### Key Features
- ✅ Kong API Gateway for routing
- ✅ NATS messaging for inter-service communication
- ✅ Auth service (PostgreSQL)
- ✅ Blog service (MongoDB)
- ✅ Redis shared cache
- ✅ Load balancing support
- ✅ Independent service scaling

### Use Cases
- Large-scale platforms
- Multi-tenant SaaS applications
- Applications requiring different databases per service
- Systems needing independent service updates
- High-availability requirements

### Getting Started
```bash
git clone https://github.com/afteracademy/gomicro.git
cd gomicro
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build
```

**With Load Balancing:**
```bash
docker compose -f docker-compose-load-balanced.yml up --build
```

[Full Microservices Guide →](/micro/)

---

## Decision Tree

```
Start here
    │
    ├─ Simple CRUD app? ────────────────────────────────→ PostgreSQL
    │
    ├─ Need flexible schema? ──────────────────────────→ MongoDB
    │
    ├─ Building distributed system? ───────────────────→ Microservices
    │
    ├─ Team < 5 developers? ───────────────────────────→ PostgreSQL or MongoDB
    │
    ├─ Need to scale specific features independently? ─→ Microservices
    │
    └─ Still unsure? ──────────────────────────────────→ Start with PostgreSQL
```

## Feature Matrix

### Authentication & Security

| Feature | PostgreSQL | MongoDB | Microservices |
|---------|-----------|---------|---------------|
| JWT (RS256) | ✅ | ✅ | ✅ |
| API Keys | ✅ | ✅ | ✅ (Kong plugin) |
| Role-Based Access | ✅ Full RBAC | ✅ Basic | ✅ Distributed |
| Refresh Tokens | ✅ | ✅ | ✅ |

### Data & Caching

| Feature | PostgreSQL | MongoDB | Microservices |
|---------|-----------|---------|---------------|
| Primary Database | PostgreSQL | MongoDB | Both |
| Redis Caching | ✅ | ✅ | ✅ Shared |
| Transactions | ✅ Native | ✅ Limited | ✅ Per service |
| Migrations | ✅ SQL | ⚠️ Manual | ✅ Per service |

### Development & Testing

| Feature | PostgreSQL | MongoDB | Microservices |
|---------|-----------|---------|---------------|
| Unit Tests | ✅ | ✅ | ✅ |
| Integration Tests | ✅ | ✅ | ✅ |
| Code Generation | ✅ apigen | ✅ apigen | ✅ Per service |
| Hot Reload | ✅ | ✅ | ✅ |
| VS Code Debug | ✅ | ✅ | ✅ |

### Infrastructure

| Feature | PostgreSQL | MongoDB | Microservices |
|---------|-----------|---------|---------------|
| Docker Compose | ✅ | ✅ | ✅ |
| Health Checks | ✅ | ✅ | ✅ |
| Load Balancing | ➖ | ➖ | ✅ |
| API Gateway | ➖ | ➖ | ✅ Kong |
| Service Mesh | ➖ | ➖ ✅ NATS |

## Still Need Help?

- 💬 [GitHub Discussions](https://github.com/afteracademy/goserve/discussions) - Ask the community
- 📺 [YouTube Channel](https://www.youtube.com/@afteracad) - Watch tutorials
- 📖 [Architecture Guide](/architecture) - Understand goserve's design
- 🐛 [Report Issues](https://github.com/afteracademy/goserve/issues) - Found a bug?

## Next Steps

Once you've chosen your architecture:

1. **Install** - Follow the quick start guide for your chosen example
2. **Explore** - Review the code structure and understand the patterns
3. **Customize** - Modify for your specific needs
4. **Deploy** - Use the Docker setup for production

---

**Pro Tip:** Start simple and migrate to microservices when you have clear service boundaries and scaling needs. Most projects benefit from starting with PostgreSQL or MongoDB examples.
