# Test Cases Manual - Booking Queue Flow (Concurrency Control)

## Tổng quan

Flow Queue sử dụng:
- **Mutex Lock** (`BookingMutationLockService`): Serialize tất cả mutations (create, update, delete)
- **MongoDB Transactions**: Đảm bảo atomicity
- **Versioning** (`expectedVersion`): Optimistic locking

---

## Chuẩn bị trước khi test

### Prerequisites
- Server đang chạy: `npm run start:dev`
- MongoDB đang chạy
- Đã có dữ liệu seed: `npm run seed:abac`
- Dùng Postman/Thunder Client hoặc cURL
- **Thực tế**: Mở 2 tab Postman/terminal để gửi requests đồng thời

### Dữ liệu test cần có
- 2 Rooms: Room A, Room B (khác nhau)
- 2-3 Users để test concurrency
- Department hợp lệ

---

## NHÓM 1: CREATE - Concurrent Creation

### TC-01: Hai user tạo booking trùng room cùng lúc
**Mục đích**: Verify mutex ngăn conflict room

**Steps:**
```
Thread 1 & Thread 2 (GẦN NHƯ CÙNG LÚC):
POST /api/v1/bookings
{
  "roomIds": ["roomA_id"],
  "title": "Meeting A1" (Thread 1) / "Meeting A2" (Thread 2),
  "departmentIds": [],
  "participantIds": [],
  "startTime": "2026-07-10T10:00:00",
  "endTime": "2026-07-10T11:00:00"
}
```

**Expected:**
- 1 request: **201 Created**
- 1 request: **409 Conflict** (`RoomConflictException`)

**Verify DB:** Chỉ 1 booking được tạo

---

### TC-02: Hai user tạo booking KHÁC room cùng lúc
**Mục đích**: Verify mutex không block operations không conflict

**Steps:**
```
Thread 1 & Thread 2 (GẦN NHƯ CÙNG LÚC):
POST /api/v1/bookings
Thread 1: "roomIds": ["roomA_id"]
Thread 2: "roomIds": ["roomB_id"]
Cùng thời gian: 10:00-11:00
```

**Expected:**
- Cả 2: **201 Created** (Mutex serialize, nhưng không có conflict)

---

### TC-03: Concurrent create với multi-room (1 room conflict)
**Mục đích**: Verify multi-room booking bị block nếu 1 room bị occupy

**Steps:**
```
// Tạo booking A trước: roomIds = [roomA, roomB] (10:00-11:00)

// Sau đó:
POST /api/v1/bookings
{
  "roomIds": ["roomA_id", "roomC_id"]  // roomA conflict, roomC free
  ...
}
```

**Expected:**
- **409 Conflict** (vì roomA đã bị book)

---

### TC-04: Concurrent create với participant conflict (NOT room conflict)
**Mục đích**: Verify participant conflict chỉ ghi log, không block

**Steps:**
```
// Tạo booking A: roomA, participantIds = [userX] (10:00-11:00)

// Sau đó:
POST /api/v1/bookings
{
  "roomIds": ["roomB_id"],  // ROOM KHÁC
  "participantIds": ["userX_id"],  // USER CONFLICT
  "startTime": "2026-07-10T10:00:00",
  "endTime": "2026-07-10T11:00:00"
}
```

**Expected:**
- **201 Created**
- Response: `conflictedUsers: ["userX_id"]`

---

### TC-05: Create booking trong quá khứ
**Mục đích**: Verify system cho phép past bookings

**Steps:**
```
POST /api/v1/bookings
{
  "roomIds": ["roomA_id"],
  "startTime": "2026-06-01T10:00:00",  // QUÁ KHỨ
  "endTime": "2026-06-01T11:00:00"
}
```

**Expected:**
- **201 Created** (Past operations được allow)

---

### TC-06: Create với endTime <= startTime
**Mục đích**: Validate time range

**Steps:**
```
POST /api/v1/bookings
{
  "roomIds": ["roomA_id"],
  "startTime": "2026-07-10T11:00:00",
  "endTime": "2026-07-10T10:00:00"  // EARLIER
}
```

**Expected:**
- **400 Bad Request** (`InvalidTimeRangeException`)

---

## NHÓM 2: UPDATE - Concurrent Updates

### TC-07: Hai user update cùng booking (Version conflict)
**Mục đích**: Verify optimistic locking với version

