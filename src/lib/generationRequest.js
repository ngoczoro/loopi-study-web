import api from "../services/api";
import { getAccessToken, readAuthSession } from "./authSession.js";
import { performTokenRefresh } from "./authTokenRefresh.js";

const send = (path, body) =>
  fetch(`${api.defaults.baseURL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });

/** An error shaped like axios's, so callers' existing `error.response` handling still works. */
const httpError = (status, message) =>
  Object.assign(new Error(message || `Request failed with status ${status}`), {
    response: { status, data: { message } },
  });

/**
 * POST a slow generation (quiz, flashcards) and report progress while it runs.
 * The server streams `progress` events, then `done` (the success envelope) or `error`.
 * Resolves like `api.post`: `{ data: { success, message, data } }`; rejects with an axios-like
 * error. A server without streaming answers JSON, which is handled the same way.
 * Refreshes the access token once on 401, like the axios client.
 */
export const postWithProgress = async (path, body, onProgress) => {
  let response = await send(path, body);
  if (response.status === 401 && (await performTokenRefresh())?.accessToken) {
    const { useAuthStore } = await import("./authStore.js");
    useAuthStore.getState().syncFromSession(readAuthSession());
    response = await send(path, body);
  }

  const isStream = (response.headers.get("content-type") || "").includes("text/event-stream");
  if (!isStream || !response.body) {
    const json = await response.json().catch(() => null);
    if (!response.ok) throw httpError(response.status, json?.message);
    return { data: json };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const name = raw.match(/^event: (.+)$/m)?.[1];
      const dataLine = raw.match(/^data: (.*)$/m)?.[1];
      if (!name || dataLine === undefined) continue;
      const data = JSON.parse(dataLine);

      if (name === "progress") onProgress?.(data);
      if (name === "done") return { data };
      if (name === "error") throw httpError(data.status ?? 500, data.message);
    }
  }
  throw httpError(500, "The connection closed before the result arrived.");
};
