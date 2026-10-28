# API contract — Study Groups & Chat (DA2)

Hợp đồng giữa FE và BE cho module Study Group + Chat. FE dựng UI theo đúng file này (qua mock trong `src/mocks/`), BE implement đúng shape này. Thay đổi hợp đồng thì sửa file này trước, rồi mới sửa code hai bên.

## Quy ước chung

- Base URL: `/api/v1`, mọi endpoint đều cần `Authorization: Bearer <accessToken>`.
- Response thành công: `{ "success": true, "message": "...", "data": <payload> }`.
- Response lỗi: `{ "success": false, "message": "..." }` với status:

| Status | Khi nào |
|---|---|
| 400 | Dữ liệu không hợp lệ (thiếu field, sai enum, quá độ dài) |
| 403 | Không phải thành viên nhóm, hoặc không đủ quyền (không phải owner) |
| 404 | Không tìm thấy nhóm / task / goal / resource, hoặc invite code sai |
| 409 | Xung đột trạng thái (đã là thành viên, owner rời nhóm) |
| 429 | Nhắc nhở quá nhanh (cooldown 24h) |

- Thời gian: ISO 8601 UTC (`2026-10-08T02:00:00.000Z`).
- ID: UUID (mock dùng chuỗi `mock-*`).
- Các field có hậu tố `is*`, `percent*`, `progress` là **server tính**, client không gửi lên.

## Quyền

| Hành động | Owner | Member |
|---|---|---|
| Xem nhóm, thành viên, tài liệu, goal, task, progress, chat | ✓ | ✓ |
| Sửa/xóa nhóm, tạo lại invite code, xóa thành viên | ✓ | |
| Rời nhóm | ✗ (phải xóa nhóm) | ✓ |
| Thêm tài liệu | ✓ | ✓ |
| Xóa tài liệu | ✓ | chỉ tài liệu mình chia sẻ |
| Tạo/sửa/xóa goal | ✓ | |
| Tạo/sửa nội dung task | ✓ | task mình tạo |
| Đổi trạng thái task | ✓ | chỉ task được giao cho mình |
| Xóa task | ✓ | chỉ task mình tạo |
| Nhắc thành viên (remind) | ✓ | |
| Gửi tin nhắn | ✓ | ✓ |

## Entity

### UserSummary

```json
{ "userId": "uuid", "fullName": "Đỗ Như Quỳnh", "avatarUrl": null }
```

### Group