**Steps:**
```
// Tạo booking: version = 0

Thread 1 & Thread 2 (GẦN NHƯ CÙNG LÚC):
PUT /api/v1/bookings/{booking_id}
Thread 1: { "title": "Edit A", "expectedVersion": 0 }
Thread 2: { "title": "Edit B", "expectedVersion": 0 }
```

**Expected:**
- 1 request: **200 OK** → booking version lên 1
- 1 request: **409 Conflict** (`BookingConcurrentModificationException`)
  - Body: `"expectedVersion: 0, currentVersion: 1"`

---

### TC-08: Update với wrong expectedVersion
**Mục đích**: Verify version check

**Steps:**
```
// Booking hiện tại: version = 2

PUT /api/v1/bookings/{booking_id}
{
  "title": "Edit",
  "expectedVersion": 1  // WRONG VERSION
}
```

**Expected:**
- **409 Conflict** (`BookingConcurrentModificationException`)

---

### TC-09: Update release room + Create takes room
**Mục đích**: Verify mutex serialize operations đúng thứ tự

**Steps:**
```
// Tạo booking A: roomA (10:00-11:00), version = 0

Thread 1 & Thread 2 (GẦN NHƯ CÙNG LÚC):
Thread 1: PUT /api/v1/bookings/{bookingA_id}
  { "roomIds": ["roomB_id"], "expectedVersion": 0 }  // RELEASE roomA

Thread 2: POST /api/v1/bookings
  { "roomIds": ["roomA_id"], "startTime": "2026-07-10T10:00:00", "endTime": "2026-07-10T11:00:00" }  // TAKE roomA
```

**Expected:**
- Cả 2: **SUCCESS** (Mutex: create chờ update xong rồi mới check conflict)

---

### TC-10: Update change time causing room conflict
**Mục đích**: Verify re-check room conflict khi update time

**Steps:**
```
// Booking A: roomA (09:00-10:00)
// Booking B: roomA (10:30-11:30), version = 0

PUT /api/v1/bookings/{bookingB_id}
{
  "roomIds": ["roomA_id"],
  "startTime": "2026-07-10T09:30:00",  // OVERLAP booking A
  "endTime": "2026-07-10T10:30:00",
  "expectedVersion": 0
}
```

**Expected:**
- **409 Conflict** (`RoomConflictException`)

---

### TC-11: Update change room causing conflict
**Mục đích**: Verify re-check khi đổi sang room đang busy

**Steps:**
```
// Booking A: roomA (10:00-11:00)
// Booking B: roomB (10:00-11:00), version = 0

PUT /api/v1/bookings/{bookingB_id}
{
  "roomIds": ["roomA_id"],  // roomA đang bị booking A occupy
  "expectedVersion": 0
}
```

**Expected:**
- **409 Conflict** (`RoomConflictException`)

---

### TC-12: Update participant causing participant conflict
**Mục đích**: Verify participant conflict re-check on update

**Steps:**
```
// Booking A: roomA (10:00-11:00), participantIds = [userX]
// Booking B: roomB (10:00-11:00), version = 0

PUT /api/v1/bookings/{bookingB_id}
{
  "roomIds": ["roomB_id"],
  "participantIds": ["userX_id"],  // userX đang conflict
  "expectedVersion": 0
}
```

**Expected:**
- **200 OK** (participant conflict chỉ ghi log, không block)
- Response: `conflictedUsers: ["userX_id"]`

---

### TC-13: Update booking không tồn tại
**Mục đích**: Validate booking exists

**Steps:**
```
PUT /api/v1/bookings/{non_existent_id}
{
  "title": "Edit",
  "expectedVersion": 0
}
```

**Expected:**
- **404 Not Found** (`BookingNotFoundException`)

---

### TC-14: Update với time range invalid
**Mục đích**: Validate time range on update

**Steps:**
```
PUT /api/v1/bookings/{booking_id}
{
  "startTime": "2026-07-10T11:00:00",
  "endTime": "2026-07-10T10:00:00",  // EARLIER
  "expectedVersion": 0
}
```

**Expected:**
- **400 Bad Request** (`InvalidTimeRangeException`)

---

## NHÓM 3: DELETE - Concurrent Deletion

### TC-15: Concurrent delete + update cùng booking
**Mục đích**: Verify delete và update không thể cùng thành công

**Steps:**
```
// Booking: version = 0

Thread 1 & Thread 2 (GẦN NHƯ CÙNG LÚT):
Thread 1: DELETE /api/v1/bookings/{booking_id}
  Body: { "expectedVersion": 0 }

Thread 2: PUT /api/v1/bookings/{booking_id}
  { "title": "Edit", "expectedVersion": 0 }
```

