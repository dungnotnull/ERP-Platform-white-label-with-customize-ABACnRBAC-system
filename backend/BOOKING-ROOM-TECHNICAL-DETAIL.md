# MEETING ROOM BOOKING

## 1. System Architecture Overview
- **Frontend (Vite):** Renders a 1-week Timeline view. A single multi-room booking will be rendered across multiple room rows simultaneously.
- **Backend (NestJS DDD):** Provides RESTful APIs. Handles validations, multi-room conflict resolution, dynamic overlapping queries, statistics, and pagination.
- **Database (MongoDB):** Document-based storage. Utilizes Aggregation Pipelines heavily (especially `$unwind` for multi-room stats).

---

## 2. Database Schema Design (MongoDB)

### 2.1. Collection: `MeetingRooms`
- `_id`: ObjectId
- `name`: String
- `capacity`: Number
- `description`: String
- `isActive`: Boolean (Default: true)
- `createdAt` / `updatedAt`: Date

### 2.2. Collection: `Bookings` (Aggregate Root)
- `_id`: ObjectId
- `roomIds`: Array<ObjectId> (Ref: MeetingRooms - Supports multi-room bookings)
- `title`: String
- `departmentIds`: Array<ObjectId>
- `participantIds`: Array<ObjectId>
- `conflictedUsers`: Array<ObjectId> (Snapshot of users who had scheduling conflicts)
- `creatorId`: ObjectId
- `startTime`: Date (GMT+7)
- `endTime`: Date (GMT+7)
- `note`: String
- `status`: Enum ['SCHEDULED', 'CANCELLED', 'COMPLETED']
- `isDeleted`: Boolean (Default: false)
- `deletedAt`: Date | null
- `createdAt` / `updatedAt`: Date

**[Audit Trail - Nested Document]**
- `history`: Array<{ action: Enum, actorId: ObjectId, changes: Object, timestamp: Date }>

---

## 3. Core Logic & Validations (Backend)

### 3.1. Booking & Update Validations
- **Past Time Operations:** Allowed. Users can create, modify, or delete bookings that occurred in the past.
- **Open Access:** Any authenticated user can Update or Delete any booking. No ownership (Creator) or Admin checks are required for booking mutations.
- **Multi-Room Conflict (Hard Block):** Query MongoDB to ensure NONE of the selected `roomIds` have overlapping active bookings (`status != CANCELLED`, `isDeleted == false`).
  *Logic:* `{ roomIds: { $in: requestedRoomIds }, $or: [ { startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } } ] }`
  *Action:* If any room in the array is busy, throw an Exception (Block creation).
- **Participant Conflict (Warning & Tracking):** Check if any user in `participantIds` is already booked during this timeframe. 
  *Action:* Do NOT throw an error. Save the conflicting user IDs into the `conflictedUsers` array. Return this array in the API response so FE can display a warning.

### 3.2. Dynamic Conflict Resolution (Detail API)
- When calling `GET /api/v1/bookings/:id`, if `conflictedUsers` is not empty, the backend must perform a dynamic query to find the *actual* overlapping bookings for each conflicted user.
- **Response Structure Example:**
  ```json
  "conflictedUsersDetails": [
    {
      "userId": "user_123",
      "name": "Nguyen Van A",
      "overlappingBookings": [
        { "bookingId": "bk_456", "title": "Project Sync", "roomIds": ["room_1", "room_2"], "startTime": "...", "endTime": "..." }
      ]
    }
  ]
  ```

### 3.3. Room Management & Soft Delete Logic
- **Rooms:** Only Admins can mutate (Create/Update/Deactivate). Use `isActive: false` instead of hard delete.
- **Bookings:** Update `isDeleted = true`, `status = CANCELLED`. Push audit log to nested `history` array.

### 3.4. Database Indexing Strategy
To ensure high performance for multi-room conflict checks and timeline rendering without Redis, the following indexes are mandatory:

| **Collection** | **Index Keys** | **Type / Purpose** |
| :--- | :--- | :--- |
| `Bookings` | `{ roomIds: 1, startTime: 1, endTime: 1 }` | **Compound:** Crucial for fast multi-room conflict validation. |
| `Bookings` | `{ participantIds: 1, startTime: 1, endTime: 1 }` | **Compound:** Fast participant conflict checking and dynamic resolution. |
| `Bookings` | `{ endTime: 1, isDeleted: 1 }` | **Compound:** Optimizes the 6-month retention cronjob and timeline queries. |
| `MeetingRooms` | `{ isActive: 1 }` | **Single:** Quickly filter out deactivated rooms. |

---

## 4. Background Jobs (Cronjobs)
### 4.1. Data Retention Cleanup (Runs Monthly)
- **Schedule:** `0 0 1 * *`
- **Logic:** Execute `db.bookings.deleteMany({ endTime: { $lt: now() - 6 months } })`. Uses the `{ endTime: 1 }` index.

---

## 5. API Endpoints (Overview)

### Meeting Room APIs
| **Method** | **Endpoint** | **Description** | **Access** |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/rooms` | Fetch active meeting rooms | All Users |
| `GET` | `/api/v1/rooms/all` | Fetch ALL rooms (including inactive ones) | Admin |
| `POST` | `/api/v1/rooms` | Create a new meeting room | Admin |
| `PUT` | `/api/v1/rooms/:id` | Update room details | Admin |
| `DELETE` | `/api/v1/rooms/:id` | Deactivate room (`isActive: false`) | Admin |

### Booking APIs
| **Method** | **Endpoint** | **Description** | **Access** |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bookings/timeline` | Fetch timeline data (FE maps one booking to multiple room rows if `roomIds` has multiple items) | All Users |
| `GET` | `/api/v1/bookings/:id` | Get booking details (Dynamically resolves `conflictedUsersDetails`) | All Users |
| `POST` | `/api/v1/bookings` | Create a new booking (Accepts `roomIds` array, saves `conflictedUsers`) | All Users |
| `PUT` | `/api/v1/bookings/:id` | Update booking (Re-evaluates conflicts for all `roomIds` and participants) | All Users |
| `DELETE` | `/api/v1/bookings/:id` | Soft delete booking + push to history | All Users |

### Statistics APIs (Aggregation Pipeline)
| **Method** | **Endpoint** | **Description** | **Access** |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/statistics/conflicts/7-days` | Lists users with scheduling conflicts in the next 7 days and details of their overlapping bookings. | Admin |
| `GET` | `/api/v1/statistics/rooms/usage` | Total bookings and hours used per room (Requires `$unwind: "$roomIds"` to calculate accurately) | Admin |
| `GET` | `/api/v1/statistics/departments` | Number of bookings created per department | Admin |
| `GET` | `/api/v1/statistics/overview` | High-level metrics (total active rooms, etc.) | Admin |

### Integration APIs
| **Method** | **Endpoint** | **Description** | **Access** |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/departments/:id/users` | Fetch users by department | All Users |