```json
{
  "id": "uuid",
  "name": "Capstone Project Team",
  "description": "Weekly sync for the DA2 project",
  "avatarUrl": "https://cdn.example.com/groups/avatar.webp",
  "inviteCode": "CAPS-7KQ9",
  "owner": { "userId": "uuid", "fullName": "Ngọc Đào", "avatarUrl": null },
  "myRole": "owner",
  "memberCount": 3,
  "progress": {
    "goalPercent": 30,
    "overdueTaskCount": 1,
    "blockedTaskCount": 1,
    "isBehind": true
  },
  "lastMessage": {
    "id": "uuid",
    "content": "Demo data will be ready tomorrow.",
    "attachmentCount": 0,
    "sender": { "userId": "uuid", "fullName": "Trần Minh", "avatarUrl": null },
    "createdAt": "..."
  },
  "unreadCount": 2,
  "isPinned": false,
  "isMuted": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

- `myRole`: `owner` | `member` (vai trò của người đang gọi API).
- `avatarUrl`: ảnh nhóm do owner tùy chỉnh, `null` khi dùng avatar chữ mặc định.
- `lastMessage`: tin mới nhất mà người gọi còn thấy (sau khi xóa lịch sử thì tính từ `clearedAt`), `null` nếu không có.
- `unreadCount`: số tin của **người khác** gửi sau `lastReadAt` của người gọi. `lastReadAt` lưu trên bản ghi thành viên, lúc tạo/tham gia nhóm bằng `joinedAt`; gửi tin cũng cập nhật `lastReadAt` của người gửi.
- `isPinned`, `isMuted`: cài đặt **riêng của người gọi** (lưu trên bản ghi thành viên). `isMuted = true` thì server không tạo notification tin nhắn mới cho người đó (notification task vẫn gửi).
- `progress.goalPercent`: trung bình `percentComplete` các goal của nhóm, `null` nếu nhóm chưa có goal.
- `progress.isBehind`: `true` nếu có goal đang chậm hoặc có task quá hạn.

### Member

```json
{ "userId": "uuid", "fullName": "...", "email": "...", "avatarUrl": null, "role": "member", "joinedAt": "..." }
```

### Resource

```json
{
  "id": "uuid",
  "groupId": "uuid",
  "type": "file",
  "title": "Chapter 3 slides",
  "description": "Read before Thursday",
  "url": null,
  "refId": "uuid",
  "ref": {
    "contentId": "uuid",
    "title": "Chapter 3 slides",
    "excerpt": null,
    "fileUrl": "https://res.cloudinary.com/.../chapter-3.pdf",
    "fileName": "chapter-3.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1048576
  },
  "sharedBy": { "userId": "uuid", "fullName": "...", "avatarUrl": null },
  "createdAt": "..."
}
```

- `type`:
  - `link`: link nhập tay, cần `url` (http/https). `refId`, `ref` = `null`.
  - `note`: chia sẻ một content item loại `note` của người chia sẻ, cần `refId`.
  - `file`: chia sẻ một content item loại `file` của người chia sẻ, cần `refId`.
- `ref` là **bản chụp** content item tại thời điểm chia sẻ (BE tự đọc từ `refId`, kiểm tra item thuộc về người gọi và đúng loại; sai → 400/404). Vì API `/content/*` chỉ cho chủ sở hữu đọc, thành viên khác xem ghi chú/file qua `ref`:
  - `note`: `excerpt` = nội dung ghi chú dạng text (tối đa 5000 ký tự), các field file = `null`.
  - `file`: `fileUrl`, `fileName`, `mimeType`, `fileSize` lấy từ content item, `excerpt = null`.
- `title`: 1–200 ký tự (FE mặc định lấy tiêu đề content item). `description`: tối đa 500 ký tự, có thể `null`.

### Goal

```json
{
  "id": "uuid",
  "groupId": "uuid",
  "title": "Finish UI prototype",
  "description": "",
  "unit": "tasks",
  "targetValue": 10,
  "currentValue": 3,
  "startDate": "...",
  "endDate": "...",
  "percentComplete": 30,
  "timeElapsedPercent": 67,
  "isBehind": true,
  "createdBy": { "userId": "uuid", "fullName": "...", "avatarUrl": null },
  "createdAt": "..."
}
```

- Group goal luôn theo task; client không gửi `unit`, `currentValue`, `targetValue`. Server luôn trả `unit = "tasks"`.
- `targetValue` = số task có `goalId` này; `currentValue` = số task trong đó có `status = "done"`; `percentComplete = round(currentValue / targetValue * 100)`. Nếu chưa có task thì bằng 0.
- `timeElapsedPercent` = % thời gian đã trôi qua giữa `startDate` và `endDate` (kẹp 0–100).
- `isBehind = percentComplete < 100 && percentComplete < timeElapsedPercent`.
- Tạo/xóa task, đổi `goalId`, hoặc owner/assignee đổi trạng thái task phải làm kết quả goal được tính lại trong cùng request/transaction; FE không tự cộng trừ.

### Task

```json
{
  "id": "uuid",
  "groupId": "uuid",
  "goalId": null,
  "title": "Implement chat UI",
  "description": "",
  "assignee": { "userId": "uuid", "fullName": "...", "avatarUrl": null },
  "status": "todo",
  "effectiveStatus": "blocked",
  "dueAt": "...",
  "dependsOnTaskId": "uuid",
  "isOverdue": false,
  "isBlocked": true,
  "blockedBy": { "id": "uuid", "title": "Write API contract" },
  "completedAt": null,
  "createdBy": { "userId": "uuid", "fullName": "...", "avatarUrl": null },
  "createdAt": "...",
  "lastRemindedAt": null
}
```

- `status`: `todo` | `doing` | `done` (trạng thái thao tác được lưu; client chỉ gửi 3 giá trị này).
- `effectiveStatus`: `blocked` nếu `isBlocked = true`, ngược lại bằng `status`. FE dùng field này để hiển thị cột/badge trạng thái.
- `isBlocked`: server tính — `true` khi task hiện tại chưa `done` và task tiền đề đã **quá hạn, chưa `done`**. Không lưu `blocked` vào `status`: khi task tiền đề hoàn thành, task phụ thuộc tự trở lại `todo`/`doing`.
- `isOverdue`: `status !== "done"` và `dueAt` đã qua.
- `dependsOnTaskId` phải là task cùng nhóm, khác chính nó và không tạo chu trình phụ thuộc (A → B → A).

### GroupProgress

```json
{
  "groupId": "uuid",
  "goals": [
    { "id": "uuid", "title": "...", "percentComplete": 30, "timeElapsedPercent": 67, "isBehind": true }
  ],
  "tasks": { "total": 4, "done": 1, "overdue": 1, "blocked": 1 },
  "members": [
    { "userId": "uuid", "fullName": "...", "avatarUrl": null, "assigned": 2, "done": 1, "overdue": 0 }
  ],
  "isBehind": true
}
```

### Message

```json
{
  "id": "uuid",
  "groupId": "uuid",
  "sender": { "userId": "uuid", "fullName": "...", "avatarUrl": null },
  "content": "Hello team! https://docs.google.com/...",
  "attachments": [
    {
      "id": "uuid",
      "kind": "image",
      "name": "wireframe.png",
      "mimeType": "image/png",
      "size": 204800,
      "url": "https://.../wireframe.png"
    }
  ],
  "createdAt": "..."
}
```

- `kind`: `image` (mimeType `image/*`) | `file` (còn lại).
- `content` có thể rỗng nếu tin chỉ gồm đính kèm. Link trong `content` do FE tự nhận diện để hiển thị preview.

### SharedItem (kho Ảnh/Video, File, Link của nhóm)

```json
{ "id": "uuid", "messageId": "uuid", "kind": "image", "name": "wireframe.png", "mimeType": "image/png", "size": 204800, "url": "https://...", "sender": { "userId": "uuid", "fullName": "...", "avatarUrl": null }, "createdAt": "..." }
```

- Với `type=link`: `kind = "link"`, `name` = hostname, `mimeType`/`size` = `null`, `url` = link trích từ `content`.

## Endpoint

### Groups

| Method | Path | Body | Data trả về | Quyền |
|---|---|---|---|---|
| GET | `/groups` | | `Group[]` (nhóm mình tham gia; nhóm ghim trước, sau đó hoạt động gần nhất trước) | đăng nhập |
| POST | `/groups` | `{ name, description? }` | `Group` (người tạo là owner) | đăng nhập |
| GET | `/groups/:groupId` | | `Group` | member |
| PATCH | `/groups/:groupId` | multipart: `name?`, `description?`, `avatar?`, `removeAvatar?` | `Group` | owner |
| DELETE | `/groups/:groupId` | | `null` | owner |
| POST | `/groups/join` | `{ inviteCode }` | `Group` | đăng nhập |
| POST | `/groups/:groupId/leave` | | `null` | member (owner → 409) |
| POST | `/groups/:groupId/invite-code` | | `{ inviteCode }` (mã mới) | owner |
| PATCH | `/groups/:groupId/me` | `{ pinned?, muted? }` (boolean) | `Group` | member |

- `name`: 1–100 ký tự. `description`: tối đa 500 ký tự.
- `inviteCode` so khớp không phân biệt hoa thường. Đã là thành viên → 409.
- `avatar` chỉ nhận file ảnh tối đa 5 MB. File mới thay thế file cũ; `removeAvatar=true` đưa `avatarUrl` về `null`.

### Members

| Method | Path | Data trả về | Quyền |
|---|---|---|---|
| GET | `/groups/:groupId/members` | `Member[]` | member |
| DELETE | `/groups/:groupId/members/:userId` | `null` | owner (không tự xóa mình) |

Xóa thành viên thì các task đang giao cho người đó chuyển về `assignee: null`.

### Resources

| Method | Path | Body | Data trả về |
|---|---|---|---|
| GET | `/groups/:groupId/resources` | | `Resource[]` (mới nhất trước) |
| POST | `/groups/:groupId/resources` | `{ type, title, description?, url?, refId? }` | `Resource` |
| DELETE | `/groups/:groupId/resources/:resourceId` | | `null` |

### Goals

| Method | Path | Body | Data trả về |
|---|---|---|---|
| GET | `/groups/:groupId/goals` | | `Goal[]` |
| POST | `/groups/:groupId/goals` | `{ title, description?, startDate, endDate }` | `Goal` |
| PATCH | `/groups/:groupId/goals/:goalId` | các field trên (tùy chọn) | `Goal` |
| DELETE | `/groups/:groupId/goals/:goalId` | | `null` |

- Không gửi `unit`, `targetValue`, `currentValue`; server trả số liệu dẫn xuất từ task.
- `endDate > startDate`.
- Khi sửa khoảng ngày goal, mọi task đang gắn goal phải có `dueAt` nằm trong khoảng mới; nếu không → 400 và trả tên task vi phạm.
- Xóa goal thì các task gắn goal đó chuyển về `goalId: null`.

### Tasks

| Method | Path | Body / Query | Data trả về |
|---|---|---|---|
| GET | `/groups/:groupId/tasks` | query `status?`, `assigneeId?` | `Task[]` |
| POST | `/groups/:groupId/tasks` | `{ title, description?, assigneeId?, dueAt?, dependsOnTaskId?, goalId? }` | `Task` (status `todo`) |
| PATCH | `/groups/:groupId/tasks/:taskId` | các field trên + `status?` | `Task` |
| DELETE | `/groups/:groupId/tasks/:taskId` | | `null` |
| POST | `/groups/:groupId/tasks/:taskId/remind` | | `{ remindedAt, nextAllowedAt }` |

- `assigneeId` phải là thành viên nhóm.
- Nếu có `goalId` và `dueAt`, deadline task phải nằm trong `[goal.startDate, goal.endDate]`; ngoài khoảng → 400. FE cũng đặt `min/max` và chặn submit nhưng BE là nguồn kiểm tra cuối cùng.
- Chỉ owner hoặc chính assignee được đổi `status`; member khác → 403. Owner được sửa mọi field; member chỉ sửa nội dung task mình tạo.
- Chuyển sang `done` thì server set `completedAt`; chuyển khỏi `done` thì `completedAt = null`.
- Xóa task thì các task đang phụ thuộc nó chuyển về `dependsOnTaskId: null`.
- Remind: task phải có assignee và chưa `done`; mỗi task chỉ nhắc 1 lần / 24h, gọi sớm hơn → 429. Server tạo notification `group_task_reminder` cho assignee.

### Thông báo tự động cho người được giao task

- Khi tạo task có `assigneeId`, hoặc đổi `assigneeId` sang người khác: server gửi ngay `group_task_assigned` cho assignee mới (không gửi nếu tự giao cho chính mình hoặc task đã `done`).
- Thành viên rời nhóm / bị xóa khỏi nhóm: các task của họ trong nhóm về `assignee: null`.

### Job nhắc tiến độ (BE — node-cron, `src/modules/groups/tasks.scheduler.js`)

- Chạy **mỗi giờ** (`5 * * * *`, timezone `GROUP_TASK_ALERT_TIMEZONE`, mặc định `Asia/Ho_Chi_Minh`) và chạy một lượt ngay khi server khởi động. Tắt bằng `GROUP_TASK_ALERTS_ENABLED=false`.
- Idempotent: bảng `group_task_notification_log` có khóa duy nhất `(type, task_id, recipient_id, dedupe_key)`; chạy lại không tạo thông báo trùng.
- `group_task_due_soon`: task chưa `done`, có assignee; nhắc ở 2 mốc **còn ≤ 12h** và **còn ≤ 2h**, mỗi mốc một lần cho mỗi hạn (`dedupe_key = due:<dueAt>:12h|2h`, đổi hạn thì được nhắc lại). Mốc đã qua lúc task được tạo thì bỏ qua (task tạo khi còn 5h chỉ nhận mốc 2h).
- `group_task_overdue`: task chưa `done`, có assignee và `dueAt <= now`; gửi assignee và owner một lần/ngày (`day:<YYYY-MM-DD>`) cho tới khi task hoàn thành. Chỉ gửi từ 08:00 giờ địa phương để không nhắc lúc nửa đêm.
- `group_task_blocked`: khi task chuyển `effectiveStatus` sang `blocked` vì task tiền đề quá hạn; gửi assignee của task bị chặn. Khóa theo task tiền đề + hạn của nó (`blocker:<id>:<dueAt>`) nên không gửi lại mỗi giờ nếu quan hệ chặn không đổi.
- Khi task tiền đề hoàn thành, task phụ thuộc tự hết `blocked`; không cần job ghi lại status.
- Cài đặt người dùng: `due_soon` tuân theo `notifications.taskReminders`; `overdue`/`blocked` tuân theo `notifications.deadlineAlerts`. `assigned` và `reminder` là hành động trực tiếp của người khác nên luôn gửi.

### Progress

| Method | Path | Data trả về |
|---|---|---|
| GET | `/groups/:groupId/progress` | `GroupProgress` |

### Messages (REST)

| Method | Path | Body / Query | Data trả về |
|---|---|---|---|
| GET | `/groups/:groupId/messages` | query `before?` (message id), `limit?` (mặc định 30, tối đa 100) | `{ items: Message[], nextCursor: string \| null }` |
| POST | `/groups/:groupId/messages` | `multipart/form-data`: `content?` (≤ 2000 ký tự), `files?` (tối đa 5 file, mỗi file ≤ 5 MB — cùng giới hạn với `upload.middleware.js` của BE) | `Message` |
| POST | `/groups/:groupId/read` | | `{ lastReadAt }` (đánh dấu đã đọc hết) |
| POST | `/groups/:groupId/messages/clear` | | `{ clearedAt }` |
| GET | `/groups/:groupId/shared` | query `type` (`media` \| `file` \| `link`), `limit?` (mặc định 20) | `SharedItem[]` (mới nhất trước) |

- `items` sắp xếp **cũ → mới**. Muốn tải tin cũ hơn: gọi lại với `before = nextCursor`. `nextCursor = null` nghĩa là hết.
- Gửi tin: phải có `content` không rỗng **hoặc** ít nhất 1 file, nếu không → 400.
- Xóa lịch sử chỉ áp dụng cho **người gọi**: lưu `clearedAt` trên bản ghi thành viên; tin nhắn, `lastMessage` và `shared` chỉ trả các tin có `createdAt > clearedAt`. Thành viên khác vẫn thấy đầy đủ.

## Realtime (Socket.IO) — FE-G5

Một kết nối Socket.IO duy nhất cho cả app (`src/lib/socket.js`), xác thực bằng `auth: { token: <accessToken> }` khi handshake. Event của chat dùng tiền tố `chat:`; tiền tố `call:` để dành cho signaling video call.

| Hướng | Event | Payload |
|---|---|---|
| client → server | `chat:join` | `{ groupId }` (server kiểm tra membership) |
| client → server | `chat:leave` | `{ groupId }` |
| server → client | `chat:message` | `Message` (phát cho room `group:{groupId}` sau khi POST message thành công) |

Gửi tin vẫn đi qua REST `POST /messages`; socket chỉ dùng để nhận tin mới.

### Kết nối và xác thực

- Server Socket.IO chạy chung port với REST (`http://localhost:5000`). FE tự lấy origin từ `VITE_API_BASE_URL`, hoặc đặt `VITE_SOCKET_URL` để ghi đè.
- Thiếu token hoặc token sai → `connect_error` với `message = "unauthorized"`.
- Khi access token hết hạn, server gửi `auth:expired` rồi ngắt kết nối. `socket.js` tự gọi refresh token qua REST rồi kết nối lại; các room đang tham gia được join lại tự động.
- Mỗi socket tự vào room riêng `user:{userId}` để server gửi sự kiện tới đúng một người (dùng cho video call).
- Bị xóa khỏi nhóm hoặc nhóm bị xóa → server đẩy socket khỏi room `group:{groupId}`.

### API của `src/lib/socket.js` (cho video call)

| Hàm | Dùng để |
|---|---|
| `onSocketEvent(event, handler)` | Nghe event, trả về hàm hủy. Gọi được cả trước khi socket kết nối. |
| `emitWithAck(event, payload, timeoutMs?)` | Gửi event và chờ server ack; luôn resolve (`{ ok: false, message }` khi lỗi/timeout). |
| `joinRoom(joinEvent, leaveEvent, payload)` | Vào room và tự vào lại sau khi reconnect; trả về `leave()`. Nhiều nơi cùng join thì chỉ rời khi nơi cuối gọi `leave()`. |
| `getSocket()` | Lấy instance gốc khi cần API Socket.IO đầy đủ. |
| `useSocketConnected()` (`src/hooks/useSocket.js`) | Hook React trả `true/false` theo trạng thái kết nối. |

Kết nối do `useRealtimeConnection()` trong `Layout` quản lý (mở khi đăng nhập, đóng khi đăng xuất, tắt ở chế độ mock); component không tự gọi `connectSocket()`.

Video call dùng tiền tố `call:` (ví dụ `call:join`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:leave`). Handler phía server đăng ký giống chat: viết hàm `(io, socket) => { socket.on("call:...", ...) }` trong module của mình và thêm vào mảng handler của `initRealtime(httpServer, [...])` ở `server.js`. Trước khi cho vào room cuộc gọi phải kiểm tra thành viên bằng `getMembershipOrThrow(groupId, socket.data.user.userId)` import từ `src/modules/groups/index.js`.

## Notification types (FE-G6)

Dùng module notifications có sẵn, thêm các `type`:

| type | Khi nào | Người nhận |
|---|---|---|
| `group_task_assigned` | Được giao task (tạo mới hoặc đổi người) | assignee |
| `group_task_due_soon` | Task chưa xong, còn ≤ 12h và còn ≤ 2h tới hạn | assignee |
| `group_task_overdue` | Task quá hạn chưa xong | assignee + owner |
| `group_task_blocked` | Task bị chặn vì task phụ thuộc quá hạn | assignee |
| `group_task_reminder` | Owner bấm "Nhắc thành viên" | assignee |

`metadata` của notification có `{ groupId, groupName, taskId }`; FE bấm vào sẽ mở `/groups/:groupId?view=tasks`.

Realtime: mỗi notification mới được đẩy qua socket event `notification:new` (payload = Notification) vào room `user:{userId}`. `useRealtimeConnection()` nghe event này để làm mới chuông, hiện toast và làm mới tasks/progress của nhóm liên quan.
