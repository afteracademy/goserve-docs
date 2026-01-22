# API Reference

Complete API endpoint reference for the goserve MongoDB blog platform. All endpoints require an API key in the `x-api-key` header.

## Base URL

```
http://localhost:8080
```

## Authentication

All API requests require an API key:

```bash
x-api-key: your-api-key-here
```

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

### Python

```python
import requests

class APIClient:
    def __init__(self, base_url="http://localhost:8080", api_key="your-api-key"):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        })

    def create_sample(self, field, status, token=None):
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        response = self.session.post(
            f"{self.base_url}/sample",
            json={"field": field, "status": status},
            headers=headers
        )
        return response.json()

    def get_samples(self):
        response = self.session.get(f"{self.base_url}/sample")
        return response.json()
```

## Next Steps

- Try the [Getting Started](/mongo/getting-started) guide to run the API
- Learn about [Architecture](/mongo/architecture) for implementation details
- Review [Configuration](/mongo/configuration) for setup options