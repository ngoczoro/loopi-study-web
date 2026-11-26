import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { GroupCallContext } from "./groupCallContext";

// The LiveKit client is large, so the call engine only loads once someone opens a call.
const CallEngine = lazy(() => import("./CallEngine"));

/**
 * Keeps the group call alive across the whole app, so moving to another page does not
 * end it: the call shrinks into a mini window (see CallEngine) until the user returns.
 *
 * One call at a time. `session` is the group whose call (or lobby) is open; `viewing` is
 * the group whose full call view is on screen. A lobby nobody is looking at is closed,
 * which also turns the camera preview off.
 *
 * Mount once inside the authenticated app shell, under the router.
 */
export function GroupCallProvider({ children }) {
  const [session, setSession] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [engine, setEngine] = useState(null);

  const startSession = useCallback((group) => {
    setSession((current) =>
      current?.groupId === group.groupId && current.groupName === group.groupName
        ? current
        : { groupId: group.groupId, groupName: group.groupName },
    );
  }, []);

  const endSession = useCallback((groupId) => {
    setSession((current) => (current?.groupId === groupId ? null : current));
  }, []);

  const publishCall = useCallback((groupId, call) => {
    setEngine(call ? { groupId, call } : (current) => (current?.groupId === groupId ? null : current));
  }, []);

  const call = engine && engine.groupId === session?.groupId ? engine.call : null;

  const value = useMemo(
    () => ({ session, viewing, call, startSession, setViewing }),
    [session, viewing, call, startSession],
  );

  return (
    <GroupCallContext.Provider value={value}>
      {children}
      {session && (
        <Suspense fallback={null}>
          <CallEngine
            key={session.groupId}
            groupId={session.groupId}
            groupName={session.groupName}
            viewing={viewing}
            onCall={publishCall}
            onIdle={endSession}
          />
        </Suspense>
      )}
    </GroupCallContext.Provider>
  );
}
