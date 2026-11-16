import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import QuizReviewEditor from "@/components/ai/QuizReviewEditor";
import { toDraftQuestion, toQuizContentPayload, validateQuizDraft } from "@/lib/quizDraft";

/**
 * Edit the title and questions of a saved quiz. `onSave(quizId, payload)` resolves to { ok }.
 * Mount it with `key={quiz.id}` so the draft starts from the quiz being edited.
 */
export default function QuizEditModal({ quiz, hasAttempts, onOpenChange, onSave }) {
  const [title, setTitle] = useState(() => quiz?.title ?? "");
  const [questions, setQuestions] = useState(() =>
    (quiz?.questions ?? []).map(toDraftQuestion),
  );
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!quiz?.id || saving) return;
    const error = validateQuizDraft(title, questions);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    const result = await onSave?.(quiz.id, toQuizContentPayload(title, questions));
    setSaving(false);

    if (result?.ok) onOpenChange(false);
  };

  if (!quiz) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-display font-semibold text-foreground mb-1">
          Edit quiz
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {hasAttempts
            ? "Past attempts keep their score. Questions you change will look different the next time you take this quiz."
            : "Edit questions, answers and explanations."}
        </p>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <QuizReviewEditor
            title={title}
            onTitleChange={setTitle}
            questions={questions}
            onChange={setQuestions}
            disabled={saving}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="h-10 px-4 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
