---
title: MongoDB REST API Reference - Complete Endpoint Documentation
description: Complete API reference for goserve MongoDB blog platform including authentication, user management, blog CRUD, and flexible document handling.
---

# API Reference

Complete API endpoint reference for the goserve MongoDB blog platform. All endpoints require an API key in the `x-api-key` header except `/health`.

[![API Documentation](https://img.shields.io/badge/API%20Documentation-View%20Here-blue?style=for-the-badge)](https://documenter.getpostman.com/view/1552895/2sA3XWdefu)

### API Key
API Key `1D3F2DD1A5DE725DD4DF1D82BBB37` is created as default by this project through mongo init scripts.

If your database is empty, create an entry in the `api_keys` collection.

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
      "_id": "667846dffa51e5414d99f748",
      "title": "Test Title 2",
      "description": "Test Description 2",
      "slug": "test-url-2",
      "score": 0.01,
      "tags": [
        "GO",
        "CLI"
      ]
    },
    {
      "_id": "66784670fa51e5414d99f747",
      "title": "Test Title",
      "description": "Test Description",
      "slug": "test-url",
      "imgUrl": "https://janisharali.com/assets/ali-cover.png",
      "score": 0.01,
      "tags": [
        "GO",
        "BACKEND"
      ]
    }
  ]
}
```

### Get Blog by ID

Get a specific blog by its MongoDB ObjectID.

```http
GET /blog/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the sample

**Response:**
```json
{
  "code": "10000",
  "status": 200,
  "message": "success",
  "data": {
    "_id": "66784670fa51e5414d99f747",
    "title": "Test Title",
    "description": "Test Description",
    "text": "<p>draft</p>",
    "slug": "test-url",
    "author": {
      "_id": "6678463efa51e5414d99f745",
      "name": "Janishar Ali"
    },
    "imgUrl": "https://janisharali.com/assets/ali-cover.png",
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "publishedAt": "2024-06-23T16:03:26.851Z"
  }
}
```

### Create Blog

Create a new blog document.

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
    "_id": "66784670fa51e5414d99f747",
    "title": "Test Title",
    "description": "Test Description",
    "draftText": "<p>draft</p>",
    "slug": "test-url",
    "author": {
      "_id": "6678463efa51e5414d99f745",
      "name": "Janishar Ali"
    },
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "submitted": false,
    "drafted": true,
    "published": false,
    "createdAt": "2024-06-23T15:59:44.942Z",
    "updatedAt": "2024-06-23T15:59:44.942Z"
  }
}
```

### Update Blog

Update an existing blog document.

```http
PUT /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the blog
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
  "message": "blog updated successfully",
  "data": {
    "_id": "66784670fa51e5414d99f747",
    "title": "Test Title",
    "description": "Test Description",
    "draftText": "<p>draft</p>",
    "slug": "test-url-2",
    "author": {
      "_id": "6678463efa51e5414d99f745",
      "name": "Janishar Ali"
    },
    "imgUrl": "https://janisharali.com/assets/ali-cover.png",
    "score": 0.01,
    "tags": [
      "GO",
      "BACKEND"
    ],
    "submitted": false,
    "drafted": true,
    "published": false,
    "createdAt": "2024-06-23T15:59:44.942Z",
    "updatedAt": "2024-06-23T16:00:57.677Z"
  }
}
```

### Delete Blog

Delete a blog document.

```http
DELETE /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the blog
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
      "_id": "66784450751bd4db00490891",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "_id": "66784418b8c142336899ea79",
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
      "_id": "66784450751bd4db00490891",
      "email": "ali@afteracademy.com",
      "name": "Janishar Ali",
      "roles": [
        {
          "_id": "66784418b8c142336899ea79",
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
    "_id": "66784633949a981aad99ea7d",
    "email": "admin@unusualcode.org",
    "name": "Admin",
    "roles": [
      {
        "_id": "66784633949a981aad99ea79",
        "code": "LEARNER"
      },
      {
        "_id": "66784633949a981aad99ea7a",
        "code": "WRITER"
      },
      {
        "_id": "66784633949a981aad99ea7b",
        "code": "EDITOR"
      },
      {
        "_id": "66784633949a981aad99ea7c",
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

### MongoDB ObjectID

All document IDs are MongoDB ObjectIDs, represented as 24-character hexadecimal strings.

**Example:** `507f1f77bcf86cd799439011`

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

- Try the [goserve Postgres Example](/postgres)
- Explore [goserve Microservice Example](/micro)