**Expected:**
- 1 request: **200/204 OK**
- 1 request: **409 Conflict** (`BookingConcurrentModificationException` hoặc `BookingAlreadyDeletedException`)

---

### TC-16: Delete với wrong expectedVersion
**Mục đích**: Verify version check on delete

**Steps:**
```
// Booking hiện tại: version = 2

DELETE /api/v1/bookings/{booking_id}
Body: { "expectedVersion": 1 }  // WRONG
```

**Expected:**
- **409 Conflict** (`BookingConcurrentModificationException`)

---

### TC-17: Delete booking đã deleted
**Mục đích**: Verify không thể double-delete

**Steps:**
```
// Booking: isDeleted = true, status = CANCELLED, version = 1

DELETE /api/v1/bookings/{booking_id}
Body: { "expectedVersion": 1 }
```

**Expected:**
- **400/409 Conflict** (`BookingAlreadyDeletedException`)

---

### TC-18: Concurrent delete same booking
**Mục đích**: Verify 2 delete requests không thể cùng succeed

**Steps:**
```
// Booking: version = 0

Thread 1 & Thread 2 (GẦN NHư CÙNG LÚC):
DELETE /api/v1/bookings/{booking_id}
Body: { "expectedVersion": 0 }
```

**Expected:**
- 1 request: **200/204 OK**
- 1 request: **409 Conflict** (version mismatch)

---

### TC-19: Delete booking không tồn tại
**Mục đích**: Validate booking exists on delete

**Steps:**
```
DELETE /api/v1/bookings/{non_existent_id}
Body: { "expectedVersion": 0 }
```

**Expected:**
- **404 Not Found** (`BookingNotFoundException`)

---

## NHÓM 4: TRANSACTION & ATOMICITY

### TC-20: Transaction rollback khi room conflict
**Mục đích**: Verify atomicity - conflict roll back toàn bộ

**Steps:**
```
POST /api/v1/bookings
{
  "roomIds": ["roomA_id"],  // roomA đang bị book
  "participantIds": ["userX", "userY", "userZ"],  // giả sử nhiều users
  ...
}
```

**Expected:**
- **409 Conflict**
- **Verify DB:**
  - Không có booking mới
  - Không có history record nào
  - Collection bookings không đổi

---

### TC-21: Transaction rollback khi version mismatch
**Mục đích**: Verify update atomic on version conflict

**Steps:**
```
// Booking: version = 1
// Client cầm version = 0 (stale data)

PUT /api/v1/bookings/{booking_id}
{
  "title": "Edit",
  "expectedVersion": 0
}
```

**Expected:**
- **409 Conflict**
- **Verify DB:**
  - Booking không đổi (title giữ nguyên)
  - Version không đổi
  - History không có record "UPDATED"

---

## NHÓM 5: EDGE CASES & BOUNDARIES

### TC-22: Update booking deleted bằng version cũ
**Mục đích**: Verify không thể update deleted booking

**Steps:**
```
// Booking: isDeleted = true, version = 1

PUT /api/v1/bookings/{booking_id}
{
  "title": "Edit deleted booking",
  "expectedVersion": 1
}
```

**Expected:**
- **409/400** (`BookingConcurrentModificationException` hoặc `BookingAlreadyDeletedException`)
- **Verify DB:** Booking không đổi

---

### TC-23: Concurrent update different fields (no conflict)
**Mục đích**: Verify 2 updates vẫn conflict dù khác field (vì cùng booking)

**Steps:**
```
// Booking: version = 0, title = "Old", note = "Old note"

Thread 1: PUT ... { "title": "New A", "expectedVersion": 0 }
Thread 2: PUT ... { "note": "New B", "expectedVersion": 0 }
```

**Expected:**
- 1: **200 OK**
- 1: **409 Conflict** (vì version đã increment)

---

### TC-24: Create với 3 rooms, 1 room conflict
**Mục đích**: Multi-room với partial conflict

**Steps:**
```
// Room A, B đang free, Room C đang occupy (10:00-11:00)

POST /api/v1/bookings
{
  "roomIds": ["roomA_id", "roomB_id", "roomC_id"],
  "startTime": "2026-07-10T10:00:00",
  "endTime": "2026-07-10T11:00:00"
}
```

**Expected:**
- **409 Conflict** (vì roomC)

---

### TC-25: Update shift time không conflict room
**Mục đích**: Update time nhưng không conflict với bookings khác

