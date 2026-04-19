import { useState } from "react";
import { Brain, Clock, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import loopyThinking from "@/assets/loopy-thinking.png";
/**
 * @typedef {import("@/lib/store").Quiz} Quiz
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";

export default function QuizList({
  quizzes,
  lastAttempts,
  onSelectQuiz,
  onReviewQuiz,
  onDeleteQuiz,
  onGenerateWithAi,
}) {
  const [deleteId, setDeleteId] = useState(null);

  if (quizzes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center">
        <img src={loopyThinking} alt="Loopy" className="w-24 h-24 mb-4" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          No Quizzes Yet
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Generate your first quiz with AI to start testing your knowledge!
        </p>

        {onGenerateWithAi && (
          <button
            onClick={onGenerateWithAi}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] transition-transform"
          >
            <Sparkles className="h-4 w-4" /> Generate Quiz with AI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            My Quizzes
          </h1>
          <p className="text-sm text-muted-foreground">
            Test your knowledge with AI-generated quizzes
          </p>
        </div>

        {onGenerateWithAi && (
          <button
            onClick={onGenerateWithAi}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] transition-transform"
          >
            <Sparkles className="h-4 w-4" /> Generate Quiz
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {quizzes.map((q, i) => {
          const attempt = lastAttempts[q.id];

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer group relative"
              onClick={() => onSelectQuiz(q.id)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(q.id);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete quiz"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>

                <div className="flex-1 pr-6">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {q.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {q.questions.length} questions ·{" "}
                    {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Attempt */}
              {attempt && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        Last: {attempt.score}/{attempt.total}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          attempt.score >= attempt.total * 0.7
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {Math.round((attempt.score / attempt.total) * 100)}%
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReviewQuiz(q.id);
                      }}
                      className="text-[11px] text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" /> Review
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDeleteQuiz(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
