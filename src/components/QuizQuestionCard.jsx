import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * @typedef {import("@/lib/store").QuizQuestion} QuizQuestion
 */

export default function QuizQuestionCard({
  question,
  index,
  selectedAnswer,
  showResults,
  onAnswer,
  forceExpandExplanation,
}) {
  const [localExpanded, setLocalExpanded] = useState(false);

  const isCorrect = selectedAnswer === question.correctIndex;

  useEffect(() => {
    if (forceExpandExplanation !== undefined) {
      setLocalExpanded(forceExpandExplanation);
    }
  }, [forceExpandExplanation]);

  const expanded = localExpanded;

  const difficultyConfig = {
    easy: { label: "Easy", cls: "bg-accent/20 text-accent-foreground" },
    medium: { label: "Medium", cls: "bg-warning/20 text-warning-foreground" },
    hard: { label: "Hard", cls: "bg-destructive/10 text-destructive" },
  };

  return (
    <div
      className={`bg-card rounded-2xl p-5 shadow-soft transition-all ${
        showResults && !isCorrect ? "ring-1 ring-destructive/20" : ""
      }`}
    >
      {/* Question */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-foreground flex-1">
          <span className="text-primary mr-1.5">Q{index + 1}.</span>
          {question.question}
        </p>

        {question.difficulty && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
              difficultyConfig[question.difficulty]?.cls
            }`}
          >
            {difficultyConfig[question.difficulty]?.label}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, oi) => {
          let cls =
            "bg-background/60 hover:bg-secondary/30 text-foreground border-border/50";

          if (showResults) {
            if (oi === question.correctIndex)
              cls = "bg-accent/20 text-accent-foreground border-accent/50";
            else if (selectedAnswer === oi)
              cls = "bg-destructive/10 text-destructive border-destructive/30";
          } else if (selectedAnswer === oi) {
            cls = "bg-primary/10 text-primary border-primary/30";
          }

          return (
            <button
              key={oi}
              onClick={() => onAnswer(oi)}
              disabled={showResults}
              className={`w-full text-left p-3 rounded-xl text-sm border transition-colors flex items-center gap-3 ${cls} ${
                showResults ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="h-6 w-6 rounded-full bg-secondary/60 flex items-center justify-center text-xs font-bold shrink-0">
                {String.fromCharCode(65 + oi)}
              </span>

              <span className="flex-1">{opt}</span>

              {showResults && oi === question.correctIndex && (
                <CheckCircle2 className="h-4 w-4 text-accent-foreground ml-auto shrink-0" />
              )}

              {showResults &&
                selectedAnswer === oi &&
                oi !== question.correctIndex && (
                  <XCircle className="h-4 w-4 text-destructive ml-auto shrink-0" />
                )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResults && question.explanation && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <button
            onClick={() => setLocalExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-medium text-primary hover:underline w-full"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {expanded ? "Hide Explanation" : "Show Explanation"}
            {expanded ? (
              <ChevronUp className="h-3 w-3 ml-auto" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-auto" />
            )}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 rounded-xl bg-secondary/30 text-sm text-foreground space-y-1">
                  <p className="font-semibold text-xs text-primary">
                    Correct Answer:{" "}
                    {String.fromCharCode(65 + question.correctIndex)}
                  </p>

                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No explanation */}
      {showResults && !question.explanation && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Correct Answer:</span>{" "}
            {String.fromCharCode(65 + question.correctIndex)} —{" "}
            {question.options[question.correctIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
