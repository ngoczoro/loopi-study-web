import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useFocusActiveQuery,
  useInvalidateFocus,
} from "@/hooks/queries/focus";
import { queryKeys } from "@/lib/query/queryKeys";
import {
  computeSecondsLeft,
  FOCUS_SYNC_INTERVAL_MS,
  FOCUS_TICK_MS,
  workMinutesFromSeconds,
} from "@/lib/focusTimerUtils";
import {
  saveRecoverySnapshot,
  clearRecoverySnapshot,
  claimTabLock,
  releaseTabLock,
  heartbeatTabLock,
  isTabLockHeldByOther,
} from "@/lib/focusSessionRecovery";
import {
  completeFocusSessionAPI,
  abandonFocusSessionAPI,
  pauseFocusSessionAPI,
  resumeFocusSessionAPI,
  syncFocusSessionAPI,
} from "@/services/focusSessionService";

const FocusSessionContext = createContext(null);

export function FocusSessionProvider({ children }) {
  const queryClient = useQueryClient();
  const invalidateFocus = useInvalidateFocus();
  const {
    activeSession: serverActive,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useFocusActiveQuery();

  const [liveSession, setLiveSession] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [workElapsedSeconds, setWorkElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [tabBlocked, setTabBlocked] = useState(false);
  const completedRef = useRef(false);
  const locallyEndedRef = useRef(false);

  const bindLiveSession = useCallback(
    (session) => {
      if (!session?.id) return;
      locallyEndedRef.current = false;
      completedRef.current = false;
      setLiveSession(session);
      setSeconds(computeSecondsLeft(session));
      setWorkElapsedSeconds(session.workElapsedSeconds ?? 0);
      saveRecoverySnapshot(session);
      queryClient.setQueryData(queryKeys.focus.active, session);
    },
    [queryClient],
  );

  const patchLiveSession = useCallback((session) => {
    if (!session?.id) return;
    setLiveSession(session);
    saveRecoverySnapshot(session);
    queryClient.setQueryData(queryKeys.focus.active, session);
  }, [queryClient]);

  const clearLiveSession = useCallback(() => {
    locallyEndedRef.current = true;
    if (liveSession?.id) {
      releaseTabLock(liveSession.id);
    }
    clearRecoverySnapshot();
    setLiveSession(null);
    setSeconds(0);
    setWorkElapsedSeconds(0);
    completedRef.current = false;
    queryClient.setQueryData(queryKeys.focus.active, null);
    invalidateFocus();
    refetchActive();
  }, [liveSession?.id, queryClient, invalidateFocus, refetchActive]);

  useEffect(() => {
    if (activeLoading) return;

    if (locallyEndedRef.current) {
      if (!serverActive) {
        locallyEndedRef.current = false;
      }
      return;
    }

    if (serverActive?.id) {
      setLiveSession((prev) => {
        if (!prev || prev.id !== serverActive.id) {
          setSeconds(computeSecondsLeft(serverActive));
          setWorkElapsedSeconds(serverActive.workElapsedSeconds ?? 0);
          saveRecoverySnapshot(serverActive);
          return serverActive;
        }
        return { ...prev, ...serverActive };
      });
    } else {
      setLiveSession(null);
      clearRecoverySnapshot();
    }
  }, [serverActive, activeLoading]);

  const session = liveSession;
  const sessionId = session?.id;
  const workMinutes = session?.plannedWorkMinutes ?? 25;
  const breakMinutes = session?.plannedBreakMinutes ?? 5;
  const isBreak = session?.currentPhase === "break";
  const isRunning =
    session?.status === "running" && !tabBlocked && Boolean(sessionId);

  const getTimerPayload = useCallback(() => {
    if (!session) {
      return {
        remainingSeconds: 0,
        workElapsedSeconds: 0,
        currentPhase: "work",
      };
    }
    return {
      remainingSeconds: computeSecondsLeft(session),
      workElapsedSeconds,
      currentPhase: isBreak ? "break" : "work",
    };
  }, [session, workElapsedSeconds, isBreak]);

  const finishComplete = useCallback(async () => {
    if (!sessionId) return;
    setEnding(true);
    const payload = {
      workElapsedSeconds,
      actualWorkMinutes: workMinutesFromSeconds(
        Math.max(workElapsedSeconds, workMinutes * 60),
      ),
    };
    const result = await completeFocusSessionAPI(sessionId, payload);
    setEnding(false);

    if (result.success) {
      toast.success(
        session.subjectName
          ? `Focus session complete! (${session.subjectName})`
          : "Focus session complete!",
      );
      clearLiveSession();
    } else {
      toast.error(result.message);
    }
  }, [sessionId, session?.subjectName, workElapsedSeconds, workMinutes, clearLiveSession]);

  const finishAbandon = useCallback(async () => {
    if (!sessionId) return;
    setEnding(true);
    const payload = {
      workElapsedSeconds,
      actualWorkMinutes: workMinutesFromSeconds(workElapsedSeconds),
    };
    const result = await abandonFocusSessionAPI(sessionId, payload);
    setEnding(false);

    if (result.success) {
      toast.success("Session saved as incomplete");
      clearLiveSession();
    } else {
      toast.error(result.message);
    }
  }, [sessionId, workElapsedSeconds, clearLiveSession]);

  const handleTogglePause = useCallback(async () => {
    if (!session || tabBlocked || toggling) return;

    setToggling(true);

    if (session.status === "running") {
      const payload = getTimerPayload();
      const result = await pauseFocusSessionAPI(session.id, payload);
      setToggling(false);

      if (result.success) {
        patchLiveSession(result.data);
        setSeconds(result.data.remainingSeconds ?? payload.remainingSeconds);
      } else {
        toast.error(result.message);
      }
      return;
    }

    const result = await resumeFocusSessionAPI(session.id);
    setToggling(false);

    if (result.success) {
      patchLiveSession(result.data);
      setSeconds(computeSecondsLeft(result.data));
    } else {
      toast.error(result.message);
    }
  }, [session, tabBlocked, toggling, getTimerPayload, patchLiveSession]);

  useEffect(() => {
    if (!sessionId) return undefined;

    const lock = claimTabLock(sessionId);
    setTabBlocked(!lock.isOwner);

    const onStorage = (e) => {
      if (e.key === "loopi_focus_tab_lock") {
        setTabBlocked(isTabLockHeldByOther(sessionId));
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    setSeconds(computeSecondsLeft(session));
  }, [
    session?.id,
    session?.status,
    session?.phaseEndsAt,
    session?.remainingSeconds,
  ]);

  useEffect(() => {
    if (!session || !isRunning) return undefined;

    const tick = () => {
      const left = computeSecondsLeft(session);
      setSeconds(left);

      if (session.status === "running" && !isBreak) {
        const plannedWorkSec = workMinutes * 60;
        const elapsed = Math.max(0, plannedWorkSec - left);
        setWorkElapsedSeconds((prev) => Math.max(prev, elapsed));
      }
    };

    tick();
    const id = setInterval(tick, FOCUS_TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, session, isBreak, workMinutes]);

  useEffect(() => {
    if (!session || !isRunning || tabBlocked || !sessionId) return undefined;

    const lockId = setInterval(() => heartbeatTabLock(sessionId), 5000);

    const syncId = setInterval(async () => {
      const payload = getTimerPayload();
      const result = await syncFocusSessionAPI(sessionId, payload);
      if (result.success) {
        patchLiveSession(result.data);
      }
    }, FOCUS_SYNC_INTERVAL_MS);

    return () => {
      clearInterval(lockId);
      clearInterval(syncId);
    };
  }, [isRunning, tabBlocked, sessionId, session, getTimerPayload, patchLiveSession]);

  useEffect(() => {
    if (!session || !isRunning || seconds > 0 || completedRef.current) return;

    if (!isBreak) {
      completedRef.current = true;
      finishComplete();
      return;
    }

    const payload = {
      remainingSeconds: workMinutes * 60,
      workElapsedSeconds,
      currentPhase: "work",
    };

    syncFocusSessionAPI(sessionId, payload).then((result) => {
      if (result.success) {
        completedRef.current = false;
        patchLiveSession(result.data);
        setSeconds(computeSecondsLeft(result.data));
      }
    });
  }, [
    seconds,
    isRunning,
    isBreak,
    finishComplete,
    sessionId,
    workMinutes,
    workElapsedSeconds,
    patchLiveSession,
    session,
  ]);

  const value = useMemo(
    () => ({
      liveSession,
      activeLoading,
      bindLiveSession,
      clearLiveSession,
      timer: {
        seconds,
        workElapsedSeconds,
        ending,
        toggling,
        tabBlocked,
        isBreak,
        isRunning,
        workMinutes,
        breakMinutes,
        finishComplete,
        finishAbandon,
        handleTogglePause,
      },
    }),
    [
      liveSession,
      activeLoading,
      bindLiveSession,
      clearLiveSession,
      seconds,
      workElapsedSeconds,
      ending,
      toggling,
      tabBlocked,
      isBreak,
      isRunning,
      workMinutes,
      breakMinutes,
      finishComplete,
      finishAbandon,
      handleTogglePause,
    ],
  );

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
    </FocusSessionContext.Provider>
  );
}

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) {
    throw new Error("useFocusSession must be used within FocusSessionProvider");
  }
  return ctx;
}
