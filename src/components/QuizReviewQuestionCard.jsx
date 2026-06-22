import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAnswerLine, getOptionText } from "@/lib/quizReviewUtils";

export default function QuizReviewQuestionCard({
  answerDetail,
  options = [],
}) {
  if (!answerDetail) return null;

  const {
    questionIndex = 0,
    question = "",
    selectedIndex,
    selectedAnswer,
    correctIndex,
    correctAnswer,
    isCorrect,
    explanation,
    sourceTopic,
  } = answerDetail;

  const selectedText = getOptionText(options, selectedIndex);
  const correctText = getOptionText(options, correctIndex);

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-5 shadow-soft border",
        isCorrect ? "border-accent/30" : "border-destructive/20",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Question {questionIndex + 1}
          </p>
          <p className="text-sm font-semibold text-foreground">{question}</p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0",
            isCorrect
              ? "bg-accent/20 text-accent-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Correct
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              Incorrect
            </>
          )}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Your answer:
          </p>
          <p
            className={cn(
              "rounded-xl px-3 py-2",
              isCorrect ? "bg-accent/10 text-foreground" : "bg-destructive/10 text-destructive",
            )}
          >
            {formatAnswerLine(selectedAnswer, selectedText)}
          </p>
        </div>

        {!isCorrect && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Correct answer:
            </p>
            <p className="rounded-xl px-3 py-2 bg-accent/10 text-foreground">
              {formatAnswerLine(correctAnswer, correctText)}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Explanation:
          </p>
          <p className="rounded-xl px-3 py-2 bg-secondary/40 text-foreground text-sm leading-relaxed whitespace-pre-line">
            {explanation?.trim() || "No explanation available for this question."}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Topic:
          </p>
          <p className="text-sm text-foreground">
            {sourceTopic?.trim() || "Topic not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
