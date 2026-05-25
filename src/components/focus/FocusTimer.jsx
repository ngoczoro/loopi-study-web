import { motion } from "framer-motion";
import { Play, Pause, Square } from "lucide-react";
import loopyStudying from "@/assets/loopy-studying.png";
import loopySleepy from "@/assets/loopy-sleepy.png";
import { useFocusSession } from "@/contexts/FocusSessionContext";
import { workMinutesFromSeconds } from "@/lib/focusTimerUtils";

export default function FocusTimer() {
  const { liveSession, timer } = useFocusSession();
  const session = liveSession;

  if (!session) return null;

  const {
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
    handleTogglePause,
  } = timer;

  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - seconds / totalSeconds : 0;
  const circumference = 2 * Math.PI * 140;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const statusLabel =
    session.status === "paused"
      ? "Paused"
      : tabBlocked
        ? "Running in another tab"
        : "Running";

  const displayName = session.subjectName || "Focus session";

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center gap-6">
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          disabled={ending}
          onClick={finishComplete}
          className="text-sm text-destructive font-medium disabled:opacity-50"
        >
          ← Stop session
        </button>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
        </div>
      </div>

      {tabBlocked && (
        <p className="text-xs text-warning text-center px-4">
          This session&apos;s timer is active in another browser tab. You can stop
          the session here, or switch to that tab to control pause/resume.
        </p>
      )}

      <div className="relative">
        <svg
          width="280"
          height="280"
          viewBox="0 0 320 320"
          className="transform -rotate-90"
        >
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke={isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-display font-bold tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-1">
            {isBreak ? "break" : "focus"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={ending}
          onClick={finishComplete}
          className="h-12 w-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 disabled:opacity-50"
          title="Stop session"
        >
          <Square className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={ending || toggling || tabBlocked}
          onClick={handleTogglePause}
          className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft-lg disabled:opacity-50"
        >
          {session.status === "running" ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </button>
        <div className="h-12 w-12" />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {workMinutesFromSeconds(workElapsedSeconds)} min logged this session
      </p>

      <motion.img
        src={isRunning ? loopyStudying : loopySleepy}
        alt="Loopy"
        className="w-20 h-20"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
