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

const DIFFICULTY_OPTIONS = [
  { value: "mixed", label: "Mix nhiều mức độ" },
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
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

  const supported = isAiQuizSupported(document ?? { id: documentId });

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
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
      toast.error(result.message || "Không thể tạo quiz bằng AI");
      return;
    }

    const quiz = mapGeneratedQuizForStore(result.data, {
      subjectId: document?.subjectId ?? subjectId ?? null,
      sourceDocumentId: documentId,
    });

    onQuizCreated?.(quiz);
    toast.success("Quiz AI đã được tạo thành công");
    onOpenChange(false);
    navigate("/quiz", { state: { activeQuizId: quiz.id } });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10">
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
              Tạo Quiz bằng AI
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {documentTitle || "Tài liệu"}
            </p>
          </div>
        </div>

        {!supported ? (
          <p className="text-sm text-muted-foreground">
            Loại tài liệu này chưa hỗ trợ tạo quiz bằng AI.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Mỗi lần tạo sẽ sinh một bộ câu hỏi mới dựa trên tài liệu đã chọn.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Độ khó
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
                Số câu hỏi
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
                    {count} câu
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
                  Đang tạo quiz...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Tạo Quiz bằng AI
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
