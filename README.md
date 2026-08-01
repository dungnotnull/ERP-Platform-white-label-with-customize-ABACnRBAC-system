# ERP Platform

A full-stack enterprise platform for managing people, assets, suppliers, and shared spaces — built on a hardened, granular access-control foundation.

## Overview

This monorepo contains two applications:

- **`frontend/`** — a React + Vite + TypeScript single-page application.
- **`backend/`** — a NestJS + TypeScript API following a domain-driven design (DDD) layout, backed by MongoDB.

The platform unifies several operational domains behind a single, permission-aware interface: identity & access, organization structure, asset lifecycle, supplier & purchasing, shared meeting-room booking, and audit logging. Every domain is exposed through a consistent REST API documented with OpenAPI/Swagger.

## Key capabilities

### Authentication
- Email & password registration and sign-in (bcrypt password hashing).
- Google OAuth sign-in, running side-by-side with email/password.
- JWT access + refresh token flow with automatic silent refresh and session recovery.
- New accounts start in an onboarding state; administrators assign roles and permissions before any protected access is granted.

### Advanced RBAC + ABAC security model
Access control is the centerpiece of the platform. It combines two complementary models so permissions can be expressed both broadly and with fine-grained, contextual precision.

**Role-Based Access Control (RBAC)**
- Roles group sets of permissions; users are assigned one or more roles.
- Permissions are managed as first-class resources (create / update / delete / list).
- Role–permission and user–role mappings are fully admin-managed through dedicated APIs.

**Attribute-Based Access Control (ABAC)**
- A dedicated policy engine evaluates attribute-driven rules at request time, allowing access decisions based on resource attributes, user attributes, and context (for example: department membership, ownership, or resource status).
- Composable policy handlers cover common patterns — owner-only, same-department, department-ownership, department-or-shared, and active-resource checks — and can be combined.
- Administrators create, update, and delete ABAC policies through the API; the request pipeline applies the resolved policy dynamically on every protected route.

**Endpoint-level permission enforcement**
- Every API route is registered as a discoverable endpoint and grouped into modules.
- Endpoint-permission rules map specific endpoints to required permissions, and a matcher resolves the applicable rule for each incoming request.
- A dynamic policy guard enforces the resolved permission/policy on each protected route.

**Performance-aware permission delivery**
- A user's granted permissions are computed into a compact bitmap and embedded in the access token, so the frontend can make instant access decisions without a round-trip to the server.
- An in-process permission cache and a per-user permission cache keep authorization fast, with automatic invalidation and revalidation when permissions change.
- A permission-version counter bumps whenever a user's permissions change, forcing token re-issuance with the freshest bitmap.

**Frontend authorization mirror**
- The frontend ships a permission guard that mirrors the backend endpoint-permission map, hiding or disabling UI the signed-in user cannot access and pre-checking requests before they are sent.

### Organization management
- Departments, positions, and internal users (employees) with CSV import/export.
- Supplier records, purchase orders, and order history tracking.

### Asset management
- Device inventory with types, statuses, and full lifecycle tracking.
- Device assignment and return workflows, maintenance scheduling, and device requests.
- Bulk import/export of devices.

### Meeting-room booking
- Bookable shared meeting rooms with availability and status views.
- A visual meeting-room map page.
- Booking versioning and integration support.

### Observability
- Centralized activity logging of key operations.
- Statistics dashboards for operational insight.

### Internationalization
- Multi-language UI (Vietnamese and Japanese) with runtime language detection and persistence.

## Tech stack

**Frontend** (`frontend/`)
- React, Vite, TypeScript
- Tailwind CSS with Radix UI primitives
- React Router, TanStack Query
- i18next, react-toastify
- Vite for development and production builds

**Backend** (`backend/`)
- NestJS, TypeScript — domain-driven design
- MongoDB with Mongoose
- Passport strategies: JWT, local (email/password), Google OAuth 2.0
- bcrypt password hashing, class-validator validation, Swagger/OpenAPI docs

## Getting started

### Prerequisites
- Node.js 20+
- A MongoDB instance (Atlas or self-hosted)

### Backend
1. `cd backend`
2. `npm install`
3. Open `backend/.env.local` and fill in the required values: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_CALLBACK_URL`, `CORS_ORIGINS`, and the system secrets.
4. `npm run start:dev`
5. Seed initial data / an admin account using the `npm run seed*` scripts as needed.

### Frontend
1. `cd frontend`
2. `npm install`
3. Open `frontend/.env.local` and set the API base URL (`VITE_SERVER_URL`), API path, API version, and port.
4. `npm run dev`

### Production build
- Frontend: `npm run build` (type-checks with `tsc -b`, then bundles with `vite build`)
- Backend: `npm run build`

## Project structure

```
.
├── frontend/   # React SPA (UI, auth, admin, dashboards)
└── backend/    # NestJS API — DDD domains (identity, organization, asset, booking-room, activity-log)
```