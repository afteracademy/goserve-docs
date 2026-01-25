---
layout: doc
---

# gomicro - Go Microservices Architecture

**Complete Microservices Implementation with Kong API Gateway**

![Gomicro banner](/images/gomicro-banner.png)

Build distributed systems with Kong, NATS messaging, MongoDB, Redis, JWT authentication, and service discovery.

## Quick Links

<div class="vp-doc">

- [🚀 Get Started](/micro/getting-started) - Set up your microservices environment
- [🏗️ Architecture](/micro/architecture) - Understand the microservices design
- [⚙️ Configuration](/micro/configuration) - Configure services and Kong
- [📚 API Reference](/micro/api-reference) - Complete API documentation

</div>

## Key Features

### 🏗️ Complete Microservices Architecture
Two independent services (auth & blog) communicating via NATS messaging, orchestrated with Docker Compose.

### 🌐 Kong API Gateway
Centralized API gateway with custom Go plugin for API key authentication and request routing.

### 📨 NATS Messaging
Inter-service communication using NATS for event-driven architecture and synchronous service calls.

### 🔐 Distributed Authentication
Auth service handles JWT token validation and role-based authorization across services.

### 🗄️ Multi-Database Architecture
Auth service uses PostgreSQL, blog service uses MongoDB, both with Redis caching.

### 🐳 Docker Orchestration
Complete containerized environment with load balancing options and service discovery.

### 📊 Two Deployment Modes
- **Standard Mode**: Single instance of each service
- **Load Balanced Mode**: Multiple instances with load balancing

## Architecture Overview

```
Internet
    ↓
Kong API Gateway (Port 8000)
    ↓ Custom API Key Plugin
    ↓ Routes to services
┌─────────────────┐    NATS Messaging    ┌─────────────────┐
│  auth-service   │◄──────────────────►│  blog-service   │
│   (PostgreSQL)  │                     │    (MongoDB)    │
│    Port: 8001   │                     │   Port: 8002    │
└─────────────────┘                     └─────────────────┘
        ↓                                       ↓
   PostgreSQL + Redis                    MongoDB + Redis
```

## Services Overview

### Auth Service
- **Database**: PostgreSQL with users and roles
- **Purpose**: JWT authentication and role-based authorization
- **Communication**: Receives validation requests via NATS
- **Endpoints**: Token verification, user management, role checking

### Blog Service
- **Database**: MongoDB for flexible blog document storage
- **Purpose**: Blog CRUD operations with author/editor workflows
- **Communication**: Requests auth validation via NATS
- **Endpoints**: Blog creation, publishing, author/editor operations

## Why gomicro?

**goserve** provides a robust foundation for building production-ready REST APIs. This microservices example demonstrates:

- **Service Decomposition**: Breaking monolithic apps into independent services
- **API Gateway Pattern**: Centralized routing with Kong
- **Event-Driven Communication**: NATS for inter-service messaging
- **Database per Service**: Independent data storage choices
- **Distributed Authentication**: Cross-service security validation
- **Container Orchestration**: Docker Compose for complete environments

## Quick Example

```bash
# Create a blog post (requires authentication)
POST /blog/author
Authorization: Bearer <jwt_token>
x-api-key: your-api-key

{
  "title": "My First Blog",
  "description": "A great blog post",
  "draftText": "Full blog content here...",
  "slug": "my-first-blog",
  "imgUrl": "https://example.com/image.jpg",
  "tags": ["TECH", "GOLANG"]
}
```

## Technology Stack

- **Framework**: goserve micro framework
- **API Gateway**: Kong with custom Go plugin
- **Messaging**: NATS for service communication
- **Databases**: PostgreSQL (auth) + MongoDB (blog)
- **Caching**: Redis for both services
- **Authentication**: JWT with RSA signing
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- **Go 1.21+**
- **Docker & Docker Compose**
- **Git**

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/afteracademy/gomicro.git
cd gomicro

# Generate RSA keys for JWT
go run .tools/rsa/keygen.go

# Create environment files
go run .tools/copy/envs.go

# Start all services
docker compose up --build

# Access the API
curl http://localhost:8000/health
```

## Community

- [GitHub Repository](https://github.com/afteracademy/gomicro) - 30+ stars
- [goserve Framework](https://github.com/afteracademy/goserve)
- [YouTube Channel](https://www.youtube.com/@afteracad)
- [Article: Microservices Guide](https://afteracademy.com/article/how-to-create-microservices-a-practical-guide-using-go)

---

## Related Topics

**Explore More Examples:**
- [PostgreSQL Example →](/postgres/) - Relational database architecture
- [MongoDB Example →](/mongo/) - Document database architecture
- [Compare Architectures →](/compare) - Choose the right approach

**Microservices Deep Dive:**
- [Architecture Guide →](/micro/architecture) - System design and load balancing
- [Configuration →](/micro/configuration) - Kong, NATS, and service setup
- [Getting Started →](/micro/getting-started) - Step-by-step deployment

**Additional Resources:**
- [Troubleshooting →](/troubleshooting) - Common issues and solutions
- [Core Concepts](/core-concepts) - Understanding goserve fundamentals
- [API Documentation](https://documenter.getpostman.com/view/1552895/2sA3dxCWsa) - Try the API