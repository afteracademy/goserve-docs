---
title: PostgreSQL REST API Reference - Complete Endpoint Documentation
description: Complete API reference for goserve PostgreSQL blog platform including authentication, user management, blog CRUD, and role-based access control endpoints.
---

# API Reference

Complete API endpoint reference for the goserve PostgreSQL blog platform. All endpoints require an API key in the `x-api-key` header except `/health`.

[![API Documentation](https://img.shields.io/badge/API%20Documentation-View%20Here-blue?style=for-the-badge)](https://documenter.getpostman.com/view/1552895/2sBXVihVLg)

### API Key
API Key `1D3F2DD1A5DE725DD4DF1D82BBB37` is created as default by this project through postgres pgseed SQL script.

If your database is empty, create an entry in the `api_keys` table.

See [API key setup](/api-keys) for more details.

## Base URL

```
http://localhost:8080
```

## At a glance

- **Health**
  - `/health`  
  Public - no authentication — used for health checks

- **Authentication**
  - `/auth/signup/basic`
  - `/auth/signin/basic`
  - `/auth/token/refresh`
  - `/auth/signout`  
  API key required - JWT required for refresh & signout

- **User / Profile**
  - `/profile/id/:id`
  - `/profile/mine`  
  API key + JWT

- **Contact**
  - `/contact`  
  API key
- **Blog – Author (write & workflow)**
  - `/blog/author`
  - `/blog/author/id/:id`
  - `/blog/author/submit/:id`
  - `/blog/author/withdraw/:id`
  - `/blog/author/drafts`
  - `/blog/author/submitted`
  - `/blog/author/published`  
  API key + JWT; author role required

- **Blog – Editor (moderation & publishing)**
  - `/blog/editor/id/:id`
  - `/blog/editor/submitted`
  - `/blog/editor/published`
  - `/blog/editor/publish/id/:id`
  - `/blog/editor/unpublish/id/:id`  
  API key + JWT; editor role required

- **Blog – Single content**
  - `/blog/id/:id`
  - `/blog/slug/:slug`  
  API key

- **Blogs – Public listings**
  - `/blogs/latest`
  - `/blogs/tag/:tag`
  - `/blogs/similar/id/:id`  
  API key; read-only access

## Authentication model

- **API Key (`x-api-key`)**
  - Required for all endpoints except `/health`
- **JWT (Bearer token)**
  - Required for profile access, blog author/editor actions, token refresh, and signout
- **Role-based access**
  - Author routes require author role
  - Editor routes require editor role

### Common errors
| Code | Message (example) | When it happens | Fix |
| --- | --- | --- | --- |
| 401 | permission denied: missing x-api-key header | No `x-api-key` header | Add `x-api-key: $API_KEY` |
| 403 | permission denied: invalid x-api-key | Key not found/disabled | Insert or use a valid key |
| 422 | validation error: ... | Invalid request payload | Correct the request body |
| 500 | something went wrong | Server-side error | Check service logs and retry |

## Blog/Blogs API

### Get latest Blogs

Get a list of latest blogs paginated.

```http
GET /blogs/latest?page=1&limit=10
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": [
    {
      "id": "494f4b9c-c1d6-473c-8fe4-5aabc1cc5f77",
      "title": "Test Title",
      "description": "Test Description",
      "slug": "test-url-3",
      "imgUrl": "https://example/assets/image.png",
      "score": 0.01,
      "tags": [
        "GO",
        "BACKEND"
      ],
      "publishedAt": "2026-01-20T03:52:32.311231Z"
    }
  ]
}
```

### Get Blog by ID

Get a specific blog by its PostgresSQL UUID.

```http
GET /blog/id/{id}
```

**Parameters:**
- `id` (string, required) - PostgresSQL UUID of the sample

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "id": "494f4b9c-c1d6-473c-8fe4-5aabc1cc5f77",
    "title": "Test Title",
    "description": "Test Description",
    "text": "<p>draft</p>",
    "slug": "test-url-3",
    "author": {
      "id": "149dfb45-9079-443d-b4dd-b146ce879446",
      "name": "Admin"
    },
    "imgUrl": "https://example/assets/image.png",
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "publishedAt": "2026-01-20T03:52:32.311231Z"
  }
}
```

### Create Blog

Create a new blog record.

```http
POST /blog/author
```

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Request Body:**
```json
{
	"title": "Test Title",
	"description": "Test Description",
	"draftText": "<p>draft</p>",
	"slug": "test-url",
	"imgUrl": "https://example/assets/image.png",
	"tags": [
			"GO",
			"BACKEND"
	]
}
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "blog created successfully",
  "data": {
    "id": "91ad379c-dcfb-4f97-9d57-2c8d3d925dd1",
    "title": "Test Title",
    "description": "Test Description",
    "draftText": "<p>draft</p>",
    "slug": "test-url",
    "author": {
      "id": "149dfb45-9079-443d-b4dd-b146ce879446",
      "name": "Admin"
    },
    "imgUrl": "https://example/assets/image.png",
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "submitted": false,
    "drafted": true,
    "published": false,
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z"
  }
}
```

### Update Blog

Update an existing blog record.

```http
PUT /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required) - PostgresSQL UUID of the blog
**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Request Body:**
```json
{
	"_id": "66784670fa51e5414d99f747",
	"title": "Test Title",
	"description": "Test Description",
	"draftText": "<p>draft</p>",
	"slug": "test-url-2",
	"imgUrl": "https://janisharali.com/assets/ali-cover.png",
	"tags": [
			"GO",
			"BACKEND"
	]
}
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "blog created successfully",
  "data": {
    "id": "91ad379c-dcfb-4f97-9d57-2c8d3d925dd1",
    "title": "Test Title",
    "description": "Test Description",
    "draftText": "<p>draft</p>",
    "slug": "test-url",
    "author": {
      "id": "149dfb45-9079-443d-b4dd-b146ce879446",
      "name": "Admin"
    },
    "imgUrl": "https://example/assets/image.png",
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "submitted": false,
    "drafted": true,
    "published": false,
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z"
  }
}
```

