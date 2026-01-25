# API Reference

Complete API endpoint reference for the goserve MongoDB blog platform. All endpoints require an API key in the `x-api-key` header.

[![API Documentation](https://img.shields.io/badge/API%20Documentation-View%20Here-blue?style=for-the-badge)](https://documenter.getpostman.com/view/1552895/2sBXVihVLg)

## Base URL

```
http://localhost:8080
```

## At a glance
- **Auth**: `/auth/signup|signin|refresh|signout` (API key; JWT on refresh/signout)
- **Samples**: `/sample`, `/sample/id/:id` (API key; write operations also need JWT)
- **Public listing**: `/samples` for simple read access (API key)

## Authentication

All API requests require an API key:

```bash
x-api-key: your-api-key-here
```

See [API key setup](/api-keys) for creating or reusing a key.

### Common errors
| Code | Message (example) | When it happens | Fix |
| --- | --- | --- | --- |
| 401 | permission denied: missing x-api-key header | No `x-api-key` header | Add `x-api-key: $API_KEY` |
| 403 | permission denied: invalid x-api-key | Key not found/disabled | Insert or use a valid key |
| 422 | validation error: ... | Invalid request payload | Correct the request body |
| 500 | something went wrong | Server-side error | Check service logs and retry |

## Sample API

**Base Path:** `/sample`

### Get All Samples

Get a list of all samples.

```http
GET /sample
```

**Response:**
```json
{
  "success": true,
  "message": "Samples retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "field": "Sample Document 1",
      "status": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Sample by ID

Get a specific sample by its MongoDB ObjectID.

```http
GET /sample/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the sample

**Response:**
```json
{
  "success": true,
  "message": "Sample retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "field": "Sample Document 1",
    "status": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Create Sample

Create a new sample document.

```http
POST /sample
```

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Request Body:**
```json
{
  "field": "New Sample Document",
  "status": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sample created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "field": "New Sample Document",
    "status": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Sample

Update an existing sample document.

```http
PUT /sample/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the sample

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Request Body:**
```json
{
  "field": "Updated Sample Document",
  "status": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sample updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "field": "Updated Sample Document",
    "status": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

### Delete Sample

Delete a sample document.

```http
DELETE /sample/id/{id}
```

**Parameters:**
- `id` (string, required) - MongoDB ObjectID of the sample

**Headers:**
```
Authorization: Bearer <jwt_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Sample deleted successfully"
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
      "id": "507f1f77bcf86cd799439011",
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
      "id": "507f1f77bcf86cd799439011",
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

## User API

**Base Path:** `/user`

### Get Current User

Get information about the currently authenticated user.

```http
GET /user/me
```

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "LEARNER",
    "verified": true,
    "createdAt": "2024-01-15T10:00:00Z"
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

## Rate Limiting

API endpoints are rate limited to prevent abuse. Default limits:

- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 10 requests per minute
- **Health checks**: Unlimited

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

## SDK Examples

### JavaScript/TypeScript

```javascript
// Initialize client
const apiClient = {
  baseURL: 'http://localhost:8080',
  apiKey: 'your-api-key-here'
};

// Create sample
const createSample = async (field, status) => {
  const response = await fetch(`${apiClient.baseURL}/sample`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiClient.apiKey,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ field, status })
  });

  return response.json();
};

// Get samples
const getSamples = async () => {
  const response = await fetch(`${apiClient.baseURL}/sample`, {
    headers: {
      'x-api-key': apiClient.apiKey
    }
  });

  return response.json();
};
```

### Go Client

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type APIClient struct {
    BaseURL string
    APIKey  string
    Client  *http.Client
}

func NewAPIClient(baseURL, apiKey string) *APIClient {
    return &APIClient{
        BaseURL: baseURL,
        APIKey:  apiKey,
        Client:  &http.Client{},
    }
}

func (c *APIClient) CreateSample(field string, status bool, token string) (map[string]interface{}, error) {
    data := map[string]interface{}{
        "field":  field,
        "status": status,
    }
    body, _ := json.Marshal(data)

    req, _ := http.NewRequest("POST", c.BaseURL+"/sample", bytes.NewBuffer(body))
    req.Header.Set("x-api-key", c.APIKey)
    req.Header.Set("Content-Type", "application/json")
    if token != "" {
        req.Header.Set("Authorization", "Bearer "+token)
    }

    resp, err := c.Client.Do(req)
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

- Try the [Getting Started](/mongo/getting-started) guide to run the API
- Learn about [Architecture](/mongo/architecture) for implementation details
- Review [Configuration](/mongo/configuration) for setup options