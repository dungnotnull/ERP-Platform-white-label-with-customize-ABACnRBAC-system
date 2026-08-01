# DYM Management API

Unified management system backend built with NestJS, following Domain-Driven Design (DDD) with hexagonal (ports & adapters) architecture.

## Architecture

The application is organized into **4 bounded contexts**, each with strict layer separation:

| Bounded Context | Domain |
|----------------|--------|
| **Identity** | Authentication, Users, Roles, Permissions, Endpoint Permissions, ABAC Policies |
| **Asset** | Device lifecycle, Assignments, Maintenance, Device Requests, Types, Statuses |
| **Organization** | Departments, Positions, Internal Users, Suppliers, Purchase Orders |
| **Activity Log** | Request logging, audit trail interceptor |

Each domain follows the same 4-layer structure:

```
presentation/     Controllers, DTOs, Guards, Strategies, Interceptors, Decorators
application/      Use Cases, Ports (interfaces), Services
domain/           Entities, Value Objects, Domain Services, Events, Enums
infrastructure/   Mongoose schemas, Repository implementations, Adapters
```

Cross-domain communication happens exclusively through application-layer port interfaces, implemented by adapters in the providing domain.

## Authorization System (Hybrid RBAC + ABAC)

The system uses a three-layer authorization model that executes on every request:

| Layer | Guard | Purpose |
|-------|-------|---------|
| **Identity** | `JwtAuthGuard` | Verify JWT token, extract user (userId, departmentId, bitmap, roles) |
| **RBAC** | `PermissionGuard` | O(1) bitmap check — is the user allowed to call this endpoint? |
| **ABAC** | `DynamicPolicyGuard` | Database-driven resource-level policies — which records can they access? |

**RBAC** controls *endpoint access* via a bitmap embedded in the JWT. Every endpoint permission gets a bit index; if the user's bitmap has that bit set, they can call the endpoint.

**ABAC** controls *resource access* via policies stored in MongoDB. Policies define conditions on user and resource attributes (e.g., "managers can update only active devices in their department"). Deny policies take precedence over allow policies.

A request to `PUT /api/v1/devices/:id` goes through:

```
JwtAuthGuard → PermissionGuard (bitmap) → ResourceLoaderInterceptor (loads record from DB)
→ DynamicPolicyGuard (evaluate ABAC policies) → Controller
```

Superadmin users bypass all authorization checks.

Full documentation:
- [ABAC System Overview](./ABAC-SYSTEM-OVERVIEW.md) — architecture, flow, examples
- [ABAC Technical Details](./ABAC-TECHNICAL-DETAIL.md) — bitmap algorithm, cache, schemas
- [RBAC & ABAC Real Examples](./RBAC-and-ABAC-system-real-examples.md) — test accounts, manual testing

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | NestJS 11 |
| Database | MongoDB Atlas |
| ODM | Mongoose 8 |
| Auth | Passport + JWT (stateless, RS256) |
| Authorization | Hybrid RBAC (bitmap) + ABAC (DB-driven policies) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger (OpenAPI) |
| CSV | csv-parser + json2csv |
| Testing | Jest + @nestjs/testing + mongodb-memory-server |

## Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas cluster (or local MongoDB)
- Google OAuth credentials (for social login)

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Start development server
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

Deploy thêm service trên EC2 (PM2 + Nginx, `api.erp-dev.dymvietnam.net`): xem [DEPLOY-EC2.md](../DEPLOY-EC2.md).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | — | `development` or `production` |
| `PORT` | Yes | `3000` | Server port |
| `API_PREFIX` | Yes | `api` | URL prefix for all routes |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `DB_NAME` | Yes | — | Database name |
| `MONGODB_URI_FOR_LOG_SYSTEM` | No | — | Separate MongoDB URI for activity logs |
| `DB_NAME_LOG_SYS` | No | — | Database name for activity logs |
| `JWT_ACCESS_SECRET` | Yes | — | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRATION` | Yes | — | Access token expiry (e.g., `24h`) |
| `JWT_REFRESH_EXPIRATION` | Yes | — | Refresh token expiry (e.g., `7d`) |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | — | Google OAuth callback URL |
| `FRONTEND_CALLBACK_URL` | No | — | Redirect URL after OAuth |
| `CORS_ORIGINS` | No | — | Comma-separated allowed origins |
| `REDIS_HOST` | No | — | Redis host (optional) |
| `REDIS_PORT` | No | — | Redis port (optional) |
| `SYSTEM_DELETE_SECRET` | No | — | Secret for system delete operations |
| `SYSTEM_CREATE_SUPERADMIN_SECRET` | No | — | Secret for superadmin creation |
| `SUPERADMIN_EMAIL` | No | — | Initial superadmin email (used by `seed:abac`) |
| `SUPERADMIN_PASSWORD` | No | — | Initial superadmin password (used by `seed:abac`) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **Auth** | | |
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/google` | Google OAuth init |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback |
| **Users** | | |
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/profile` | Get current user profile |
| PUT | `/api/v1/users/profile` | Update profile |
| GET | `/api/v1/users/:id` | Get user by ID |
| PUT | `/api/v1/users/:id` | Update user |
| **Roles** | | |
| GET | `/api/v1/roles` | List roles |
| GET | `/api/v1/roles/:id` | Get role by ID |
| PUT | `/api/v1/roles/:id` | Update role permissions |
| **Permissions** | | |
| GET | `/api/v1/permissions` | List endpoint permissions |
| POST | `/api/v1/permissions` | Create endpoint permission |
| PUT | `/api/v1/permissions/:id` | Update permission |
| DELETE | `/api/v1/permissions/:id` | Soft delete permission |
| **ABAC Policies** | | |
| GET | `/api/v1/abac-policies` | List ABAC policies |
| POST | `/api/v1/abac-policies` | Create ABAC policy |
| PUT | `/api/v1/abac-policies/:id` | Update ABAC policy |
| DELETE | `/api/v1/abac-policies/:id` | Delete ABAC policy |
| **Devices** | | |
| GET | `/api/v1/devices` | List devices |
| POST | `/api/v1/devices` | Create device |
| GET | `/api/v1/devices/:id` | Get device by ID |
| PUT | `/api/v1/devices/:id` | Update device |
| DELETE | `/api/v1/devices/:id` | Delete device |
| POST | `/api/v1/devices/import` | Import devices (CSV) |
| GET | `/api/v1/devices/export` | Export devices (CSV) |
| **Departments / Positions / Internal Users / Suppliers / Purchase Orders** | | Full CRUD with import/export |

Swagger documentation available at `GET /api/docs`.

## Scripts

```bash
npm run start:dev       # Development with hot reload
npm run build           # Production build
npm run start:prod      # Start production build
npm run seed            # Seed permissions, roles, admin user, device types/statuses
npm run seed:abac       # Required after seed: ABAC endpoint bitmap and roles
npm run seed:device-types   # Seed device type definitions
npm run seed:activity-logs  # Seed sample activity logs
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run lint            # Lint code
```

## License

Private. All rights reserved.
