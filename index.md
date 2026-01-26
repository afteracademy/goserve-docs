---
layout: home

hero:
  name: "goserve"
  text: "Go API Backend Framework"
  tagline: A robust framework for building efficient, reliable and scalable server-side applications
  image:
    src: /images/mascot.svg
    alt: goserve mascot
  actions:
    - theme: brand
      text: PostgreSQL Example
      link: /postgres/
    - theme: alt
      text: MongoDB Example
      link: /mongo/
    - theme: alt
      text: Microservices Example
      link: /micro/
    - theme: alt
      text: View Framework on GitHub
      link: https://github.com/afteracademy/goserve

features:
  - icon: 🏗️
    title: Feature Separation
    details: Clean architecture with modular design for maintainable and scalable applications
  - icon: ⚡
    title: High Performance
    details: Built on Go, Gin, and optimized database drivers for blazing-fast REST APIs
  - icon: 🧪
    title: Testability
    details: Simplified unit and integration testing ensuring high-quality, production-ready code
  - icon: 🔐
    title: Security First
    details: JWT authentication, middleware support, and secure patterns built-in
  - icon: 🗄️
    title: Database Support
    details: PostgreSQL (pgx) with connection pooling and MongoDB integrations
  - icon: ⚡
    title: Redis Integration
    details: Built-in Redis support for caching
  - icon: 📦
    title: Production Ready
    details: Validator, Viper config, and crypto utilities included out of the box
  - icon: 🚀
    title: Example Projects
    details: Complete example implementations to get you started quickly
---

## Technology Stack

goserve is built with industry-standard Go libraries:

- **Go 1.21+** - Modern, efficient programming language
- **Gin** - Fast HTTP web framework
- **JWT (RS256)** - Secure RSA-signed token-based authentication  
- **pgx** - PostgreSQL driver with connection pooling
- **MongoDB Driver** - Official Go driver for MongoDB
- **go-redis** - Redis client for caching and sessions
- **Validator** - Request validation utilities
- **Viper** - Configuration management
- **Crypto** - Cryptographic utilities

**Latest Version:** v2.1.2

## Why Choose goserve?

- ✅ **Batteries Included**: Everything you need for production REST APIs
- ✅ **Clean Architecture**: Feature-based organization that scales
- ✅ **Easy Testing**: Simplified patterns for unit and integration tests
- ✅ **Active Development**: Regularly updated with latest Go best practices
- ✅ **Well Documented**: Comprehensive examples and documentation
- ✅ **Open Source**: Apache 2.0 licensed, free to use

## 📚 Documentation

### Getting Started
- **[Getting Started](/getting-started)** - Quick start guide with examples
- **[Framework Architecture](/architecture)** - Framework architecture and design patterns
- **[Core Concepts](/core-concepts)** - Controllers, services, DTOs, and patterns

## Example Projects

Learn by example with complete, production-ready implementations:

##### 1. [PostgreSQL Example](/postgres/)
Complete REST API with PostgreSQL, Redis, JWT authentication, role-based authorization, and comprehensive testing.

##### 2. [MongoDB Example](/mongo/)
Complete REST API with MongoDB, Redis, and JWT authentication.

##### 3. [Microservices (gomicro)](/micro/)
Microservices architecture with Kong API gateway, NATS messaging, and Docker orchestration.

## Quick Start

### Install goserve

```bash
go get github.com/afteracademy/goserve
```

### Try the PostgreSQL Example

The best way to get started is with the complete example project:

```bash
git clone https://github.com/afteracademy/goserve-example-api-server-postgres.git
cd goserve-example-api-server-postgres
go run .tools/rsa/keygen.go && go run .tools/copy/envs.go
docker compose up --build -d
curl http://localhost:8080/health
```

See the [PostgreSQL Example Documentation](/postgres/) for detailed setup and usage.

## Community & Resources

- 🌟 **[GitHub Repository](https://github.com/afteracademy/goserve)** - Star us on GitHub (154+ stars)
- 📺 **[YouTube Channel](https://www.youtube.com/@afteracad)** - AfterAcademy tutorials and guides
- 📖 **[Article](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)** - Architecture deep dive
- 💬 **[Discussions](https://github.com/afteracademy/goserve/discussions)** - Ask questions and share ideas
- 🐛 **[Issues](https://github.com/afteracademy/goserve/issues)** - Report bugs and request features

## License

goserve is released under the **Apache 2.0 License**. See the [LICENSE](https://github.com/afteracademy/goserve/blob/main/LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to fork the repository and open a pull request. See the [Contributing Guide](https://github.com/afteracademy/goserve/blob/main/CONTRIBUTING.md) for more details.

---

**Find this project useful?** ⭐ Star it on [GitHub](https://github.com/afteracademy/goserve) to show your support!
