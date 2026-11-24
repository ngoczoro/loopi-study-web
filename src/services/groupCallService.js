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

/** Who is in the group's call right now: `{ groupId, active, count, participants }`. */
export const fetchCallStatus = (groupId) =>
  callService({
    mock: () => ({ groupId, active: false, count: 0, participants: [] }),
    request: () => api.get(`/groups/${groupId}/call`),
    fallback: "Could not load the call status",
  });
