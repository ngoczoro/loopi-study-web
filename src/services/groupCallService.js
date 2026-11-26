import api from "./api";
import { callService } from "../lib/serviceRequest.js";
import { MockApiError } from "../mocks/mockUtils.js";

export const CALLS_NEED_BACKEND_MESSAGE =
  "Video calls need the real backend. Set VITE_USE_MOCKS=false and restart the dev server.";

/** Signs a LiveKit token for the group's call room: `{ token, url, roomName, maxParticipants }`. */
export const requestCallToken = (groupId) =>
  callService({
    mock: () => {
      throw new MockApiError(503, CALLS_NEED_BACKEND_MESSAGE);
    },
    request: () => api.post(`/groups/${groupId}/call/token`),
    fallback: "Could not start the call",
  });

/**
 * Tells the backend the user pressed Leave, so the call ends right away when they were
 * the last one in (otherwise it waits ~40 s in case of a dropped connection): `{ ended }`.
 */
export const notifyCallLeft = (groupId) =>
  callService({
    mock: () => ({ ended: false }),
    request: () => api.post(`/groups/${groupId}/call/leave`),
    fallback: "Could not leave the call",
  });

/** Who is in the group's call right now: `{ groupId, active, count, participants, meet }`. */
export const fetchCallStatus = (groupId) =>
  callService({
    mock: () => ({ groupId, active: false, count: 0, participants: [], meet: null }),
    request: () => api.get(`/groups/${groupId}/call`),
    fallback: "Could not load the call status",
  });

const meetNeedsBackend = () => {
  throw new MockApiError(503, CALLS_NEED_BACKEND_MESSAGE);
};

/**
 * Asks the backend to create a Google Meet for the group (or return the current one):
 * `{ meet: { url, startedBy, startedAt }, created }`.
 * On failure `error.code` is MEET_AUTO_UNAVAILABLE or MEET_RATE_LIMITED and
 * `error.details.fallback.backupMeetUrl` may hold the group's standing link.
 */
export const startGoogleMeet = (groupId) =>
  callService({
    mock: meetNeedsBackend,
    request: () => api.post(`/groups/${groupId}/call/meet`),
    fallback: "Could not create a Google Meet",
  });

/** Shares a Meet link a member created by hand (only meet.google.com links are accepted). */
export const shareGoogleMeet = (groupId, url) =>
  callService({
    mock: meetNeedsBackend,
    request: () => api.put(`/groups/${groupId}/call/meet`, { url }),
    fallback: "Could not share the Google Meet link",
  });

export const endGoogleMeet = (groupId) =>
  callService({
    mock: meetNeedsBackend,
    request: () => api.delete(`/groups/${groupId}/call/meet`),
    fallback: "Could not end the Google Meet",
  });
