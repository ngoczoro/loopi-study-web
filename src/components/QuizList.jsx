import { useState } from "react";
import { Brain, Clock, Trash2, Sparkles, Pencil, FileText } from "lucide-react";
import { motion } from "framer-motion";
import loopyThinking from "@/assets/loopy-thinking.png";
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
import QuizRenameModal from "@/components/QuizRenameModal";

const resolveSubjectLabel = (quiz, subjects = []) => {
  if (quiz.subjectName) {
    return quiz.subjectName;
  }

  if (!quiz.subjectId) {
    return "Chưa gắn môn học";
  }

  return (
    subjects.find((subject) => subject.id === quiz.subjectId)?.name ??
    "Chưa gắn môn học"
  );
};

export default function QuizList({
  quizzes,
  lastAttempts,
  subjects = [],
  onSelectQuiz,
  onReviewQuiz,
  onDeleteQuiz,
  onRenameQuiz,
  onGenerateWithAi,
}) {
  const [deleteId, setDeleteId] = useState(null);
  const [renameQuiz, setRenameQuiz] = useState(null);

  const handleRenameSave = async (quizId, title) => {
    const result = await onRenameQuiz?.(quizId, title);
    return result ?? { ok: false };
  };

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
    <>
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
            const subjectLabel = resolveSubjectLabel(q, subjects);
            const showSourceDocument =
              q.sourceDocumentTitle &&
              (q.source === "ai_generated" || q.sourceDocumentId);

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer group relative"
                onClick={() => onSelectQuiz(q.id)}
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameQuiz(q);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Rename quiz"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(q.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="flex-1 pr-14 min-w-0">
                    <h3
                      className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                      title={q.title}
                    >
                      {q.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Môn học: {subjectLabel}
                    </p>
                    {showSourceDocument && (
                      <p
                        className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1 truncate max-w-full"
                        title={q.sourceDocumentTitle}
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Tài liệu: {q.sourceDocumentTitle}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.questions.length} questions ·{" "}
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {attempt && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          Last: {attempt.score}/{attempt.total}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (attempt.scorePercentage ??
                              Math.round((attempt.score / attempt.total) * 100)) >= 70
                              ? "bg-accent/20 text-accent-foreground"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {attempt.scorePercentage ??
                            Math.round((attempt.score / attempt.total) * 100)}
                          %
                        </span>
                      </div>

                      <button
                        type="button"
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
      </div>

      <QuizRenameModal
        open={Boolean(renameQuiz)}
        quiz={renameQuiz}
        onOpenChange={(open) => {
          if (!open) setRenameQuiz(null);
        }}
        onSave={handleRenameSave}
      />

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
    </>
  );
}
