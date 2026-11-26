import { memo, useEffect, useLayoutEffect } from "react";
import { toast } from "sonner";
import { setRingtoneSuppressed } from "@/lib/callRingtone";
import MiniCallWindow from "./MiniCallWindow";
import RemoteAudio from "./RemoteAudio";
import { useGroupCall } from "./useGroupCall";

/**
 * Runs the group's call for GroupCallProvider and hands its state up through `onCall`.
 *
 * Plays everyone's audio wherever the user is in the app, and shows the mini call
 * window while the full call view is not on screen. Memoised so the provider
 * re-rendering with the new call state does not re-render this in a loop.
 */
function CallEngine({ groupId, groupName, viewing, onCall, onIdle }) {
  const visible = viewing === groupId;
  const call = useGroupCall(groupId, { visible });
  const inCall = call.phase === "in-call";

  useLayoutEffect(() => {
    onCall(groupId, call);
  });

  useEffect(() => () => onCall(groupId, null), [groupId, onCall]);

  // Someone already in a call is not rung for another group's call.
  useEffect(() => {
    setRingtoneSuppressed(inCall);
    return () => setRingtoneSuppressed(false);
  }, [inCall]);

  // Dropped from the call while looking at another page: say why, since the lobby is not shown.
  useEffect(() => {
    if (!visible && call.callError) toast(call.callError, { id: `group-call-ended-${groupId}` });
  }, [visible, call.callError, groupId]);

  const idle = !inCall && !call.joining && !visible;
  useEffect(() => {
    if (idle) onIdle(groupId);
  }, [idle, groupId, onIdle]);

  if (!inCall) return null;
  return (
    <>
      <RemoteAudio remotes={call.remotes} />
      {!visible && <MiniCallWindow groupId={groupId} groupName={groupName} call={call} />}
    </>
  );
}

export default memo(CallEngine);
