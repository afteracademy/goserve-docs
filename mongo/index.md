---
layout: doc
title: MongoDB REST API Example - goserve Framework
description: Production-ready MongoDB REST API with Go. Features JWT authentication, flexible schemas, Redis caching, official MongoDB driver, comprehensive testing, and Docker setup.
---

# goserve Example API - MongoDB

[![Docker Compose CI](https://github.com/afteracademy/goserve-example-api-server-mongo/actions/workflows/docker_compose.yml/badge.svg)](https://github.com/afteracademy/goserve-example-api-server-mongo/actions/workflows/docker_compose.yml)

[![Architecture](https://img.shields.io/badge/Framework-blue?label=View&logo=go)](https://github.com/afteracademy/goserve)

[![Starter Project](https://img.shields.io/badge/Starter%20Project%20CLI-red?label=Get&logo=go)](https://github.com/afteracademy/goservegen)

[![Download](https://img.shields.io/badge/Download-Starter%20Project%20Mongo%20Zip-green.svg)](https://github.com/afteracademy/goservegen/raw/main/starter-project-mongo.zip)

## Create A Blog Service

This project is a production-ready backend solution that demonstrates best practices for building high-performance, secure REST API services. It provides a robust and opinionated architectural foundation focused on consistency, scalability, and long-term maintainability.

The architecture emphasizes clear feature separation, enabling easier unit and integration testing while keeping business logic isolated and reusable. This structure helps teams maintain high code quality as the codebase grows.

Built on top of the goserve framework, the project leverages essential building blocks for Go-based REST APIs, allowing developers to focus on business logic while relying on proven patterns for configuration, routing, validation, and service composition.


## Key Features

### 🏗️ Modular Architecture
Feature-based organization with clean separation of controllers, services, models, and DTOs for maintainable code.

### 🔐 Complete Authentication
JWT-based authentication with RSA signing, refresh tokens, and role-based authorization.

### ⚡ High Performance
Redis caching layer and optimized MongoDB queries for blazing-fast API responses.

### 🐳 Docker Ready
Complete Docker Compose setup with MongoDB, Redis, and application containers for easy development and deployment.

### 🧪 Comprehensive Testing
Unit tests and integration tests included with helper utilities for testing authentication and authorization flows.

### 📝 API Key Protection
All endpoints protected with API key middleware, ensuring secure access control at the infrastructure level.

### 🔄 Code Generation
Built-in CLI tools to generate new API features with proper structure, saving development time and ensuring consistency.

### 🎯 Production Ready
Best practices for error handling, validation, logging, and security built-in from day one.

## Community

- [GitHub Repository](https://github.com/afteracademy/goserve-example-api-server-mongo)
- [goserve Framework](https://github.com/afteracademy/goserve)
- [YouTube Channel](https://www.youtube.com/@afteracad)
- [Article on Architecture](https://afteracademy.com/article/how-to-architect-good-go-backend-rest-api-services)