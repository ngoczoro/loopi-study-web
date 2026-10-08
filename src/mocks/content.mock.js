/** Sample personal content items for the "share to group" picker in mock mode. */
const SAMPLE_CONTENT = [
  {
    id: "mock-content-oop-summary",
    title: "OOP summary — SOLID principles",
    type: "note",
    content:
      "S: single responsibility\nO: open/closed\nL: Liskov substitution\nI: interface segregation\nD: dependency inversion",
    fileUrl: null,
    fileName: null,
    mimeType: null,
    fileSize: null,
    updatedAt: "2026-10-01T03:00:00.000Z",
  },
  {
    id: "mock-content-sql-joins",
    title: "SQL joins cheat notes",
    type: "note",
    content: "INNER JOIN keeps matches only.\nLEFT JOIN keeps every row from the left table.",
    fileUrl: null,
    fileName: null,
    mimeType: null,
    fileSize: null,
    updatedAt: "2026-09-27T08:30:00.000Z",
  },
  {
    id: "mock-content-network-slides",
    title: "Computer networks — chapter 3",
    type: "file",
    content: null,
    fileUrl: "data:text/plain;charset=utf-8,Computer%20networks%20chapter%203%20(mock%20file)",
    fileName: "networks-chapter-3.txt",
    mimeType: "text/plain",
    fileSize: 48_128,
    updatedAt: "2026-09-30T02:15:00.000Z",
  },
];

export function listMyContent() {
  return SAMPLE_CONTENT;
}