### Delete Blog

Delete a blog record.

```http
DELETE /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required) - PostgresSQL UUID of the blog
**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "blog deleted successfully"
}
```

## Authentication API

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
      "id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "id": "17c8077b-d5c2-42d8-a42b-9a0469c54209",
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
	"email": "ali@afteracademy.com",
	"password": "123456"
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
      "id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "id": "17c8077b-d5c2-42d8-a42b-9a0469c54209",
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

## User API

**Base Path:** `/profile`

### Get Current User

Get information about the currently authenticated user.

```http
GET /profile/mine
```

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
    "email": "admin@unusualcode.org",
    "name": "Admin",
    "roles": [
      {
        "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
        "code": "LEARNER"
      },
      {
        "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
        "code": "WRITER"
      },
      {
        "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
        "code": "EDITOR"
      },
      {
        "_id": "df7b4663-c595-4f0b-ba9d-6ac3d3dfe244",
        "code": "ADMIN"
      }
    ]
  }
}
```

## Health Check

**Base Path:** `/`

### Health Check

Check if the service is healthy.

```http
GET /health
```

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "timestamp": "2026-01-25T06:45:17.228713387Z",
    "status": "OK"
  }
}
```

## Error Responses

All API errors follow a consistent format:

```json
{
  "code": "10001",
  "status": 400,
  "message": "Validation failed"
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

### PostgresSQL UUID

All record IDs are PostgresSQL UUIDs, represented as 36-character hexadecimal strings with hyphens.

**Example:** `507f1f77-bc86-4cd7-9943-9011abcd1234`

### Timestamps

All timestamps are in ISO 8601 format with UTC timezone.

**Example:** `2024-01-15T10:30:00Z`

### User Roles

Users can have the following roles:

- `LEARNER` - Basic user permissions
- `AUTHOR` - Can create and manage own content
- `EDITOR` - Can edit and publish content
- `ADMIN` - Full system access

## Next

- Try the [goserve MongoDb Example](/mongo)
- Explore [goserve Microservice Example](/micro)