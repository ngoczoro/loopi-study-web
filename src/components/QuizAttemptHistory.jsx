import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSubmittedAtVi, getScoreBadgeClass } from "@/lib/quizReviewUtils";

export default function QuizAttemptHistory({
  attempts = [],
  activeAttemptId,
  onSelectAttempt,
}) {
  if (!Array.isArray(attempts) || attempts.length <= 1) {
    return null;
  }

  const scrollable = attempts.length > 3;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Lịch sử làm bài
      </h2>

      <div
        className={cn(
          "space-y-2",
          scrollable && "max-h-[240px] overflow-y-auto pr-1",
        )}
      >
        {attempts.map((attempt) => {
          const isActive = attempt.id === activeAttemptId;
          const percentage = attempt.scorePercentage ?? 0;

          return (
            <button
              key={attempt.id}
              type="button"
              onClick={() => onSelectAttempt?.(attempt)}
              className={cn(
                "w-full text-left rounded-xl border px-4 py-3 transition-colors",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/40",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {formatSubmittedAtVi(attempt.submittedAt ?? attempt.date)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attempt.correctCount ?? attempt.score ?? 0}/
                    {attempt.totalQuestions ?? attempt.total ?? 0} câu đúng
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      getScoreBadgeClass(percentage),
                    )}
                  >
                    {percentage}%
                  </span>
                  <span className="text-xs text-primary font-medium">
                    Xem lại
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
