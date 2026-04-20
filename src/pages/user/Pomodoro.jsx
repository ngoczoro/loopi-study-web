import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import loopyStudying from "@/assets/loopy-studying.png";
import loopySleepy from "@/assets/loopy-sleepy.png";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function Pomodoro() {
  const [seconds, setSeconds] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);

  const intervalRef = useRef(null);

  const totalSeconds = isBreak ? BREAK_MINUTES * 60 : WORK_MINUTES * 60;
  const progress = 1 - seconds / totalSeconds;
  const circumference = 2 * Math.PI * 140;

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);

      if (!isBreak) {
        setSessions((s) => s + 1);
        setIsBreak(true);
        setSeconds(BREAK_MINUTES * 60);
      } else {
        setIsBreak(false);
        setSeconds(WORK_MINUTES * 60);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds, isBreak]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(WORK_MINUTES * 60);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 py-8 animate-fade-in">
      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {isBreak ? "Break Time! 🎉" : "Focus Session"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {isBreak
            ? "Take a break, you've earned it."
            : "Loopy is studying with you!"}
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
          onClick={() => setIsRunning(!isRunning)}
          className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft-lg hover:scale-[1.05] transition-transform"
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
        <span className="font-bold text-foreground">{sessions}</span>
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
