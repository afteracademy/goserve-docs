# API Reference

Complete API endpoint reference for the goserve blog platform. All endpoints require an API key in the `x-api-key` header unless otherwise noted.

[![API Documentation](https://img.shields.io/badge/API%20Documentation-View%20Here-blue?style=for-the-badge)](https://documenter.getpostman.com/view/1552895/2sBXVihVLg)

## Base URL

```
http://localhost:8080
```

## At a glance
- **Auth**: `/auth/signup|signin|refresh|signout` (API key; JWT on refresh/signout)
- **Profile/User**: `/profile`, `/user` (API key; some routes JWT + role)
- **Blog public**: `/blogs`, `/blog/id/:id` (API key)
- **Author/editor**: `/blog/author`, `/blog/editor` (API key + JWT + role)
- **Admin**: `/admin/*` (API key + JWT + ADMIN role)

## Authentication

All API requests require an API key:

```bash
x-api-key: your-api-key-here
```

> No API key is seeded by default. Generate one following the steps in [Getting Started](/postgres/getting-started#1-create-an-api-key) or see [API key setup](/api-keys), then reuse that value in the examples below.

### Common errors
| Code | Message (example) | When it happens | Fix |
| --- | --- | --- | --- |
| 401 | permission denied: missing x-api-key header | No `x-api-key` header present | Add `x-api-key: $API_KEY` |
| 403 | permission denied: invalid x-api-key | Key not found/disabled | Create or use a valid key (see setup above) |
| 422 | validation error: ... | Invalid or missing fields | Fix request body or query params |
| 500 | something went wrong | Server-side error | Check logs; retry after investigating |

Protected endpoints additionally require JWT Bearer token:

```bash
Authorization: Bearer <access_token>
```

---

## Auth Controller

**Base Path:** `/auth`

### POST /auth/signup/basic

Register a new user account.

**Authentication:** API Key only  
**Authorization:** None

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePicUrl": null,
      "roles": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440000",
          "code": "LEARNER"
        }
      ]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid email format, weak password, or missing fields
- **409 Conflict:** Email already registered

---

### POST /auth/signin/basic

Sign in with email and password.

**Authentication:** API Key only  
**Authorization:** None

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": [...]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid credentials
- **404 Not Found:** User not registered

---

### POST /auth/token/refresh

Refresh access token using refresh token.

**Authentication:** API Key only  
**Authorization:** None

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Headers:**

```bash
Authorization: Bearer <expired_access_token>
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired refresh token
- **401 Unauthorized:** Token claims mismatch

---

### DELETE /auth/signout

Sign out and invalidate current session.

**Authentication:** API Key + Bearer Token  
**Authorization:** Authenticated user

**Request Headers:**

```bash
Authorization: Bearer <access_token>
x-api-key: your-api-key
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "signout success"
}
```

---

## User/Profile Controller

**Base Path:** `/profile`

### GET /profile/id/:id

Get public profile information by user ID.

**Authentication:** API Key only  
**Authorization:** None

**URL Parameters:**

- `id` (UUID) - User ID

**Example:**

```bash
GET /profile/id/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "profilePicUrl": "https://example.com/avatar.jpg"
  }
}
```

**Error Responses:**

- **404 Not Found:** User does not exist

---

### GET /profile/mine

Get authenticated user's private profile.

**Authentication:** API Key + Bearer Token  
**Authorization:** Authenticated user

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePicUrl": "https://example.com/avatar.jpg",
    "roles": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "code": "AUTHOR"
      }
    ]
  }
}
```

---

## Blog Controller (Public)

**Base Path:** `/blog`

### GET /blog/id/:id

Get published blog by ID with caching.

**Authentication:** API Key only  
**Authorization:** None

**URL Parameters:**

- `id` (UUID) - Blog ID

**Example:**

