import { RotateCcw, ArrowLeft, Timer } from "lucide-react";
import loopyHappy from "@/assets/loopy-happy.png";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function QuizResultSummary({
  correctCount,
  totalCount,
  reviewMode,
  timeSpent,
  onReset,
  onBack,
}) {
  const percentage = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <img src={loopyHappy} alt="Loopy" className="w-14 h-14" />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-xl font-bold text-foreground">
              {correctCount}/{totalCount} Correct!
            </p>

            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                percentage >= 70
                  ? "bg-accent/20 text-accent-foreground"
                  : percentage >= 40
                    ? "bg-warning/20 text-warning-foreground"
                    : "bg-destructive/10 text-destructive"
              }`}
            >
              {percentage}%
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {correctCount === totalCount
              ? "Perfect score!"
              : correctCount > totalCount / 2
                ? "Great job! Keep studying!"
                : "Keep practicing! You'll get there!"}
          </p>

          <div className="flex items-center gap-4 mt-1">
            {timeSpent !== undefined && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" /> {formatTime(timeSpent)}
              </span>
            )}

            {reviewMode && (
              <span className="text-xs text-muted-foreground">
                Reviewing last attempt
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onReset}
          className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {reviewMode ? "Try Again" : "Retry Quiz"}
        </button>

        <button
          onClick={onBack}
          className="h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2 hover:bg-secondary/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Quizzes
        </button>
      </div>
    </div>
  );
}
