# Backend API

NestJS + TypeScript service (domain-driven design) powering the ERP Platform. See the root [`README.md`](../README.md) for the full feature overview and architecture notes, including the RBAC + ABAC access-control model.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run the API in watch mode |
| `npm run build` | Compile the service |
| `npm run start:prod` | Run the compiled service |
| `npm run seed` | Seed base data (roles, admin user) |
| `npm run seed:abac` | Seed roles, permissions, and ABAC baseline |
| `npm run test` | Run unit tests |

## Configuration

`.env.local` is a key-only template (no values). Fill in: `MONGODB_URI`, `DB_NAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_CALLBACK_URL`, `CORS_ORIGINS`, `SYSTEM_DELETE_SECRET`, `SYSTEM_CREATE_SUPERADMIN_SECRET`, and the seed credentials `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.

> Seeding requires `ADMIN_PASSWORD` and `SUPERADMIN_PASSWORD` to be set in the environment - there are no baked-in default credentials.

## Layout

```
src/
  config/             # env-driven configuration
  database/           # seeds & migrations
  domains/            # bounded contexts
    <domain>/
      application/     # use-cases, ports, services
      domain/         # entities, value-objects, events, policies
      infrastructure/  # mongoose persistence, adapters
      presentation/    # controllers, guards, strategies, decorators
  shared/             # cross-cutting kernel (DDD base, interceptors, filters)
```