```bash
GET /blog/id/770e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "title": "Getting Started with Go",
    "description": "A comprehensive guide to Go programming",
    "text": "Full blog content here...",
    "slug": "getting-started-with-go",
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    },
    "imgUrl": "https://example.com/cover.jpg",
    "score": 0.85,
    "tags": ["GO", "PROGRAMMING"],
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- **404 Not Found:** Blog does not exist or is not published

---

### GET /blog/slug/:slug

Get published blog by slug with caching.

**Authentication:** API Key only  
**Authorization:** None

**URL Parameters:**

- `slug` (string) - URL-friendly blog identifier

**Example:**

```bash
GET /blog/slug/getting-started-with-go
```

**Response:** Same as GET /blog/id/:id

---

## Blogs Controller (Listing)

**Base Path:** `/blogs`

### GET /blogs/latest

Get paginated list of latest published blogs.

**Authentication:** API Key only  
**Authorization:** None

**Query Parameters:**

- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10, max: 100)

**Example:**

```bash
GET /blogs/latest?page=1&limit=20
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Getting Started with Go",
      "description": "A comprehensive guide to Go programming",
      "slug": "getting-started-with-go",
      "imgUrl": "https://example.com/cover.jpg",
      "publishedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /blogs/tag/:tag

Get paginated list of blogs by tag.

**Authentication:** API Key only  
**Authorization:** None

**URL Parameters:**

- `tag` (string) - Tag name (e.g., "GO", "JAVASCRIPT")

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Example:**

```bash
GET /blogs/tag/GO?page=1&limit=10
```

**Response:** Same structure as /blogs/latest

---

### GET /blogs/similar/id/:id

Get similar blogs based on blog ID.

**Authentication:** API Key only  
**Authorization:** None

**URL Parameters:**

- `id` (UUID) - Reference blog ID

**Example:**

```bash
GET /blogs/similar/id/770e8400-e29b-41d4-a716-446655440000
```

**Response:** Array of similar blogs with same structure as /blogs/latest

---

## Blog Author Controller

**Base Path:** `/blog/author`

**Note:** All endpoints require `AUTHOR` role.

### POST /blog/author/

Create a new blog draft.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role

**Request Body:**

```json
{
  "title": "Getting Started with Go",
  "description": "A comprehensive guide to Go programming",
  "draftText": "Blog draft content here...",
  "slug": "getting-started-with-go",
  "tags": ["GO", "PROGRAMMING"],
  "imgUrl": "https://example.com/cover.jpg"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "title": "Getting Started with Go",
    "description": "A comprehensive guide to Go programming",
    "text": null,
    "draftText": "Blog draft content here...",
    "slug": "getting-started-with-go",
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    },
    "imgUrl": "https://example.com/cover.jpg",
    "score": 0,
    "tags": ["GO", "PROGRAMMING"],
    "submitted": false,
    "drafted": true,
    "published": false,
    "status": true
  }
}
```

**Error Responses:**

- **400 Bad Request:** Slug already exists
- **400 Bad Request:** Validation errors

---

### PUT /blog/author/

Update an existing blog.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role (must be blog owner)

**Request Body:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "description": "Updated description",
  "draftText": "Updated draft content...",
  "slug": "updated-slug",
  "tags": ["GO", "TUTORIAL"],
  "imgUrl": "https://example.com/new-cover.jpg"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog updated successfully",
  "data": {
    // Updated blog object
  }
}
```

**Error Responses:**

- **404 Not Found:** Blog does not exist or you don't own it
- **400 Bad Request:** Slug already taken by another blog

---

### GET /blog/author/id/:id

Get blog by ID (author can see their own unpublished blogs).

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role (must be blog owner)

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    // Full blog object including draft fields
  }
}
```

**Error Responses:**

- **404 Not Found:** Blog not found or not owned by you

---

### DELETE /blog/author/id/:id

Deactivate (soft delete) a blog.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role (must be blog owner)

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog deleted successfully"
}
```

---

### PUT /blog/author/submit/id/:id

Submit blog for editor review.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role (must be blog owner)

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog submitted successfully"
}
```

