# Hybrid RBAC & ABAC System Overview

> **Stack:** NestJS 11 + MongoDB + JWT
> **Model:** Hybrid RBAC (endpoint access) + ABAC (resource-level policies)
> **Performance:** O(1) bitmap-based RBAC checks, DB-driven dynamic ABAC conditions

---

## Table of Contents

1. [System at a Glance](#1-system-at-a-glance)
2. [Entity Relationships](#2-entity-relationships)
3. [Request Authorization Flow](#3-request-authorization-flow)
4. [API Reference](#4-api-reference)
5. [ABAC Policy System](#5-abac-policy-system)
6. [Permission Management Workflow](#6-permission-management-workflow)
7. [Usage Examples](#7-usage-examples)
8. [Complete FE-to-BE Request Flow](#8-complete-fe-to-be-request-flow)
9. [Configuration](#9-configuration)

---

## 1. System at a Glance

### Three-Layer Authorization

The system checks identity first, then endpoint access, then resource access. Think of it as: *"Are you who you say you are? Are you allowed to knock on this door? Are you allowed to touch what's behind it?"*

| Layer | Guard | Scope | Mechanism | Registration |
|-------|-------|-------|-----------|-------------|
| **Identity** | `JwtAuthGuard` | Verify the user's JWT token | RS256 signature verification, extract user info | Global (`APP_GUARD`) |
| **Endpoint Access (RBAC)** | `PermissionGuard` | Which API endpoints a user can call | O(1) bitmap bit check | Global (`APP_GUARD`) |
| **Resource Access (ABAC)** | `DynamicPolicyGuard` | Which specific records a user can read/write/delete | Database-driven policy evaluation | Global (`APP_GUARD`) |
| **Resource Access (Static ABAC)** | `PolicyGuard` | Hardcoded business-rule checks per endpoint | `IPolicyHandler` class evaluation | Per-endpoint (opt-in) |

**Execution order:** `JwtAuthGuard` → `PermissionGuard` → `DynamicPolicyGuard` → `PolicyGuard` (if applied)

*Example at a glance:* A manager logs in, gets a JWT with their permissions embedded. They call `GET /devices`. `JwtAuthGuard` confirms the token is valid. `PermissionGuard` checks their bitmap — bit #15 is set for "read devices", so they pass. `DynamicPolicyGuard` checks DB policies — a rule says "managers can read devices in their own department" — their department matches, so they pass. The controller returns only devices from their department.

### Who Bypasses What

| Condition | Decorator | What Gets Skipped |
|-----------|-----------|-------------------|
| Public endpoint | `@Public()` | JwtAuthGuard + PermissionGuard + DynamicPolicyGuard |
| Login/register required only | `@AuthOnly()` | PermissionGuard (but still needs valid JWT) |
| Superadmin user | `isSuperadmin: true` in JWT | PermissionGuard + DynamicPolicyGuard + PolicyGuard (all authorization checks) |
| No ABAC needed | Omit `@ResourceAction` | DynamicPolicyGuard passes through |
| No static policy needed | Omit `@CheckPolicy` | PolicyGuard passes through |

---

## 2. Entity Relationships

### RBAC Side (Endpoint Access)

```
User ──has many──> Role ──has many──> EndpointPermission
  |                                      |
  +-- isSuperadmin (bypass everything)    +-- bitIndex (position in bitmap)
  +-- permVersion (detects stale JWTs)    +-- method + pathPattern
  +-- departmentId (for ABAC)             +-- module + permission name
  +-- roleIds (roles assigned)
```

Permissions are combined via **OR**: if *any* of a user's roles grant a permission, the user has it. Revoking a permission from a single role does not remove it if another role still grants it.

### ABAC Side (Resource Access)

```
AbacPolicy ──scoped to──> Role (optional; empty = global)
  |
  +-- resource (e.g. "device", "purchase-order")
  +-- action (e.g. "read", "update", "approve")
  +-- effect ("allow" or "deny")
  +-- conditions[] (field, operator, value)
```

*Example:* A policy with `resource: "device"`, `action: "update"`, `effect: "deny"`, and condition `resource.status === "archived"` will block updates on archived devices for everyone.

### Request-Level Data

```
Bearer Token (JWT) ──decoded to──> req.user (userId, dept, bitmap, isSuperadmin)
Route Param :id ──────────────> ResourceLoaderInterceptor ──> req._resource (full DB document)
```

---

## 3. Request Authorization Flow

```
HTTP Request (Authorization: Bearer <jwt>)
     |
     v
┌────────────────────────────────────────────────────────────┐
│ [1] JwtAuthGuard                                          │
│     Verify JWT signature → decode payload → set req.user  │
│     @Public() endpoints skip this entirely                │
│     req.user = { userId, dept, bitmap, isSuperadmin,      │
│                  permVersion, roleIds }                   │
└──────────────────────┬─────────────────────────────────────┘
                       v
┌────────────────────────────────────────────────────────────┐
│ [2] PermissionGuard (RBAC, Global)                        │
│     @Public() / @AuthOnly() → skip                        │
│     isSuperadmin → let through                            │
│     RouteMapService.resolve(method, path) → bitIndex      │
│     UserPermCacheService: cache → JWT → DB recompute      │
│     Bit check: (bitmap[idx>>3] & (1 << (idx&7))) !== 0   │
│     Pass → continue    Fail → 403 Forbidden               │
└──────────────────────┬─────────────────────────────────────┘
                       v
┌────────────────────────────────────────────────────────────┐
│ [3] ResourceLoaderInterceptor (if @ResourceAction + :id)  │
│     Loads the target record from MongoDB via model        │
│     registry, attaches it as req._resource                │
│     Makes resource attributes available for ABAC checks   │
└──────────────────────┬─────────────────────────────────────┘
                       v
┌────────────────────────────────────────────────────────────┐
│ [4] DynamicPolicyGuard (Dynamic ABAC, Global)              │
│     No @ResourceAction on route? → pass through           │
│     isSuperadmin → let through                             │
│     Queries abac_policies collection:                      │
│       resource=X, action=Y, isActive=true                  │
│       AND (roleIds includes user's roles OR global)        │
│     Evaluate all "deny" policies first                     │
│       → any matching deny → 403                           │
│     Then evaluate all "allow" policies                     │
│       → at least one matching allow → pass                │
│       → none match → 403                                  │
└──────────────────────┬─────────────────────────────────────┘
                       v
┌────────────────────────────────────────────────────────────┐
│ [5] PolicyGuard (Static ABAC, Opt-in per endpoint)        │
│     No @CheckPolicy on route? → pass through              │
│     isSuperadmin → let through                             │
│     Execute custom IPolicyHandler.canAccess(user, context) │
└──────────────────────┬─────────────────────────────────────┘
                       v
                  Controller
```

### Permission Cache Strategy

```
UserPermCacheService (orchestrator)
     |
     ├─ Step 1: Check in-memory cache (TTL 60s, max 10K entries)
     |          Cache HIT + permVersion match → return cached bitmap
     |
     ├─ Step 2: DB permVersion == JWT permVersion?
     |          Yes → cache the JWT bitmap (user's perms haven't changed)
     |
     └─ Step 3: DB permVersion != JWT permVersion?
                No → recompute bitmap from DB (permissions changed)
                     User → Roles → EndpointPermissions → build Buffer
```

*Example:* A user's role is changed (permVersion bumped to 5). Their JWT still says version 4. On next request, the cache misses, DB shows version 5 ≠ JWT version 4, so the bitmap is recomputed with the new permissions. No forced logout needed.

### JWT Payload

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "pv": 3,
  "perms": "base64_encoded_bitmap",
  "sad": false,
  "dept": "department_id",
  "rids": ["role_id_1", "role_id_2"]
}
```

| Field | Description |
|-------|-------------|
| `sub` | User ID |
| `email` | User's email address |
| `pv` | Permission version (incremented when roles/permissions change) |
| `perms` | Base64-encoded permission bitmap (embedded for fast check) |
| `sad` | Is superadmin (bypasses all authorization) |
| `dept` | Department ID (used by ABAC policies) |
| `rids` | Array of role IDs assigned to the user |

---

## 4. API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register new user |
| `POST` | `/auth/login` | Public | Login, returns JWT with embedded bitmap |
| `POST` | `/auth/refresh` | Public | Refresh access token (recomputes bitmap) |
| `POST` | `/auth/logout` | JWT | Logout |
| `GET` | `/auth/google` | Public | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | Public | Google OAuth callback |

#### POST /auth/login

```json
// Request
{ "email": "admin@example.com", "password": "secret" }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "_id": "...",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "isSuperadmin": false
  }
}
```

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users` | JWT | List users (paginated, filtered) |
| `GET` | `/users/profile` | JWT | Get current user profile |
| `GET` | `/users/:id` | JWT | Get user by ID |
| `POST` | `/users` | JWT | Create user |
| `PUT` | `/users/profile` | JWT | Update own profile |
| `PUT` | `/users/:id` | JWT | Update user (bumps `permVersion` if roles change) |

### Roles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/roles` | JWT | List all roles |
| `GET` | `/roles/:id` | JWT | Get role by ID |
| `PUT` | `/roles/:id` | JWT | Update role (assign/revoke endpoint permissions) |

#### PUT /roles/:id

```json
{
  "description": "Device managers with full device CRUD",
  "permissionIds": ["64a1...", "64a2...", "64a3..."]
}
```

### Endpoint Permissions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/permissions` | JWT | List all permissions (paginated) |
| `POST` | `/permissions` | JWT | Create permission (atomically allocates `bitIndex`) |
| `PUT` | `/permissions/:id` | JWT | Update permission |
| `DELETE` | `/permissions/:id` | JWT | Soft delete permission |

### ABAC Policies (DB-Driven)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/abac-policies` | JWT | List all ABAC policies |
| `POST` | `/abac-policies` | JWT | Create an ABAC policy |
| `PUT` | `/abac-policies/:id` | JWT | Update an ABAC policy |
| `DELETE` | `/abac-policies/:id` | JWT | Delete an ABAC policy |

#### POST /abac-policies

```json
{
  "name": "Block archived device updates",
  "description": "Prevent updates on archived devices",
  "resource": "device",
  "action": "update",
  "effect": "deny",
  "roleIds": [],
  "conditions": [
    { "field": "resource.status", "operator": "equals", "value": "archived", "valueType": "static" }
  ]
}
```

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | MongoDB + Redis connection status |

---

## 5. ABAC Policy System

### Two Types of ABAC

| Type | Storage | Trigger | Example Use Case |
|------|---------|---------|-----------------|
| **Dynamic (DB-driven)** | `abac_policies` MongoDB collection | `@ResourceAction(resource, action)` decorator | "Managers can only approve purchase orders under $10,000" |
| **Static (Code-based)** | TypeScript classes (`IPolicyHandler`) | `@CheckPolicy(policy)` decorator + `@UseGuards(PolicyGuard)` | "Only the creator can delete their own device" |

### Dynamic Policies — How They Work

Policies are stored in MongoDB and evaluated at runtime by the `AbacRuleEngineService`. This lets admins create, update, and delete access rules without redeploying the application.

**Policy structure:**
```
{
  name: "Managers approve PO under $10K"
  resource: "purchase-order"
  action: "approve"
  effect: "allow"
  roleIds: ["manager_role_id"]      ← scoped to manager role; empty = global
  conditions: [
    { field: "resource.amount", operator: "lt", value: 10000, valueType: "static" },
    { field: "resource.departmentId", operator: "equals", value: "{{user.departmentId}}", valueType: "template" }
  ]
}
```

**Evaluation algorithm (deny-then-allow):**
1. Find all active policies matching `resource` + `action` + user's roles (or global)
2. Check all **deny** policies — if any condition set fully matches → **deny** (deny wins over allow)
3. Check all **allow** policies — if any condition set fully matches → **allow**
4. No policies found? → **allow** (RBAC already granted endpoint access)
5. No allow matched? → **deny** (default-deny when policies exist but none match)

**Supported condition operators:** `equals`, `notEquals`, `in`, `notIn`, `contains`, `gt`, `lt`, `gte`, `lte`, `exists`

**Template values:** Use `{{user.xxx}}` and `{{resource.xxx}}` to reference dynamic attributes. Supports dot-notation paths like `{{user.departmentId}}` or `{{resource.config.region}}`.

*Example:* A policy condition `resource.departmentId equals {{user.departmentId}}` means "the record's department must match the requesting user's department." When a user from department-A requests a record from department-B, the condition fails and access is denied.

### Static Policies (Built-in)

| Policy | Rule | Example |
|--------|------|---------|
| `DepartmentOwnershipPolicy` | `user.departmentId === target.departmentId` | A department admin can only manage their own department |
| `SameDepartmentPolicy` | `req._resource.departmentId === user.departmentId` | An employee can only view devices in their department |
| `OwnerOnlyPolicy` | `req._resource.createdBy === user.userId` | Only the person who created a device can delete it |
| `ActiveResourcePolicy` | `req._resource.isActive && !req._resource.deletedAt` | Block access to archived/deleted records |
| `DepartmentOrSharedPolicy` | `SameDepartment OR resource.isShared === true` | View records in your department or explicitly shared ones |

Combine them with `AndPolicy` (all must pass) or `OrPolicy` (any must pass).

*Example:* `new AndPolicy([new SameDepartmentPolicy(), new ActiveResourcePolicy()])` means "the record must be in your department AND must not be deleted."

### Resource Loading

The `ResourceLoaderInterceptor` automatically loads the target record from the database when a route has `@ResourceAction` and a `:id` path parameter. It uses a model registry (keyed by resource name like `"device"`, `"department"`) and attaches the full document to `req._resource`. This makes resource attributes like `status`, `departmentId`, `createdBy`, and `amount` available to both dynamic and static ABAC checks.

---

## 6. Permission Management Workflow

### Creating a New Protected Endpoint

```
1. Register the endpoint permission
   POST /permissions
   { method: "POST", pathPattern: "/devices", module: "device", permission: "write" }

2. System atomically allocates a bitIndex (e.g., 42)

3. Assign permission to a role
   PUT /roles/:roleId
   { permissionIds: [...existingIds, "new_permission_id"] }

4. Users with that role get the permission on next bitmap recomputation
   - Existing sessions: permVersion mismatch triggers recompute
   - New logins: bitmap computed fresh
```

*Example:* Adding a "Create Device" endpoint. Register the permission, assign it to the "Manager" role. All managers logging in will now have bit #42 set in their bitmap, granting access to `POST /devices`.

### Granting a User Access to a Module

```
1. Assign a role to the user
   PUT /users/:userId
   { roleIds: [...existingRoleIds, "new_role_id"] }

2. permVersion is atomically bumped

3. On the user's next request, PermissionGuard detects version mismatch → recomputes bitmap
   No forced logout. No manual cache invalidation.
```

*Example:* A technician needs device management access. Assign the "Device Manager" role. They can immediately use the new endpoints — no re-login required.

### Revoking Access

```
1. Remove the permission from the role
   PUT /roles/:roleId
   { permissionIds: [...] }  ← removed permission excluded

2. OR remove the role from the user
   PUT /users/:userId
   { roleIds: [...] }  ← removed role excluded

3. permVersion bump ensures next request triggers bitmap recomputation
```

### Creating a Dynamic ABAC Rule

```
1. POST /abac-policies
   {
     "name": "Managers can only update active devices in their department",
     "resource": "device",
     "action": "update",
     "effect": "allow",
     "roleIds": ["manager_role_id"],
     "conditions": [
       { "field": "resource.isActive", "operator": "equals", "value": true },
       { "field": "resource.departmentId", "operator": "equals", "value": "{{user.departmentId}}" }
     ]
   }

2. Immediate effect — no cache, no token refresh, no redeployment
```

---

## 7. Usage Examples

### Public Endpoint

```typescript
import { Public } from '../decorators/public.decorator';

@Public()
@Get('health')
async health() { ... }
// No JWT required. All guards bypassed.
```

### RBAC-Only Endpoint (Default)

```typescript
@Get('devices')
async findAll() { ... }
// Protected automatically by global PermissionGuard.
// No extra decorator needed — just ensure the endpoint has an EndpointPermission record.
```

### Dynamic ABAC Endpoint (DB-Driven)

```typescript
import { ResourceAction } from '../decorators/resource-action.decorator';

@ResourceAction('device', 'read')
@Get('devices/:id')
async findOne(@Param('id') id: string) { ... }
// DynamicPolicyGuard checks abac_policies for resource="device", action="read".
// ResourceLoaderInterceptor loads the device from MongoDB into req._resource.
```

### Dynamic ABAC with Custom Action

```typescript
@ResourceAction('purchase-order', 'approve')
@Post('purchase-orders/:id/approve')
async approve(@Param('id') id: string) { ... }
// Admins can create a policy:
//   "Manager can approve POs under $10K in their department"
//   with conditions on resource.amount and resource.departmentId
```

### Static ABAC Endpoint (Code-Based)

```typescript
import { CheckPolicy } from '../decorators/check-policy.decorator';
import { PolicyGuard } from '../guards/policy.guard';
import { AndPolicy } from '../policies/composite-policies';
import { SameDepartmentPolicy } from '../policies/same-department.policy';
import { ActiveResourcePolicy } from '../policies/active-resource.policy';

@UseGuards(PolicyGuard)
@CheckPolicy(new AndPolicy([
  new SameDepartmentPolicy(),
  new ActiveResourcePolicy(),
]))
@Put('devices/:id')
async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) { ... }
// User must be in the same department as the device AND the device must be active.
```

### Custom Static Policy

```typescript
import { IPolicyHandler } from './policy-handler.interface';

export class MaintenanceWindowPolicy implements IPolicyHandler {
  canAccess(user: any, context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const device = request._resource; // loaded by ResourceLoaderInterceptor
    const now = new Date();
    return now >= device.maintenanceStart && now <= device.maintenanceEnd;
  }
}

@UseGuards(PolicyGuard)
@CheckPolicy(new MaintenanceWindowPolicy())
@Post('devices/:id/maintenance')
async scheduleMaintenance(@Param('id') id: string) { ... }
```

---

## 8. Complete FE-to-BE Request Flow

This traces a single request from the browser all the way to the database response.

### Scenario

A **Manager** (from **Department X**) wants to update a specific device (`/api/v1/devices/abc123`). They have the "Manager" role with `device:update` permission (bitIndex = 15). A dynamic ABAC policy allows managers to update only active devices in their own department.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Browser)                                                      │
│                                                                         │
│  1. User logs in via POST /auth/login                                   │
│     → Backend returns JWT containing:                                   │
│       { sub, email, pv=3, perms=<base64 bitmap>, sad=false,            │
│         dept="dept_x", rids=["manager_role"] }                         │
│     → Frontend stores token in localStorage / httpOnly cookie           │
│                                                                         │
│  2. User navigates to Device Edit page, fills form, clicks "Save"       │
│     → Frontend sends:                                                   │
│                                                                         │
│       PUT /api/v1/devices/abc123                                       │
│       Authorization: Bearer eyJ...{jwt}...                             │
│       Content-Type: application/json                                    │
│       Body: { "name": "Sensor v2", "status": "active" }                │
│                                                                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────────────┐
│ BACKEND                                                                 │
│                                                                         │
│  STEP 1 — JwtAuthGuard (Identity)                                      │
│  ─────────────────────────────────                                      │
│  • Extracts "Bearer eyJ..." from Authorization header                  │
│  • Verifies RS256 signature against public key                          │
│  • Decodes payload → builds req.user object:                           │
│    { userId: "user_123",                                                │
│      email: "manager@company.com",                                     │
│      permVersion: 3,                                                   │
│      bitmap: Buffer<...>,   // bit 15 is set                           │
│      isSuperadmin: false,                                              │
│      departmentId: "dept_x",                                           │
│      roleIds: ["manager_role"] }                                       │
│  • Result: PASS ✅ (token is valid)                                    │
│                                                                         │
│  STEP 2 — PermissionGuard (RBAC — Endpoint Access)                     │
│  ───────────────────────────────────────────────                        │
│  • Route: PUT /api/v1/devices/abc123 → normalized to PUT /devices/:id │
│  • RouteMapService.resolve("PUT", "/devices/:id"):                     │
│      Regex matches endpoint permission record → bitIndex = 15          │
│  • UserPermCacheService.resolvePermissions("user_123"):                │
│      Cache MISS → DB permVersion (3) == JWT pv (3) → use JWT bitmap   │
│  • Bit check: bitmap[15 >> 3] = bitmap[1]                             │
│               1 << (15 & 7) = 1 << 7 = 128                             │
│               bitmap[1] & 128 = 128 ≠ 0                               │
│  • Result: PASS ✅ (bit 15 is set = user can update devices)           │
│                                                                         │
│  STEP 3 — ResourceLoaderInterceptor                                    │
│  ─────────────────────────────────                                      │
│  • Reads @ResourceAction('device', 'update') metadata                  │
│  • Route has :id param → loads device from MongoDB:                    │
│      Device.findById("abc123").lean()                                  │
│  • Result: req._resource = {                                          │
│      _id: "abc123", name: "Sensor v1",                                │
│      status: "active", departmentId: "dept_x",                        │
│      createdBy: "user_456", isActive: true }                          │
│                                                                         │
│  STEP 4 — DynamicPolicyGuard (Dynamic ABAC — Resource Access)          │
│  ─────────────────────────────────────────────────────────              │
│  • Reads @ResourceAction('device', 'update') metadata                  │
│  • isSuperadmin? No → proceed to policy evaluation                     │
│  • Queries MongoDB abac_policies where:                                │
│      resource = "device" AND action = "update" AND isActive = true     │
│      AND (roleIds contains "manager_role" OR roleIds is empty)         │
│  • Found 1 policy:                                                     │
│      {                                                                 │
│        name: "Managers update active devices in their dept",           │
│        effect: "allow",                                                │
│        conditions: [                                                   │
│          { field: "resource.isActive", op: "equals", value: true },    │
│          { field: "resource.departmentId", op: "equals",               │
│            value: "{{user.departmentId}}" }                            │
│        ]                                                               │
│      }                                                                 │
│  • Deny pass: no deny policies found                                   │
│  • Allow pass: evaluating conditions...                                │
│      Condition 1: resource.isActive = true == true → MATCH ✅          │
│      Condition 2: "{{user.departmentId}}" → resolves to "dept_x"       │
│                   resource.departmentId = "dept_x" == "dept_x" → MATCH ✅│
│      All conditions matched → effect is "allow"                        │
│  • Result: PASS ✅ (manager can update this device)                    │
│                                                                         │
│  STEP 5 — PolicyGuard (Static ABAC — Not Applied)                      │
│  ──────────────────────────────────────────────                          │
│  • No @CheckPolicy decorator on this route → skipped                   │
│                                                                         │
│  STEP 6 — Controller                                                    │
│  ───────────────────                                                    │
│  • DeviceController.update("abc123", { name: "Sensor v2", ... })       │
│  • Calls UpdateDeviceUseCase → validates, saves to DB                  │
│  • Returns 200 { _id: "abc123", name: "Sensor v2", ... }              │
│                                                                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Browser)                                                      │
│                                                                         │
│  3. Receives HTTP 200 OK with updated device data                       │
│  4. Shows success toast: "Device updated successfully"                  │
│  5. Refreshes device list / navigates back                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### What If the Request Was Denied?

Three possible rejection points:

| Step | Failure | HTTP Status | Example |
|------|---------|-------------|---------|
| JwtAuthGuard | Invalid/expired token | `401 Unauthorized` | Token expired 15 minutes ago |
| PermissionGuard | Bit not set in bitmap | `403 Forbidden` | User lacks "device:update" permission |
| DynamicPolicyGuard | DB policy conditions don't match | `403 Forbidden` | Device belongs to department Y, user is in department X |
| PolicyGuard | Static policy returns false | `403 Forbidden` | Device is archived (`isActive: false`) |

---

## 9. Configuration

### Guard Registration (app.module.ts)

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },        // Layer 1: Identity
  { provide: APP_GUARD, useClass: PermissionGuard },      // Layer 2: RBAC
  { provide: APP_GUARD, useClass: DynamicPolicyGuard },   // Layer 3: Dynamic ABAC
]
```

`PolicyGuard` (static ABAC) is **not global** — apply it per-endpoint with `@UseGuards(PolicyGuard)`.

### Cache Settings

| Setting | Value | Location |
|---------|-------|----------|
| TTL | 60 seconds | `InProcessPermCache` |
| Max entries | 10,000 | `InProcessPermCache` |
| Cleanup interval | Every 5 minutes | Cron job |

### Seed Data

On first startup, `abac.seed.ts` initializes:

- `SystemCounter` for atomic bitIndex allocation (starts at 0)
- Default endpoint permissions for all protected routes (14 modules)
- Default roles: admin, manager, leader, member
- Superadmin user (from `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` env vars)
- Each role gets appropriate endpoint permissions assigned

### Environment Variables

```env
JWT_SECRET=your-rsa-private-key
JWT_PUBLIC_KEY=your-rsa-public-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=initial-password
MONGODB_URI=mongodb://localhost:27017/erp-platform
```

---

For deep technical internals (bitmap algorithm, cache architecture, condition evaluation engine, schema details), see `ABAC-TECHNICAL-DETAIL.md`.
