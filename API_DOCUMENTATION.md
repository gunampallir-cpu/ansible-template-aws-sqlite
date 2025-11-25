# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All admin endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "gunampalli",
  "password": "Raja@1358"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "gunampalli",
    "is_admin": 1
  }
}
```

### Verify Token
```http
GET /auth/verify
Authorization: Bearer <token>
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

---

## OS Configuration Endpoints

### Get All OS Configurations (Admin Only)
```http
GET /os-config
Authorization: Bearer <token>
```

### Get OS Configuration by Platform
```http
GET /os-config/:platform
# platform: Linux or Windows
```

### Update OS Configuration (Admin Only)
```http
PUT /os-config/:platform
Authorization: Bearer <token>
Content-Type: application/json

{
  "os_platform": "Linux",
  "config_content": "ansible_become_user: root\n..."
}
```

---

## Ansible Roles Endpoints

### Get All Roles
```http
GET /ansible-roles?os_platform=Linux&search=web
```

### Get Role by ID
```http
GET /ansible-roles/:id
```

### Create Role (Admin Only)
```http
POST /ansible-roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_name": "nginx-setup",
  "os_platform": "Linux",
  "requires_ldap": false
}
```

### Update Role (Admin Only)
```http
PUT /ansible-roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_name": "nginx-setup",
  "os_platform": "Linux",
  "requires_ldap": true
}
```

### Delete Role (Admin Only)
```http
DELETE /ansible-roles/:id
Authorization: Bearer <token>
```

---

## Role Variables Endpoints

### Get All Variables (Admin Only)
```http
GET /role-variables?role_id=1&os_platform=Linux
Authorization: Bearer <token>
```

### Get Variable by ID (Admin Only)
```http
GET /role-variables/:id
Authorization: Bearer <token>
```

### Create Variable (Admin Only)
```http
POST /role-variables
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": 1,
  "os_platform": "Linux",
  "variable_content": "nginx_port: 80\nnginx_user: www-data"
}
```

### Update Variable (Admin Only)
```http
PUT /role-variables/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": 1,
  "os_platform": "Linux",
  "variable_content": "nginx_port: 8080\nnginx_user: nginx"
}
```

### Delete Variable (Admin Only)
```http
DELETE /role-variables/:id
Authorization: Bearer <token>
```

---

## TMPL Files Endpoints

### Get All TMPL Files (Admin Only)
```http
GET /tmpl-files
Authorization: Bearer <token>
```

### Get TMPL File by Environment
```http
GET /tmpl-files/:environment
# environment: dev, it, uat, prod, all
```

### Update TMPL File (Admin Only)
```http
PUT /tmpl-files/:environment
Authorization: Bearer <token>
Content-Type: application/json

{
  "environment": "dev",
  "file_content": "---\n- name: shared_roles\n..."
}
```

---

## GitLab CI Endpoints

### Get All Configs (Admin Only)
```http
GET /gitlab-ci?config_type=common&environment=dev
Authorization: Bearer <token>
```

### Get Config by ID (Admin Only)
```http
GET /gitlab-ci/:id
Authorization: Bearer <token>
```

### Create Config (Admin Only)
```http
POST /gitlab-ci
Authorization: Bearer <token>
Content-Type: application/json

{
  "config_type": "environment",
  "environment": "dev",
  "os_platform": "Linux",
  "role_id": null,
  "config_content": "Ansible_Dev_Setup:\n  stage: .pre\n..."
}
```

### Update Config (Admin Only)
```http
PUT /gitlab-ci/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "config_type": "environment",
  "environment": "dev",
  "os_platform": "Linux",
  "config_content": "Ansible_Dev_Setup:\n  stage: .pre\n..."
}
```

### Delete Config (Admin Only)
```http
DELETE /gitlab-ci/:id
Authorization: Bearer <token>
```

---

## Template Generation Endpoint

### Generate Template
```http
POST /template/generate
Content-Type: application/json

{
  "environment": "dev",
  "os_platform": "Linux",
  "vmGroups": [
    {
      "groupNumber": 1,
      "region": "",
      "hostnames": ["server1.example.com", "server2.example.com"],
      "roles": [1, 2],
      "os_platform": "Linux"
    }
  ],
  "mettaApplication": "MyApp",
  "mettaComponent": "API",
  "shieldTeam": "DevOps",
  "appContextSubscriptionName": "prod-subscription",
  "appContextName": "my-context",
  "armSubscriptionId": "abc-123-def-456",
  "sourcePath": "ldap/path",
  "targetIdentifier": "target-id",
  "assignmentGroup": "ops-team"
}
```

**Response:** ZIP file download (application/octet-stream)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error details (in development mode)"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Response on exceed:** 429 Too Many Requests

---

## CORS

- **Allowed Origin:** http://localhost:3000 (configurable via CORS_ORIGIN env var)
- **Credentials:** Supported

---

## Content Types

- **Request:** application/json
- **Response:** application/json (except file downloads)

---

## Testing Endpoints

You can test the API using:

### cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"gunampalli","password":"Raja@1358"}'

# Get roles
curl http://localhost:5000/api/ansible-roles
```

### Postman
Import the following collection or create requests manually.

### Browser DevTools
```javascript
// Login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'gunampalli',
    password: 'Raja@1358'
  })
})
.then(r => r.json())
.then(console.log);
```