---

### PUT /blog/author/withdraw/id/:id

Withdraw blog from editor review.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role (must be blog owner)

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog withdrawn successfully"
}
```

---

### GET /blog/author/drafts

Get paginated list of author's draft blogs.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Example:**

```bash
GET /blog/author/drafts?page=1&limit=10
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Draft Blog",
      "description": "Draft description",
      "slug": "draft-blog"
    }
  ]
}
```

---

### GET /blog/author/submitted

Get paginated list of author's submitted blogs (under review).

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:** Same structure as /blog/author/drafts

---

### GET /blog/author/published

Get paginated list of author's published blogs.

**Authentication:** API Key + Bearer Token  
**Authorization:** AUTHOR role

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:** Same structure as /blog/author/drafts

---

## Blog Editor Controller

**Base Path:** `/blog/editor`

**Note:** All endpoints require `EDITOR` role.

### GET /blog/editor/id/:id

Get any blog by ID (editors can see all blogs).

**Authentication:** API Key + Bearer Token  
**Authorization:** EDITOR role

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": {
    // Full blog object
  }
}
```

**Error Responses:**

- **404 Not Found:** Blog does not exist

---

### PUT /blog/editor/publish/id/:id

Publish a blog (make it publicly visible).

**Authentication:** API Key + Bearer Token  
**Authorization:** EDITOR role

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog published successfully"
}
```

---

### PUT /blog/editor/unpublish/id/:id

Unpublish a blog (remove from public view).

**Authentication:** API Key + Bearer Token  
**Authorization:** EDITOR role

**URL Parameters:**

- `id` (UUID) - Blog ID

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "blog unpublished successfully"
}
```

---

### GET /blog/editor/submitted

Get paginated list of all submitted blogs awaiting review.

**Authentication:** API Key + Bearer Token  
**Authorization:** EDITOR role

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Example:**

```bash
GET /blog/editor/submitted?page=1&limit=20
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "success",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Submitted Blog",
      "description": "Awaiting review",
      "slug": "submitted-blog"
    }
  ]
}
```

---

### GET /blog/editor/published

Get paginated list of all published blogs.

**Authentication:** API Key + Bearer Token  
**Authorization:** EDITOR role

**Query Parameters:**

- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:** Same structure as /blog/editor/submitted

---

## Contact Controller

**Base Path:** `/contact`

### POST /contact/

Submit a contact message.

**Authentication:** API Key only  
**Authorization:** None

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about API",
  "message": "I have a question..."
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "message received successfully!",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about API",
    "message": "I have a question..."
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid request parameters",
  "details": "email must be a valid email address"
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "permission denied",
  "details": "missing Authorization header"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "insufficient permissions",
  "details": "EDITOR role required"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "resource not found",
  "details": "blog not found"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "something went wrong",
  "details": "internal server error"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting in production.

## Pagination

All paginated endpoints accept:

- `page`: Page number (starting from 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination response format:

```json
{
  "status": "success",
  "message": "success",
  "data": [
    // Array of items
  ]
}
```

## Caching

The following endpoints utilize Redis caching:

- `GET /blog/id/:id` - Cached by blog ID
- `GET /blog/slug/:slug` - Cached by slug
- `GET /blogs/similar/id/:id` - Cached similar blogs

Cache TTL varies by endpoint. See [Core Concepts - Caching](/core-concepts#caching-strategy) for details.

## Testing Endpoints

Use the provided examples in [Getting Started](/getting-started) to test endpoints with cURL or Postman.

## Related

- [Getting Started](/getting-started) - Quick start with cURL examples
- [Core Concepts](/core-concepts) - Understand the architecture
- [Authentication](/core-concepts#authentication-jwt-with-rsa) - JWT implementation details
- [Authorization](/core-concepts#authorization-rbac) - Role-based access control
