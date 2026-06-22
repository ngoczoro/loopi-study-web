import { RotateCcw, ArrowLeft, Timer, CalendarClock } from "lucide-react";
import loopyHappy from "@/assets/loopy-happy.png";
import { cn } from "@/lib/utils";
import {
  formatDurationVi,
  formatSubmittedAtVi,
  getScoreBadgeClass,
  getScoreLabel,
} from "@/lib/quizReviewUtils";

export default function QuizReviewSummary({
  correctCount = 0,
  totalCount = 0,
  scorePercentage,
  submittedAt,
  durationSeconds,
  reviewMode = false,
  onReset,
  onBack,
}) {
  const percentage =
    scorePercentage ??
    (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);
  const label = getScoreLabel(percentage);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
      <div className="flex items-start gap-4">
        <img src={loopyHappy} alt="Loopy" className="w-14 h-14 shrink-0" />

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-lg font-display font-semibold text-foreground">
              Quiz results
            </p>
            {reviewMode && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Reviewing a past attempt
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Score: {percentage}%
            </span>
            <span
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                getScoreBadgeClass(percentage),
              )}
            >
              {label}
            </span>
          </div>

          <p className="text-sm text-foreground">
            Correct answers:{" "}
            <span className="font-semibold">
              {correctCount}/{totalCount}
            </span>
          </p>

          <div className="space-y-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  percentage >= 80
                    ? "bg-accent"
                    : percentage >= 50
                      ? "bg-warning"
                      : "bg-destructive",
                )}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              Time spent: {formatDurationVi(durationSeconds)}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              Submitted: {formatSubmittedAtVi(submittedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {reviewMode ? "Retake" : "Try again"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2 hover:bg-secondary/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to quizzes
        </button>
      </div>
    </div>
  );
}
