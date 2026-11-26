import { createContext, useContext, useEffect } from "react";

/** Shared by GroupCallProvider and the hooks below. */
export const GroupCallContext = createContext(null);

/** The call anywhere in the app (for example to show who is in a call), or null. */
export function useActiveGroupCall() {
  const context = useContext(GroupCallContext);
  if (!context) return null;
  const { session, call } = context;
  return session && call ? { groupId: session.groupId, groupName: session.groupName, call } : null;
}

/**
 * The call for `group`'s full call view.
 *
 * - `call`: this group's call, or null while the engine loads.
 * - `otherCall`: set when the user is already in another group's call; joining here
 *   would end it, so the view asks first (`switchHere`).
 */
export function useGroupCallSession(group, visible = true) {
  const context = useContext(GroupCallContext);
  if (!context) throw new Error("useGroupCallSession must be used inside GroupCallProvider");
  const { session, call, startSession, setViewing } = context;
  const groupId = group.id;
  const groupName = group.name;

  useEffect(() => {
    if (!visible) return undefined;
    setViewing(groupId);
    return () => setViewing((current) => (current === groupId ? null : current));
  }, [visible, groupId, setViewing]);

  const elsewhere = session && session.groupId !== groupId ? session : null;
  const busyElsewhere = Boolean(elsewhere && call && (call.phase === "in-call" || call.joining));

  useEffect(() => {
    if (!visible || busyElsewhere) return;
    startSession({ groupId, groupName });
  }, [visible, busyElsewhere, groupId, groupName, startSession]);

  return {
    call: session?.groupId === groupId ? call : null,
    otherCall: busyElsewhere ? elsewhere : null,
    switchHere: () => startSession({ groupId, groupName }),
  };
}
