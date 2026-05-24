import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  BookOpen,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import loopyStudying from "@/assets/loopy-studying.png";
import loopySleepy from "@/assets/loopy-sleepy.png";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  startPomodoroSessionAPI,
  pausePomodoroSessionAPI,
  resumePomodoroSessionAPI,
  completePomodoroSessionAPI,
} from "@/services/pomodoroService";

const MAX_WORK_MINUTES = 45;

function suggestWorkMinutes(priority) {
  if (priority === "high") return 45;
  if (priority === "low") return 20;
  return 30; // medium / default
}

export default function Pomodoro() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { subjects, sessions } = useAppStore();

  const subjectId = params.get("subjectId");
  const studySessionId = params.get("studySessionId");
  const studyPlanId = params.get("studyPlanId");

  const subject = subjects.find((s) => s.id === subjectId) || null;

  const priority =
    subject?.priority ||
    (subject?.difficulty === "Hard"
      ? "high"
      : subject?.difficulty === "Easy"
        ? "low"
        : "medium");

  const planSession = sessions.find((s) => s.id === studyPlanId) || null;

  if (!subject) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fade-in">
        <div className="bg-card rounded-2xl p-8 shadow-soft space-y-4">
          <div className="h-14 w-14 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-warning-foreground" />
          </div>

          <h1 className="text-xl font-display font-bold text-foreground">
            Study Mode unavailable
          </h1>

          <p className="text-sm text-muted-foreground">
            Please start from{" "}
            <span className="font-semibold">Study Planner</span> or{" "}
            <span className="font-semibold">Subject</span>.
          </p>

          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => navigate("/planner")}
              className="h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              Open Study Planner
            </button>

            <button
              onClick={() => navigate("/subjects")}
              className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm"
            >
              Open Subjects
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <PomodoroTimer
      subjectName={subject.name}
      priority={priority}
      planTitle={planSession?.title}
      studySessionId={studySessionId}
    />
  );
}

function PomodoroTimer({ subjectName, priority, planTitle, studySessionId }) {
  const navigate = useNavigate();

  const suggested = suggestWorkMinutes(priority);

  const [workMinutes, setWorkMinutes] = useState(suggested);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [started, setStarted] = useState(false);

  const [seconds, setSeconds] = useState(suggested * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [pomodoroSessionId, setPomodoroSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef(null);

  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = 1 - seconds / totalSeconds;
  const circumference = 2 * Math.PI * 140;

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && started && !isBreak) {
      // Work session completed
      setIsRunning(false);

      if (pomodoroSessionId && studySessionId) {
        handleCompletePomodoroSession();
      }

      setCompleted((s) => s + 1);
      toast.success(`Focus session complete! 🎉 (${subjectName})`);
      setIsBreak(true);
      setSeconds(breakMinutes * 60);
    } else if (seconds === 0 && started && isBreak) {
      // Break completed, ready for next session
      setIsBreak(false);
      setSeconds(workMinutes * 60);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    isRunning,
    seconds,
    isBreak,
    breakMinutes,
    workMinutes,
    subjectName,
    pomodoroSessionId,
    studySessionId,
    started,
  ]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // API handlers
  const handleStartPomodoro = async () => {
    if (!studySessionId) return; // Skip API if no studySessionId

    setIsLoading(true);
    const result = await startPomodoroSessionAPI(studySessionId, 1);

    if (result.success) {
      setPomodoroSessionId(result.data.id);
      toast.success("Pomodoro session started!");
    } else {
      toast.error(result.message || "Failed to start pomodoro session");
      console.error("Error starting pomodoro:", result.error);
    }
    setIsLoading(false);
  };

  const handlePausePomodoro = async () => {
    if (!pomodoroSessionId) return;

    const result = await pausePomodoroSessionAPI(pomodoroSessionId);
    if (!result.success) {
      toast.error(result.message || "Failed to pause session");
    }
  };

  const handleResumePomodoro = async () => {
    if (!pomodoroSessionId) return;

    const result = await resumePomodoroSessionAPI(pomodoroSessionId);
    if (!result.success) {
      toast.error(result.message || "Failed to resume session");
    }
  };

  const handleCompletePomodoroSession = async () => {
    if (!pomodoroSessionId) return;

    const result = await completePomodoroSessionAPI(
      pomodoroSessionId,
      workMinutes,
    );
    if (result.success) {
      toast.success("Session saved to your profile!");
    } else {
      toast.error(result.message || "Failed to save session");
      console.error("Error completing pomodoro:", result.error);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(workMinutes * 60);
  };

  const handleStart = async () => {
    const w = Math.min(Math.max(1, workMinutes), MAX_WORK_MINUTES);
    const b = Math.max(1, breakMinutes);

    setWorkMinutes(w);
    setBreakMinutes(b);
    setSeconds(w * 60);
    setStarted(true);

    // Call API to start pomodoro session
    await handleStartPomodoro();

    setIsRunning(true);
  };

  if (!started) {
    return (
      <div className="max-w-md mx-auto py-8 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary font-medium mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground">
              Study Mode Setup
            </h1>
          </div>

          {/* SUBJECT */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{subjectName}</p>
            {planTitle && <p className="text-xs">{planTitle}</p>}
          </div>

          {/* WORK TIME */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Focus Time (minutes)
            </label>

            <input
              type="number"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
              className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
            />

            <p className="text-xs text-muted-foreground mt-1">
              Suggested: {suggested} minutes
            </p>
          </div>

          {/* BREAK TIME */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Break Time (minutes)
            </label>

            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full mt-1 h-10 rounded-xl bg-background border border-border px-3 text-sm"
            />
          </div>

          {/* START */}
          <button
            onClick={handleStart}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.01] transition-transform"
          >
            Start Study
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 py-8 animate-fade-in">
      {/* HEADER */}
      <div className="w-full flex items-start justify-between mb-4">
        {/* LEFT: EXIT */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary font-medium"
        >
          ← Exit
        </button>

        {/* RIGHT: SUBJECT */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Studying</p>
          <p className="text-sm font-semibold text-foreground">{subjectName}</p>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Focus Session
        </h1>

        <p className="text-sm text-muted-foreground">
          Loopy is studying with you!
        </p>
      </div>

      {/* TIMER */}
      <div className="relative">
        <svg
          width="320"
          height="320"
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
            className="transition-all duration-1000"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-display font-bold text-foreground tabular-nums tracking-tight">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>

          <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-1">
            {isBreak ? "break" : "focus"}
          </span>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        </button>

        <button
          onClick={async () => {
            if (isRunning) {
              await handlePausePomodoro();
            } else if (pomodoroSessionId) {
              await handleResumePomodoro();
            }
            setIsRunning(!isRunning);
          }}
          disabled={isLoading}
          className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft-lg hover:scale-[1.05] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </button>

        <div className="h-12 w-12" />
      </div>

      {/* SESSION */}
      <p className="text-sm text-muted-foreground">
        Sessions completed today:{" "}
        <span className="font-bold text-foreground">{completed}</span>
      </p>

      {/* MASCOT */}
      <motion.img
        src={isRunning ? loopyStudying : loopySleepy}
        alt="Loopy"
        className="w-24 h-24"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
