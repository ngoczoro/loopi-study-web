/** Messages the call system posts (see the backend's postCallMessage); chat shows them as cards. */
export const CALL_MESSAGE_KINDS = new Set(["call_started", "call_ended", "meet"]);

export const isCallMessage = (message) => CALL_MESSAGE_KINDS.has(message?.kind);

/**
 * The "call started" message that still has a Join button: the latest one, if no
 * "call ended" came after it and the group's call is running right now.
 */
export function findLiveCallStartId(messages, callActive) {
  if (!callActive) return null;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const kind = messages[index].kind;
    if (kind === "call_ended") return null;
    if (kind === "call_started") return messages[index].id;
  }
  return null;
}
