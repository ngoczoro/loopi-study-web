const DEFAULT_DELAY_MS = 250;

export const isMockEnabled = () => import.meta.env.VITE_USE_MOCKS === "true";

export class MockApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

export const mockDelay = (ms = DEFAULT_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function requireText(value, field, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new MockApiError(400, `${field} is required`);
  }
  if (text.length > maxLength) {
    throw new MockApiError(400, `${field} must be at most ${maxLength} characters`);
  }
  return text;
}
