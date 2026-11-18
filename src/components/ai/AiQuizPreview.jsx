import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import QuizReviewEditor from "@/components/ai/QuizReviewEditor";
import { saveQuizContent } from "@/services/quizService";
import { toDraftQuestion, toQuizContentPayload, validateQuizDraft } from "@/lib/quizDraft";

/**
 * Preview of a generated (already saved) quiz with an optional edit mode.
 * `onSaved(quiz)` gets the edited quiz, or the original one when nothing was edited.
 * Mount with `key={quiz.id}` so a regenerated quiz starts a fresh draft.
 * `regeneratingLabel` is the live progress line shown while a new quiz is generated.
 */
export default function AiQuizPreview({
  quiz,
  regenerating,
  regeneratingLabel,
  onRegenerate,
  onSaved,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(() => quiz.title ?? "");
  const [questions, setQuestions] = useState(() => quiz.questions.map(toDraftQuestion));
  const [saving, setSaving] = useState(false);
  const busy = saving || regenerating;

  const handleSave = async () => {
    if (busy) return;
    if (!editing) {
      onSaved(quiz);
      return;
    }

    const error = validateQuizDraft(title, questions);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    const result = await saveQuizContent(quiz.id, toQuizContentPayload(title, questions));
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || "Could not save the quiz");
      return;
    }
    onSaved({ ...quiz, ...result.data });
  };

  return (
    <div className="space-y-3">
      {editing ? (
        <div className="max-h-[50vh] overflow-auto -mx-1 px-1">
          <QuizReviewEditor
            title={title}
            onTitleChange={setTitle}
            questions={questions}
            onChange={setQuestions}
            disabled={busy}
          />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{quiz.title}</h3>
              <p className="text-xs text-muted-foreground">
                {quiz.questions.length} questions generated
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-auto">
            {quiz.questions.map((q, i) => (
              <div key={i} className="bg-secondary/40 rounded-xl p-3">
                <p className="text-xs font-medium text-foreground mb-1">
                  Q{i + 1}. {q.question}
                </p>
                <div className="space-y-0.5">
                  {q.options.map((o, j) => (
                    <p
                      key={j}
                      className={`text-xs ${j === q.correctIndex ? "text-primary font-medium" : "text-muted-foreground"}`}
                    >
                      {String.fromCharCode(65 + j)}) {o}{" "}
                      {j === q.correctIndex && "✓"}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50 inline-flex items-center justify-center gap-2 px-3"
        >
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
          <span className="truncate">
            {regenerating ? regeneratingLabel || "Regenerating..." : "Regenerate"}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editing ? "Save changes" : "✅ Save Quiz"}
        </button>
      </div>
    </div>
  );
}
