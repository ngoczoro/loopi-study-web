import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAdminDemoStore } from "@/lib/adminDemoStore";
import { useSubjects } from "@/hooks/useSubjects";
import { toast } from "sonner";
import { moderateContent } from "@/lib/ai-utils";
import {
  generatePracticeQuiz,
  generateSubjectQuiz,
  mapGeneratedQuizForStore,
} from "@/services/aiService";
import { useLocation, useNavigate } from "react-router-dom";
import QuizList from "@/components/QuizList";
import QuizReviewSummary from "@/components/QuizReviewSummary";
import QuizWeakTopicsCard from "@/components/QuizWeakTopicsCard";
import QuizReviewQuestionCard from "@/components/QuizReviewQuestionCard";
import QuizAttemptHistory from "@/components/QuizAttemptHistory";
import QuizQuestionCard from "@/components/QuizQuestionCard";
import { cn } from "@/lib/utils";
import { filterReviewAnswers } from "@/lib/quizReviewUtils";
import {
  getQuizById,
  submitQuizAttempt,
  getLatestQuizAttempt,
  getQuizAttempts,
} from "@/services/quizService";

const REVIEW_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "incorrect", label: "Câu sai" },
  { value: "correct", label: "Câu đúng" },
];

export default function Quiz() {
  const {
    quizzes,
    quizzesLoading,
    fetchQuizzes,
    deleteQuiz,
    updateQuiz,
    upsertQuiz,
  } = useAppStore();
  const { subjects } = useSubjects();
  const addViolation = useAdminDemoStore((s) => s.addViolation);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [lastAttempts, setLastAttempts] = useState({});
  const [viewingAttempt, setViewingAttempt] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);
  const startTimeRef = useRef(0);
  const consumedDeepLinkRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiSubjectId, setAiSubjectId] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("mixed");
  const [aiNumberOfQuestions, setAiNumberOfQuestions] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  const quiz = activeQuiz
    ? (quizzes ?? []).find((q) => q.id === activeQuiz)
    : null;
  const activeAttempt = viewingAttempt ?? (quiz ? lastAttempts[quiz.id] : null);

  const loadAttemptHistory = useCallback(async (quizId) => {
    setHistoryLoading(true);
    const result = await getQuizAttempts(quizId);
    setHistoryLoading(false);

    if (result.success) {
      setAttemptHistory(result.data);
      return result.data;
    }

    setAttemptHistory([]);
    return [];
  }, []);

  const applyAttemptReview = useCallback((attempt) => {
    if (!attempt) return;

    setViewingAttempt(attempt);
    setAnswers(attempt.answers ?? {});
    setShowResults(true);
    setReviewMode(true);
    setReviewFilter("all");
  }, []);

  const handleSelectQuiz = (id) => {
    setActiveQuiz(id);
    setAnswers({});
    setShowResults(false);
    setReviewMode(false);
    setReviewFilter("all");
    setViewingAttempt(null);
    setAttemptHistory([]);
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    if (quizzesLoading || quizzes.length === 0) return;

    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        quizzes.map(async (item) => {
          const result = await getLatestQuizAttempt(item.id);
          if (result.success && result.data) {
            return [item.id, result.data];
          }
          return null;
        }),
      );

      if (cancelled) return;

      const nextAttempts = {};
      entries.forEach((entry) => {
        if (entry) {
          nextAttempts[entry[0]] = entry[1];
        }
      });

      setLastAttempts(nextAttempts);
    })();

    return () => {
      cancelled = true;
    };
  }, [quizzes, quizzesLoading]);

  const clearQuizRouteState = useCallback(() => {
    if (location.state?.activeQuizId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const targetId = location.state?.activeQuizId;
    if (!targetId || activeQuiz || quizzesLoading) return;
    if (consumedDeepLinkRef.current === targetId) return;

    consumedDeepLinkRef.current = targetId;

    const matchedQuiz = quizzes.find((item) => item.id === targetId);
    if (matchedQuiz) {
      handleSelectQuiz(targetId);
      clearQuizRouteState();
      return;
    }

    let cancelled = false;
    setDeepLinkLoading(true);

    (async () => {
      const result = await getQuizById(targetId);
      if (cancelled) return;

      setDeepLinkLoading(false);

      if (!result.success || !result.data) {
        consumedDeepLinkRef.current = null;
        toast.error(result.message || "Quiz not found");
        clearQuizRouteState();
        return;
      }

      upsertQuiz(result.data);
      handleSelectQuiz(targetId);
      clearQuizRouteState();
    })();

    return () => {
      cancelled = true;
      setDeepLinkLoading(false);
    };
  }, [
    location.state,
    quizzes,
    quizzesLoading,
    activeQuiz,
    upsertQuiz,
    clearQuizRouteState,
  ]);

  useEffect(() => {
    if (!activeQuiz || quizzesLoading || deepLinkLoading) return;

    const exists = (quizzes ?? []).some((item) => item.id === activeQuiz);
    if (!exists) {
      setActiveQuiz(null);
      consumedDeepLinkRef.current = null;
      clearQuizRouteState();
    }
  }, [activeQuiz, quizzes, quizzesLoading, deepLinkLoading, clearQuizRouteState]);

  useEffect(() => {
    if (!showResults || !quiz?.id) return;

    loadAttemptHistory(quiz.id);
  }, [showResults, quiz?.id, loadAttemptHistory]);

  const handleAnswer = (qIndex, optIndex) => {
    if (showResults || reviewMode) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting) return;
    const questions = quiz.questions ?? [];
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions first!");
      return;
    }

    setSubmitting(true);

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const result = await submitQuizAttempt(quiz.id, {
      answers: questions.map((_, index) => ({
        questionIndex: index,
        selectedIndex: answers[index],
      })),
      startedAt: new Date(startTimeRef.current).toISOString(),
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.message || "Failed to submit quiz");
      return;
    }

    setLastAttempts((prev) => ({ ...prev, [quiz.id]: result.data }));
    applyAttemptReview(result.data);
    setReviewMode(false);
    toast.success(
      `Quiz submitted! ${result.data.score}/${result.data.total} correct 🎉`,
    );

    const firstWrong = (result.data.answerDetails ?? []).find(
      (item) => item.isCorrect === false,
    );
    if (firstWrong) {
      setTimeout(() => {
        document
          .getElementById(`quiz-review-q-${firstWrong.questionIndex}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
    setReviewMode(false);
    setReviewFilter("all");
    setViewingAttempt(null);
    startTimeRef.current = Date.now();
  };

  const handleReviewLast = async (quizId) => {
    const attempt = lastAttempts[quizId];
    if (!attempt) return;

    setActiveQuiz(quizId);
    applyAttemptReview(attempt);
    await loadAttemptHistory(quizId);
  };

  const handleSelectHistoryAttempt = (attempt) => {
    applyAttemptReview(attempt);
  };

  const handleDeleteQuiz = async (id) => {
    const result = await deleteQuiz(id);
    if (!result.ok) {
      toast.error(result.message || "Failed to delete quiz");
      return;
    }

    if (activeQuiz === id) setActiveQuiz(null);
    const newAttempts = { ...lastAttempts };
    delete newAttempts[id];
    setLastAttempts(newAttempts);
    toast.success("Quiz deleted successfully!");
  };

  const handleRenameQuiz = async (quizId, title) => {
    const result = await updateQuiz(quizId, title);
    if (!result.ok) {
      toast.error(result.message || "Failed to rename quiz");
      return result;
    }

    toast.success("Quiz renamed successfully");
    return result;
  };

  const handleBack = () => {
    setActiveQuiz(null);
    setAnswers({});
    setShowResults(false);
    setReviewMode(false);
    setViewingAttempt(null);
    setAttemptHistory([]);
    setReviewFilter("all");
    consumedDeepLinkRef.current = null;
    clearQuizRouteState();
  };

  const handleAiGenerate = async (forceRegenerate = true) => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    const modResult = moderateContent(aiTopic);
    if (modResult?.flagged) {
      addViolation({
        userId: "u1",
        userName: "Student",
        userEmail: "student@example.com",
        type: modResult.type,
        contentId: "",
        contentTitle: aiTopic,
        contentType: "note",
        detectedAt: new Date().toLocaleString(),
        resolved: false,
      });
      toast.error("Content flagged for moderation. Please use appropriate content.");
      return;
    }

    setAiLoading(true);

    const options = {
      topic: aiTopic.trim(),
      difficulty: aiDifficulty,
      numberOfQuestions: aiNumberOfQuestions,
      forceRegenerate,
    };

    const result = aiSubjectId
      ? await generateSubjectQuiz(aiSubjectId, options)
      : await generatePracticeQuiz({
          ...options,
          subjectId: null,
        });

    setAiLoading(false);

    if (!result.success) {
      toast.error(result.message || "Không thể tạo quiz bằng AI");
      return;
    }

    const quiz = mapGeneratedQuizForStore(result.data, {
      subjectId: aiSubjectId || null,
    });
    upsertQuiz(quiz);
    setAiPreview(quiz);
  };

  const handleConfirmQuiz = () => {
    if (!aiPreview) return;

    toast.success("Quiz saved! 🎉");
    setShowAiModal(false);
    setAiPreview(null);
    setAiTopic("");
    setAiSubjectId("");
    setActiveQuiz(aiPreview.id);
  };

  if (!quiz) {
    if (activeQuiz && (quizzesLoading || deepLinkLoading)) {
      return (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading quiz...
        </div>
      );
    }

    return (
      <>
        {quizzesLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading quizzes...
          </div>
        ) : (
          <QuizList
            quizzes={quizzes}
            lastAttempts={lastAttempts}
            subjects={subjects}
            onSelectQuiz={handleSelectQuiz}
            onReviewQuiz={handleReviewLast}
            onDeleteQuiz={handleDeleteQuiz}
            onRenameQuiz={handleRenameQuiz}
            onGenerateWithAi={() => setShowAiModal(true)}
          />
        )}

        <AnimatePresence>
          {showAiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
                onClick={() => {
                  setShowAiModal(false);
                  setAiPreview(null);
                }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-lg z-10 max-h-[85vh] overflow-auto"
              >
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    setAiPreview(null);
                  }}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      Generate Quiz with AI
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Enter a topic and AI will create questions
                    </p>
                  </div>
                </div>

                {!aiPreview ? (
                  <div className="space-y-3">
                    <input
                      placeholder="Enter topic (e.g., Linear Algebra, Photosynthesis)"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <select
                      value={aiSubjectId}
                      onChange={(e) => setAiSubjectId(e.target.value)}
                      className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                    >
                      <option value="">No subject (General)</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      disabled={aiLoading}
                      className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none disabled:opacity-50"
                    >
                      <option value="mixed">Mix nhiều mức độ</option>
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                    <select
                      value={aiNumberOfQuestions}
                      onChange={(e) =>
                        setAiNumberOfQuestions(Number(e.target.value))
                      }
                      disabled={aiLoading}
                      className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none disabled:opacity-50"
                    >
                      {[5, 10, 15, 20].map((count) => (
                        <option key={count} value={count}>
                          {count} câu
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAiGenerate(true)}
                      disabled={aiLoading}
                      className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Generate Quiz
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {aiPreview.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {aiPreview.questions.length} questions generated
                    </p>
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {aiPreview.questions.map((q, i) => (
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAiGenerate(true)}
                        disabled={aiLoading}
                        className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleConfirmQuiz}
                        className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform"
                      >
                        ✅ Save Quiz
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const reviewAnswers = filterReviewAnswers(
    activeAttempt?.answerDetails ?? [],
    reviewFilter,
  ).sort((a, b) => a.questionIndex - b.questionIndex);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showResults
              ? "📋 Xem lại kết quả bài làm"
              : `${(quiz.questions ?? []).length} câu hỏi`}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="text-sm text-primary font-medium hover:underline"
        >
          ← Back
        </button>
      </div>

      {showResults && activeAttempt && (
        <>
          <QuizReviewSummary
            correctCount={activeAttempt.correctCount ?? activeAttempt.score ?? 0}
            totalCount={activeAttempt.totalQuestions ?? activeAttempt.total ?? quiz.questions.length}
            scorePercentage={activeAttempt.scorePercentage}
            submittedAt={activeAttempt.submittedAt ?? activeAttempt.date}
            durationSeconds={activeAttempt.durationSeconds}
            reviewMode={reviewMode}
            onReset={handleReset}
            onBack={handleBack}
          />

          <QuizWeakTopicsCard weakTopics={activeAttempt.weakTopics} />

          {historyLoading ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải lịch sử làm bài...
            </div>
          ) : (
            <QuizAttemptHistory
              attempts={attemptHistory}
              activeAttemptId={activeAttempt.id}
              onSelectAttempt={handleSelectHistoryAttempt}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {REVIEW_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setReviewFilter(filter.value)}
                className={cn(
                  "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                  reviewFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {reviewAnswers.length === 0 ? (
              <div className="bg-card rounded-2xl p-5 shadow-soft text-sm text-muted-foreground text-center">
                Không có câu hỏi nào trong bộ lọc này.
              </div>
            ) : (
              reviewAnswers.map((answerDetail) => (
                <div
                  key={answerDetail.questionIndex}
                  id={`quiz-review-q-${answerDetail.questionIndex}`}
                >
                  <QuizReviewQuestionCard
                    answerDetail={answerDetail}
                    options={quiz.questions[answerDetail.questionIndex]?.options ?? []}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!showResults && (
        <>
          <div className="space-y-4">
            {(quiz.questions ?? []).map((q, qi) => (
              <div key={qi} id={`quiz-q-${qi}`}>
                <QuizQuestionCard
                  question={q}
                  index={qi}
                  selectedAnswer={answers[qi]}
                  showResults={false}
                  onAnswer={(oi) => handleAnswer(qi, oi)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </button>
        </>
      )}
    </div>
  );
}
