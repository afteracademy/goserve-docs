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
| Code | Message (example) | When it happens | Fix |
| --- | --- | --- | --- |
| 401 | permission denied: missing x-api-key header | Request lacked API key | Add `x-api-key: $API_KEY` |
| 403 | permission denied: invalid x-api-key | Kong/auth-service rejected key | Ensure the key exists in auth store and matches plugin config |
| 422 | validation error: ... | Invalid payload | Fix request body or params |
| 500 | something went wrong | Downstream service error | Check service logs (auth/blog) and retry |

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
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "LEARNER",
      "verified": false
    },
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
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
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "LEARNER",
      "verified": false
    },
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
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
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

### Verify API Key

Internal endpoint for Kong plugin to validate API keys.

```http
POST /auth/verify/apikey
```

**Request Body:**
```json
{
  "key": "your-api-key-here"
}
```

**Response:**
```json
{
  "valid": true
}
```

## Blog Service APIs

**Base Path:** `/blog`

### Get All Blogs (Public)

Get a list of all published blogs.

```http
GET /blog
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Blogs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "My First Blog",
      "description": "A great blog post",
      "slug": "my-first-blog",
      "authorId": "550e8400-e29b-41d4-a716-446655440000",
      "tags": ["tech", "golang"],
      "publishedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Blog by ID (Public)

Get a specific published blog by its MongoDB ObjectID.

```http
GET /blog/id/{id}
```

**Parameters:**
- `id` (string, required): MongoDB ObjectID of the blog

**Response:**
```json
{
  "success": true,
  "message": "Blog retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My First Blog",
    "description": "A great blog post",
    "content": "Full blog content here...",
    "slug": "my-first-blog",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": ["tech", "golang"],
    "status": "published",
    "publishedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Create Blog (Author Required)

Create a new blog post. Requires AUTHOR role or higher.

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
  "title": "My New Blog",
  "description": "An amazing blog post",
  "draftText": "This is the initial draft content...",
  "slug": "my-new-blog",
  "imgUrl": "https://example.com/image.jpg",
  "tags": ["technology", "programming"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My New Blog",
    "description": "An amazing blog post",
    "draftText": "This is the initial draft content...",
    "slug": "my-new-blog",
    "imgUrl": "https://example.com/image.jpg",
    "tags": ["technology", "programming"],
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Blog (Author Required)

Update an existing blog post. Requires AUTHOR role or higher, and ownership of the blog.

```http
PUT /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required): MongoDB ObjectID of the blog

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Request Body:**
```json
{
  "title": "Updated Blog Title",
  "description": "Updated description",
  "draftText": "Updated content...",
  "tags": ["technology", "golang", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated Blog Title",
    "description": "Updated description",
    "draftText": "Updated content...",
    "tags": ["technology", "golang", "updated"],
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Publish Blog (Editor Required)

Publish a draft blog post. Requires EDITOR role or higher.

```http
PUT /blog/editor/id/{id}/publish
```

**Parameters:**
- `id` (string, required): MongoDB ObjectID of the blog

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Blog published successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "published",
    "publishedAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Delete Blog (Author Required)

Delete a blog post. Requires AUTHOR role or higher, and ownership of the blog.

```http
DELETE /blog/author/id/{id}
```

**Parameters:**
- `id` (string, required): MongoDB ObjectID of the blog

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

## Health Check

**Base Path:** `/`

### Health Check

Check if the API gateway is healthy.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## Error Responses

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "field": "email",
    "reason": "must be a valid email address"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (validation failed)
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

### Blog Status

Blogs can have the following statuses:

- `draft` - Unfinished blog post, not visible publicly
- `published` - Published blog post, visible to all users

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

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Public endpoints**: 10 requests per minute
- **Authenticated endpoints**: 100 requests per minute
- **Health checks**: Unlimited

## SDK Examples

### JavaScript/TypeScript

```javascript
class GomicroAPI {
  constructor(baseURL = 'http://localhost:8000', apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.session = axios.create({
      baseURL,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Auth methods
  async signup(userData) {
    const response = await this.session.post('/auth/signup/basic', userData);
    return response.data;
  }

  async signin(credentials) {
    const response = await this.session.post('/auth/signin/basic', credentials);
    // Store token for authenticated requests
    this.session.defaults.headers.Authorization = `Bearer ${response.data.data.access_token}`;
    return response.data;
  }

  // Blog methods
  async getBlogs(params = {}) {
    const response = await this.session.get('/blog', { params });
    return response.data;
  }

  async createBlog(blogData) {
    const response = await this.session.post('/blog/author', blogData);
    return response.data;
  }

  async updateBlog(id, blogData) {
    const response = await this.session.put(`/blog/author/id/${id}`, blogData);
    return response.data;
  }

  async publishBlog(id) {
    const response = await this.session.put(`/blog/editor/id/${id}/publish`);
    return response.data;
  }

  async deleteBlog(id) {
    const response = await this.session.delete(`/blog/author/id/${id}`);
    return response.data;
  }
}

// Usage
const api = new GomicroAPI('http://localhost:8000', 'your-api-key');

// Authenticate
await api.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

const auth = await api.signin({
  email: 'john@example.com',
  password: 'password123'
});

// Use authenticated methods
const blogs = await api.getBlogs({ page: 1, limit: 10 });
const newBlog = await api.createBlog({
  title: 'My Blog',
  description: 'Blog description',
  draftText: 'Blog content...',
  slug: 'my-blog',
  tags: ['tech']
});
```

### Go Client

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type GomicroAPI struct {
    BaseURL     string
    APIKey      string
    AccessToken string
    Client      *http.Client
}

func NewGomicroAPI(baseURL, apiKey string) *GomicroAPI {
    return &GomicroAPI{
        BaseURL: baseURL,
        APIKey:  apiKey,
        Client:  &http.Client{},
    }
}

func (api *GomicroAPI) Signup(userData map[string]interface{}) (map[string]interface{}, error) {
    body, _ := json.Marshal(userData)
    req, _ := http.NewRequest("POST", api.BaseURL+"/auth/signup/basic", bytes.NewBuffer(body))
    req.Header.Set("x-api-key", api.APIKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := api.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func (api *GomicroAPI) Signin(credentials map[string]string) (map[string]interface{}, error) {
    body, _ := json.Marshal(credentials)
    req, _ := http.NewRequest("POST", api.BaseURL+"/auth/signin/basic", bytes.NewBuffer(body))
    req.Header.Set("x-api-key", api.APIKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := api.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    // Extract access token
    if data, ok := result["data"].(map[string]interface{}); ok {
        if token, ok := data["access_token"].(string); ok {
            api.AccessToken = token
        }
    }
    return result, nil
}

func (api *GomicroAPI) GetBlogs(page, limit int) (map[string]interface{}, error) {
    url := fmt.Sprintf("%s/blog?page=%d&limit=%d", api.BaseURL, page, limit)
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("x-api-key", api.APIKey)
    req.Header.Set("Authorization", "Bearer "+api.AccessToken)

    resp, err := api.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}
```

## Next Steps

- Try the [Getting Started](/micro/getting-started) guide to run the services
- Learn about [Architecture](/micro/architecture) for design details
- Review [Configuration](/micro/configuration) for setup options