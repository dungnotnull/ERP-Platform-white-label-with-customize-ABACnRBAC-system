# Technical Flow

How an incoming HTTP request traverses the ERP Platform API from arrival to response.

---

## Request Lifecycle

```
Client Request
     |
     v
[Express Server] (main.ts)
     |
     v
[Global Middleware]                          -- helmet, compression, hpp, CORS, body parsing, cookie parser
     |
     v
[RequestLoggingMiddleware]                  -- logs method, URL, response time
     |
     v
[JwtAuthGuard] (global, via APP_GUARD)      -- validates Bearer token, populates req.user
     |                                         (skipped on @Public() endpoints)
     v
[NestJS Router]                             -- resolves controller + method by URL pattern
     |
     v
[ValidationPipe] (global)                   -- validates & transforms DTO with class-validator
     |
     v
[Controller Method]
     |
     | 1. Extracts input from @Body(), @Query(), @Param(), @CurrentUser()
     | 2. Calls exactly one Use Case
     |
     v
[Use Case] (Application Layer)
     |
     | 1. Loads domain objects via Repository Ports
     | 2. Orchestrates business logic through Domain Entities/Value Objects
     | 3. Persists changes via Repository Ports
     | 4. Returns an output DTO
     |
     v
[Repository] (Infrastructure Layer)
     |
     | 1. Converts domain entity to Mongoose document via toObject()
     | 2. Executes MongoDB operation (find, create, update)
     | 3. Converts Mongoose document back to domain entity via toEntity()
     |
     v
[ResponseTransformInterceptor] (global)     -- wraps result in { success, data, message }
     |
     v
[HttpExceptionFilter] (global)              -- catches exceptions, returns { success, message, statusCode }
     |
     v
Client Response (JSON)
```

---

## Layer Responsibilities

| Layer | Location | Role |
|-------|----------|------|
| **Presentation** | `domains/*/presentation/` | Controllers, DTOs, Guards, Strategies. Zero business logic. A controller resolves one use case. |
| **Application** | `domains/*/application/` | Use cases (one class per operation), Port interfaces (repositories and cross-domain services), DTOs. Orchestrates domain objects, no business rules. |
| **Domain** | `domains/*/domain/` | Entities, Value Objects, Domain Services, Domain Events, Enums, Exceptions. Pure business logic, zero framework dependencies. |
| **Infrastructure** | `domains/*/infrastructure/` | Mongoose schemas, Repository implementations, Mappers, Adapters. Implements application-layer ports. |
| **Shared** | `shared/` | Base classes (Entity, AggregateRoot, ValueObject), use-case interface, global filters/interceptors/middleware. |

---

## Cross-Domain Communication

Domains never import from each other directly. They communicate through application-layer port interfaces:

```
Asset Domain  ---->  UserCheckingPort (interface defined in Asset)
                        |
                        v
                  UserCheckingAdapter (implemented in Identity)
```

```
Organization Domain  ---->  AssignmentQueryPort / DeviceCreationPort (interface in Organization)
                                |
                                v
                          AssignmentQueryAdapter / DeviceCreationAdapter (implemented in Asset)
```

The providing domain implements the adapter, exports it from its module, and the consuming domain wires it via `useExisting` in its module providers.

---

## Authentication Flow

1. **Register**: `POST /api/v1/auth/register` -> RegisterUseCase -> hashes password, creates User + Account, returns JWT
2. **Login**: `POST /api/v1/auth/login` -> LocalAuthGuard -> LocalStrategy -> LoginUseCase -> validates credentials, returns JWT
3. **Authenticated request**: JwtAuthGuard validates Bearer token, injects `{ _id, email, roleIds }` into `req.user`
4. **Google OAuth**: `GET /api/v1/auth/google` -> GoogleAuthGuard -> GoogleStrategy -> LoginWithGoogleUseCase

---

## Directory Map

```
src/
  main.ts                     -- Bootstrap, global middleware, Swagger setup
  app.module.ts               -- Root module, global APP_GUARD (JwtAuthGuard)
  config/                     -- Configuration (env-based)
  shared/
    domain/                   -- AggregateRoot, Entity, ValueObject, DomainEvent, Enums
    application/              -- IUseCase, IPort interfaces
    presentation/
      controllers/            -- HealthController
      decorators/             -- @CurrentUser(), @Public(), @ResponseMessage()
      filters/                -- HttpExceptionFilter
      interceptors/           -- ResponseTransformInterceptor, SanitizationInterceptor
      middleware/             -- RequestLoggingMiddleware
  domains/
    identity/                 -- Auth, Users, Roles, Permissions, Endpoint Permissions
    asset/                    -- Devices, Assignments, Maintenance, Requests, Types, Statuses
    organization/             -- Departments, Positions, Internal Users, Suppliers, Purchase Orders
```

---

## Key Conventions

- Every use case is a class implementing `IUseCase<Input, Output>` with a single `execute()` method.
- Controllers inject use cases, never repositories.
- MongoDB auto-generates `_id` (ObjectId). Domain entities receive the persisted ID after save.
- Cross-domain adapters live in the providing domain's infrastructure layer.
- `@Public()` decorator bypasses the global JWT guard for public endpoints (health, register, login, Google OAuth).
