# API contract — AI Study Assistant (RAG chatbot)

Người học hỏi đáp **trên tài liệu của chính mình** (note/file đã upload). Câu trả lời chỉ dựa trên các đoạn tài liệu tìm được và luôn kèm nguồn trích. Không tìm thấy đoạn phù hợp → trả lời "không có trong tài liệu", không để model tự bịa.

- Base URL: `/api/v1`. Mọi endpoint yêu cầu Bearer token.
- Response bọc chuẩn `{ success, data, message }` như các module khác.
- FE chỉ gọi **core backend** module `assistant` (không gọi AI Service riêng). Index, tìm kiếm và ghép prompt nằm trong backend; OpenAI key / Ollama chỉ nằm ở server.
- Mọi truy vấn đều lọc theo `user_id` của người gọi: không bao giờ trả về đoạn tài liệu của người khác.
- FE chạy được không cần backend khi `VITE_USE_MOCKS=true`.

## Đối tượng

### Source (tài liệu có thể hỏi)

```json
{
  "id": "uuid",
  "title": "OOP summary — SOLID principles",
  "type": "note",
  "subject": { "id": "uuid", "name": "Object-Oriented Programming" },
  "indexStatus": "indexed",
  "chunkCount": 12,
  "indexedAt": "...",
  "updatedAt": "..."
}
```

- `type`: `note` | `file`. Link không index được nên không trả về.
- `indexStatus`:
  - `indexed`: đã có chunk + embedding, hỏi được.
  - `indexing`: đang xử lý.
  - `stale`: tài liệu đã sửa sau `indexedAt`, vẫn hỏi được trên bản cũ, nên index lại.
  - `not_indexed`: chưa index.
  - `failed`: index lỗi (file hỏng, không trích được chữ).
  - `unsupported`: định dạng không trích được chữ (ảnh, file scan...).
- **Index chạy ngầm hoàn toàn, FE không hiển thị trạng thái và không có nút index.** Tạo/sửa note hoặc upload file thì server tự đưa vào hàng đợi index; `stale` và `failed` được worker tự thử lại (tối đa 3 lần, giãn cách tăng dần).
- FE chỉ dùng `indexStatus` để ẩn tài liệu `unsupported` khỏi bộ chọn phạm vi.

### Scope (phạm vi hỏi)

```json
{ "type": "all" }
{ "type": "subject", "subjectId": "uuid" }
{ "type": "documents", "documentIds": ["uuid", "uuid"] }
```

- `documents`: 1–10 tài liệu, tất cả phải thuộc người gọi.
- Chỉ các source đã có index (kể cả bản cũ đang được index lại) trong scope được dùng để trả lời.

### Conversation

```json
{
  "id": "uuid",
  "title": "Nguyên lý SOLID",
  "scope": { "type": "subject", "subjectId": "uuid" },
  "messageCount": 6,
  "lastMessageAt": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

- `title`: 1–100 ký tự. Tạo mới mà không gửi `title` thì server đặt "New chat"; sau câu hỏi đầu tiên server đổi thành câu hỏi đó cắt còn 60 ký tự (nếu người dùng chưa tự đổi tên).

### Message

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "role": "assistant",
  "content": "Nguyên lý Single Responsibility nói rằng mỗi lớp chỉ nên có một lý do để thay đổi [1].",
  "answerStatus": "answered",
  "citations": [
    {
      "index": 1,
      "documentId": "uuid",
      "documentTitle": "OOP summary — SOLID principles",
      "subjectName": "Object-Oriented Programming",
      "chunkId": "uuid",
      "excerpt": "S: single responsibility — a class should have only one reason to change.",
      "location": "Đoạn 2",
      "score": 0.82
    }
  ],
  "createdAt": "..."
}
```

- `role`: `user` | `assistant`. Tin `user` có `citations: []`, `answerStatus: null`.
- `answerStatus` (chỉ với `assistant`):
  - `answered`: có trả lời dựa trên tài liệu, `citations` ≥ 1.
  - `not_found`: không có đoạn nào vượt ngưỡng liên quan; `content` là câu thông báo cố định, `citations: []`.
  - `no_sources`: scope chưa có tài liệu nào index xong; `content` là câu thân thiện kiểu "tài liệu đang được chuẩn bị, thử lại sau ít phút" (không nhắc tới "index").
