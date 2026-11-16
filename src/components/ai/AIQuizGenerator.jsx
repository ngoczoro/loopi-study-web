"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  generateDocumentQuiz,
  isAiQuizSupported,
  mapGeneratedQuizForStore,
} from "@/services/aiService";
import { deleteQuiz, saveQuizContent } from "@/services/quizService";
import QuizReviewEditor from "./QuizReviewEditor";
import {
  toDraftQuestion,
  toQuizContentPayload,
  validateQuizDraft,
} from "@/lib/quizDraft";

const DIFFICULTY_OPTIONS = [
  { value: "mixed", label: "Mixed difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

export default function AIQuizGenerator({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  document,
  subjectId,
  onQuizCreated,
}) {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("mixed");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  // Set after generation: the quiz is already saved, the user reviews and edits it here.
  const [generated, setGenerated] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftQuestions, setDraftQuestions] = useState([]);

  const supported = isAiQuizSupported(document ?? { id: documentId });
  const reviewing = Boolean(generated);

  const finish = () => {
    setGenerated(null);
    setDraftTitle("");
    setDraftQuestions([]);
    onOpenChange(false);
  };

  // Closing during review keeps the quiz as generated.
  const handleClose = () => {
    if (loading) return;
    if (generated) {
      onQuizCreated?.(generated);
      toast.success("Quiz kept as generated");
    }
    finish();
  };

  const handleDiscard = async () => {
    if (!generated || loading) return;
    setLoading(true);
    const result = await deleteQuiz(generated.id);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || "Could not discard this quiz");
      return;
    }
    toast.success("Quiz discarded");
    finish();
  };

  const handleSave = async () => {
    if (!generated || loading) return;
    const error = validateQuizDraft(draftTitle, draftQuestions);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    const result = await saveQuizContent(
      generated.id,
      toQuizContentPayload(draftTitle, draftQuestions),
    );
    setLoading(false);

    if (!result.success) {
      toast.error(result.message || "Could not save the quiz");
      return;
    }

    const quiz = { ...generated, ...result.data };
    onQuizCreated?.(quiz);
    toast.success("Quiz saved");
    finish();
    navigate("/quiz", { state: { activeQuizId: quiz.id } });
  };

  const handleGenerate = async () => {
    if (!documentId || loading || !supported) return;

    setLoading(true);
    const result = await generateDocumentQuiz(documentId, {
      difficulty,
      numberOfQuestions,
      forceRegenerate: true,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.message || "Could not generate a quiz from this document");
      return;
    }

    const quiz = mapGeneratedQuizForStore(result.data, {
      subjectId: document?.subjectId ?? subjectId ?? null,
      sourceDocumentId: documentId,
    });

    setGenerated(quiz);
    setDraftTitle(quiz.title ?? "");
    setDraftQuestions(quiz.questions.map(toDraftQuestion));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={reviewing ? undefined : handleClose}
      />
      <div
        className={`relative bg-card rounded-2xl p-6 shadow-soft-lg w-full z-10 ${
          reviewing ? "max-w-2xl max-h-[90vh] flex flex-col" : "max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              {reviewing ? "Review quiz" : "Generate quiz"}
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {documentTitle || "Document"}
            </p>
          </div>
        </div>

        {reviewing ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Edit questions, answers and explanations before you start. Changes are saved when you click Save.
            </p>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <QuizReviewEditor
                title={draftTitle}
                onTitleChange={setDraftTitle}
                questions={draftQuestions}
                onChange={setDraftQuestions}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={loading}
                className="h-10 px-4 rounded-full border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save and start quiz
              </button>
            </div>
          </>
        ) : !supported ? (
          <p className="text-sm text-muted-foreground">
            This document type cannot be turned into a quiz yet.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Questions are written from this document. Every answer has to come from a fact in your notes.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={loading}
                className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none disabled:opacity-50"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Number of questions
              </label>
              <select
                value={numberOfQuestions}
                onChange={(e) =>
                  setNumberOfQuestions(Number(e.target.value))
                }
                disabled={loading}
                className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none disabled:opacity-50"
              >
                {QUESTION_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} questions
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating quiz...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate quiz
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
