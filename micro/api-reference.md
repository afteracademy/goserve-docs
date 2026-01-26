# API Reference

Complete API endpoint reference for the gomicro microservices system. All endpoints require an API key in the `x-api-key` header.

[![API Documentation](https://img.shields.io/badge/API%20Documentation-View%20Here-blue?style=for-the-badge)](https://documenter.getpostman.com/view/1552895/2sA3dxCWsa)

## Base URL

```
http://localhost:8000
```

## At a glance

- **Auth service**: `/auth/signup|signin|refresh|verify/apikey` (API key; JWT where noted)
- **Blog service**: `/blog` public reads; `/blog/author|editor` protected (API key + JWT + role)
- **Gateway**: Kong enforces API key via plugin before forwarding to services

## Authentication

All API requests require an API key:

```bash
x-api-key: your-api-key-here
```

See [API key setup](/api-keys) for generating and storing the key Kong validates.

Protected endpoints additionally require JWT Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Common errors

| Code | Message (example)                           | When it happens                | Fix                                                           |
| ---- | ------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| 401  | permission denied: missing x-api-key header | Request lacked API key         | Add `x-api-key: $API_KEY`                                     |
| 401  | permission denied: invalid x-api-key        | Kong/auth-service rejected key | Ensure the key exists in auth store and matches plugin config |
| 403  | Bad request: validation error               | Invalid payload                | Fix request body or params                                    |
| 500  | something went wrong                        | Downstream service error       | Check service logs (auth/blog) and retry                      |

## Auth Service APIs

**Base Path:** `/auth`

### Sign Up (Basic)

Create a new user account with email and password.

```http
POST /auth/signup/basic
```

**Request Body:**

```json
{
  "email": "ali@afteracademy.com",
  "password": "123456",
  "name": "Janishar Ali"
}
```

**Response:**

```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "84c108ce-5f92-494e-97a1-7ad5af0c0877",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "id": "d2e51682-e918-492f-8b76-9895dd42b8ae",
          "code": "LEARNER"
        }
      ]
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Sign In (Basic)

Authenticate with email and password.

```http
POST /auth/signin/basic
```

**Request Body:**

```json
{
  "email": "admin@afteracademy.com",
  "password": "changeit"
}
```

**Response:**

```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "1d7d4c02-3911-4dcb-8d45-98077067e13e",
      "email": "admin@afteracademy.com",
      "name": "Admin",
      "roles": [
        {
          "id": "d2e51682-e918-492f-8b76-9895dd42b8ae",
          "code": "LEARNER"
        },
        {
          "id": "1d602c1d-c402-4fba-a27a-1f6af54a9663",
          "code": "AUTHOR"
        },
        {
          "id": "24091a33-3a7b-40c9-b1a5-82e6fddef147",
          "code": "EDITOR"
        },
        {
          "id": "e8bbf11b-2160-4761-bef3-8df893f79542",
          "code": "ADMIN"
        }
      ]
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "..."
}
```

**Response:**

```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Verify API Key

Internal endpoint for Kong plugin to validate API keys.

```http
GET -H x-api-key: your-api-key-here /auth/verify/apikey
```

**Response:**

```json
{
  "code": "10000",
  "status": 200,
  "message": "success"
}
```

## Blog Service APIs

**Base Path:** `/blog`

### Get All Blogs (Public)

Get a list of latest published blogs paginated.

```http
GET /blog/list/latest
```

**Query Parameters:**

- `page` : Page number (default: 1)
- `limit` : Items per page (default: 10, max: 50)

**Response:**

```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": [
    {
      "_id": "69714393e0f8db2edf850104",
      "title": "Test Title",
      "description": "Test Description",
      "slug": "test-url",
      "score": 0.01,
      "tags": ["GO", "BACKEND"]
    }
  ]
}
```

## Health Check

**Base Path:** `/`

## Error Responses

All API errors follow a consistent format:

```json
{
  "code": "10001",
  "status": 401,
  "message": "..."
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server error)

## Data Types

### MongoDB ObjectID

All document IDs are MongoDB ObjectIDs, represented as 24-character hexadecimal strings.

**Example:** `507f1f77bcf86cd799439011`

### UUID (PostgreSQL)

User IDs and other relational data use UUID format.

**Example:** `550e8400-e29b-41d4-a716-446655440000`

### Timestamps

All timestamps are in ISO 8601 format with UTC timezone.

**Example:** `2024-01-15T10:30:00Z`

### User Roles

Users can have the following roles (hierarchical):

- `LEARNER` - Basic user permissions (level 1)
- `AUTHOR` - Can create and manage own content (level 2)
- `EDITOR` - Can edit and publish content (level 3)
- `ADMIN` - Full system access (level 4)

## Authentication Flow

### 1. API Key Validation

Kong validates the `x-api-key` header before routing requests.

### 2. JWT Token Validation (Protected Routes)

Services validate JWT tokens using RSA public keys.

### 3. Role-Based Authorization

Services check user roles for specific operations:

- **Create Blog**: Requires AUTHOR role or higher
- **Update Blog**: Requires AUTHOR role + blog ownership
- **Publish Blog**: Requires EDITOR role or higher
- **Delete Blog**: Requires AUTHOR role + blog ownership