**Steps:**
```
// Booking A: roomA (09:00-10:00)
// Booking B: roomA (11:00-12:00), version = 0

PUT /api/v1/bookings/{bookingB_id}
{
  "roomIds": ["roomA_id"],
  "startTime": "2026-07-10T10:30:00",  // Still no overlap
  "endTime": "2026-07-10T11:30:00",
  "expectedVersion": 0
}
```

**Expected:**
- **200 OK** (no room conflict)

---

### TC-26: Concurrent operations: Create + Update + Delete
**Mục đích**: Stress test mutex với 3 operations

**Steps:**
```
// Booking A: roomA (10:00-11:00), version = 0

Thread 1: PUT /api/v1/bookings/{bookingA_id}
  { "roomIds": ["roomB_id"], "expectedVersion": 0 }

Thread 2: POST /api/v1/bookings
  { "roomIds": ["roomA_id"], "startTime": "2026-07-10T10:00:00", "endTime": "2026-07-10T11:00:00" }

Thread 3: DELETE /api/v1/bookings/{bookingA_id}
  { "expectedVersion": 0 }
```

**Expected:**
- Mutex serialize:
  - Tất cả requests chạy tuần tự
  - Chỉ 1 trong {Thread 1, Thread 3} succeed
  - Thread 2 chỉ succeed nếu Thread 1 release roomA

---

## NHÓM 6: MUTEX BEHAVIOR

### TC-27: Verify mutex blocks second request
**Mục đích**: Confirm mutex thực sự serialize

**Steps:**
```
// Booking A: roomA (10:00-11:00)

Thread 1: PUT /api/v1/bookings/{bookingA_id}
  { "title": "Long operation", "expectedVersion": 0 }
  // Đây là request đầu tiên vào mutex

Thread 2 (đợi 100ms rồi mới send):
  DELETE /api/v1/bookings/{bookingA_id}
  { "expectedVersion": 0 }
```

**Expected:**
- Thread 1: **200 OK** (xong trước)
- Thread 2: **409 Conflict** (vì Thread 1 đã change version)

---

### TC-28: Multiple concurrent operations on different bookings
**Mục đích**: Verify mutex global locks ALL mutations

**Steps:**
```
// Booking A, Booking B, Booking C khác nhau

Thread 1: PUT /api/v1/bookings/{bookingA_id}
Thread 2: PUT /api/v1/bookings/{bookingB_id}
Thread 3: DELETE /api/v1/bookings/{bookingC_id}
```

**Expected:**
- Mutex global: **ALL requests serialized**
- Response time: Sum của các request (không parallel)
- Tất cả succeed (không conflict)

---

## Checklist Test

### Khi test từng case, verify:
- [ ] HTTP status code đúng
- [ ] Response body chứa thông tin lỗi đúng (nếu có)
- [ ] Database state đúng (dùng MongoDB Compass/compass)
- [ ] Version increment đúng sau mutation
- [ ] History được update đúng
- [ ] Transaction atomicity (no partial data)

### Công cụ hỗ trợ:
- **MongoDB Compass**: Check database state
- **Server logs**: Xem mutex behavior, transactions
- **Postman**: Save collections để dễ test lại

---

## API Reference

```
POST   /api/v1/bookings
PUT    /api/v1/bookings/:id
DELETE /api/v1/bookings/:id
GET    /api/v1/bookings/:id
GET    /api/v1/bookings/timeline
```

### Payload mẫu:

**Create:**
```json
{
  "roomIds": ["room_id"],
  "title": "Meeting",
  "departmentIds": [],
  "participantIds": [],
  "startTime": "2026-07-10T10:00:00",
  "endTime": "2026-07-10T11:00:00",
  "note": "",
  "jpTitle": "",
  "jpNote": ""
}
```

**Update:**
```json
{
  "roomIds": ["room_id"],
  "title": "Updated",
  "departmentIds": [],
  "participantIds": [],
  "startTime": "2026-07-10T10:00:00",
  "endTime": "2026-07-10T11:00:00",
  "note": "",
  "jpTitle": "",
  "jpNote": "",
  "expectedVersion": 0
}
```

**Delete:**
```json
{
  "expectedVersion": 0
}
```

---

## Notes

- **Version**: Lấy từ response `version` sau mỗi create/update
- **expectedVersion**: BẮT BUỘC phải có cho update/delete
- **Mutex**: Global lock - tất cả mutations (any booking) đều serial
- **Transaction**: Tất cả operations trong transaction MongoDB
- **Timezone**: GMT+7 (Asia/Ho_Chi_Minh)
