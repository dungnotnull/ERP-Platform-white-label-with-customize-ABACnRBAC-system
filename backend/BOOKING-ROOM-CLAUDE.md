# ASM Meeting Room Booking System

## Project Context
Integrating a "Meeting Room Booking" module into the existing ASMI system. 
Goal: Replace manual Google Spreadsheets, manage internal room bookings, prevent scheduling conflicts, track participant availability, and ensure cross-platform responsiveness specifically for this module.

## Tech Stack
- **Frontend:** Vite (TypeScript).
- **Backend:** NestJS implementing DDD (Domain-Driven Design) architecture.
- **Database:** MongoDB (Mongoose preferred).
- **Caching:** NO Redis. All queries, filters, and searches hit the database directly, relying on strict MongoDB Indexing.

## Architecture Rules (NestJS DDD)
1. **Domain Layer:** Contains Entities, Value Objects, and Domain Events. Must remain framework-agnostic.
2. **Application Layer:** Contains Use Cases (Commands/Queries), DTOs, and Application Services.
3. **Infrastructure Layer:** Contains Repository implementations, Database schemas (Mongoose), and Cronjobs.
4. **Presentation Layer:** Controllers and REST API endpoints.

## Core Business Rules (Must Follow)
- **Timezone:** The entire system defaults to Vietnam Time (GMT+7 / `Asia/Ho_Chi_Minh`).
- **Time Blocks:** Free selection. Users can pick any exact minute.
- **Past Operations Allowed:** Users ARE allowed to create, update, or delete bookings even if the `startTime` is in the past (useful for retrospective logging).
- **Open Permissions (Bookings):** Any authenticated user can create, update, or delete ANY booking. There are no strict Creator/Admin ownership restrictions for booking mutations at this stage.
- **Multi-Room Bookings:** A single booking can reserve multiple meeting rooms simultaneously (`roomIds` array). Conflict validation must ensure *none* of the requested rooms are occupied during the specified timeframe.
- **Conflict Tracking:** If users are double-booked, their IDs must be stored in the `conflictedUsers` array. When fetching details or statistics, the backend dynamically resolves the overlapping bookings.
- **Deletion & Audit Trail:** Use Soft Delete (`isDeleted: true`). Every mutation must be logged using MongoDB's `$push` operator into a nested `history` array.
- **Room Management:** Meeting rooms are NEVER hard-deleted. Use `isActive: false` to deactivate them. (Admin only).
- **Data Retention & Indexing:** A monthly cronjob hard-deletes `Bookings` older than 6 months. Strict compound indexes must be applied to support array queries (`roomIds`, `participantIds`) and time-range filters.

##  Code Style
- Enforce strict mode in TypeScript.
- Use clear, descriptive English for variables and functions.
- Centralize error handling using NestJS Exception Filters.
- No unnecessary comments when coding.
- Try to use Lodash for optimizing logic if possible.