- `content` là text thuần có thể có: đoạn văn, dòng bắt đầu bằng `- ` (gạch đầu dòng), `**đậm**`, và marker `[n]` trỏ tới `citations[].index`. FE không render HTML từ server.
- `location`: vị trí dễ đọc trong tài liệu nếu có (trang PDF, slide, "Đoạn n"); có thể `null`.

## Endpoint

### Sources

| Method | Path | Body | Data trả về |
|---|---|---|---|
| GET | `/assistant/sources` | | `Source[]` (mới cập nhật trước) |

Không có endpoint index cho FE; việc index do worker phía server tự xử lý.

### Conversations

| Method | Path | Body | Data trả về |
|---|---|---|---|
| GET | `/assistant/conversations` | | `Conversation[]` (`lastMessageAt` mới nhất trước) |
| POST | `/assistant/conversations` | `{ title?, scope }` | `Conversation` |
| PATCH | `/assistant/conversations/:id` | `{ title?, scope? }` | `Conversation` |
| DELETE | `/assistant/conversations/:id` | | `null` |
| GET | `/assistant/conversations/:id/messages` | | `Message[]` (cũ → mới) |
| POST | `/assistant/conversations/:id/messages` | `{ content }` | `{ userMessage, assistantMessage, conversation }` |

- Chỉ chủ hội thoại được đọc/sửa/xóa; người khác → 404.
- `content` câu hỏi: 1–2000 ký tự.
- Đổi `scope` chỉ ảnh hưởng các câu hỏi sau, không đổi câu trả lời cũ.
- Server gửi kèm tối đa 6 tin gần nhất làm ngữ cảnh hội thoại, nhưng chỉ trả lời dựa trên các đoạn tài liệu tìm được.
- Giới hạn: 30 câu hỏi / người / giờ; vượt → 429 với message rõ ràng.
- LLM lỗi hoặc timeout (**60 s** cho Ollama local, **30 s** cho OpenAI) → 503, không lưu tin `assistant`; tin `user` vẫn được lưu để người dùng gửi lại.

## Luồng RAG (module `assistant` trong backend)

1. **Index (P2):** trích chữ từ note/file → chia đoạn ~500 token, chồng lấn ~50 → embedding local (`multilingual-e5-small` trong Node) → lưu `document_chunks` (`user_id`, `content_id`, `chunk_index`, `chunk_text`, `location`, `embedding REAL[]`, `embedding_model`, `search_tsv`).
2. **Query (P3):** lọc `user_id = caller` + scope → hybrid (cosine cùng `embedding_model` + full-text) → top-k = 5 → dưới ngưỡng thì `not_found` **không gọi** model → ngược lại sinh câu trả lời theo 3 tầng:
   1. Ollama (`OLLAMA_URL`, `OLLAMA_MODEL`, mặc định `qwen2.5:3b`)
   2. OpenAI (`OPENAI_API_KEY`) nếu Ollama lỗi / quá thời gian chờ
   3. Trả trích đoạn kèm `[n]` nếu cả hai không dùng được
3. Server kiểm tra lại mọi `[n]` trong câu trả lời đều có trong `citations`; marker không hợp lệ thì bị xóa.
4. Sau này có thể bóc module này thành microservice mà FE vẫn gọi qua backend chính.

## Phase triển khai

| Phase | Nội dung |
|---|---|
| P1 | Hội thoại + tin nhắn; hỏi tạm trả `no_sources` |
| P2 | Index ngầm + embedding local; hỏi bằng trích đoạn (keyword/hybrid) khi đã index |
| P3 | Sinh câu trả lời: Ollama → OpenAI → trích đoạn; sanitize marker `[n]` |
| P4 | Đồng bộ sửa/xóa, cách ly user, test, README Ollama |
| P5 | Đánh giá chất lượng + demo |

## Định nghĩa hoàn thành

- Hỏi về nội dung một note → câu trả lời đúng và có trích nguồn bấm được.
- Hỏi ngoài tài liệu → `answerStatus: "not_found"`.
- Người A không bao giờ nhận được đoạn trích từ tài liệu của người B.
