import { useState, useRef } from "react";
import { Eye, EyeOff, Sparkles, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { generateMockQuiz, moderateContent } from "@/lib/ai-utils";

import QuizList from "@/components/QuizList";
import QuizResultSummary from "@/components/QuizResultSummary";
import QuizQuestionCard from "@/components/QuizQuestionCard";

export default function Quiz() {
  const quizzes = useAppStore((s) => s.quizzes) || [];
  const subjects = useAppStore((s) => s.subjects) || [];
  const deleteQuiz = useAppStore((s) => s.deleteQuiz);
  const addQuiz = useAppStore((s) => s.addQuiz);
  const addViolation = useAppStore((s) => s.addViolation);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [lastAttempts, setLastAttempts] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const startTimeRef = useRef(0);

  // AI
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiSubjectId, setAiSubjectId] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  const quiz = quizzes.find((q) => q.id === activeQuiz);

  // ===== HANDLERS =====
  const handleSelectQuiz = (id) => {
    setActiveQuiz(id);
    setAnswers({});
    setShowResults(false);
    setReviewMode(false);
    setShowAllExplanations(false);
    startTimeRef.current = Date.now();
  };

  const handleAnswer = (qIndex, optIndex) => {
    if (showResults || reviewMode) return;
    setAnswers((a) => ({ ...a, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error("Please answer all questions first!");
      return;
    }

    const correct = quiz.questions.filter(
      (q, i) => answers[i] === q.correctIndex,
    ).length;

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const attempt = {
      quizId: quiz.id,
      score: correct,
      total: quiz.questions.length,
      answers: { ...answers },
      date: new Date().toLocaleString(),
      timeSpent,
    };

    setLastAttempts((prev) => ({ ...prev, [quiz.id]: attempt }));
    setShowResults(true);

    toast.success(
      `Quiz submitted! ${correct}/${quiz.questions.length} correct 🎉`,
    );
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
    setReviewMode(false);
    setShowAllExplanations(false);
    startTimeRef.current = Date.now();
  };

  const handleReviewLast = (quizId) => {
    const attempt = lastAttempts[quizId];
    if (!attempt) return;

    setActiveQuiz(quizId);
    setAnswers(attempt.answers);
    setShowResults(true);
    setReviewMode(true);
    setShowAllExplanations(false);
  };

  const handleDeleteQuiz = (id) => {
    deleteQuiz(id);

    if (activeQuiz === id) setActiveQuiz(null);

    const newAttempts = { ...lastAttempts };
    delete newAttempts[id];
    setLastAttempts(newAttempts);

    toast.success("Quiz deleted successfully!");
  };

  const handleBack = () => {
    setActiveQuiz(null);
    setReviewMode(false);
    setShowAllExplanations(false);
  };

  // ===== AI =====
  const handleAiGenerate = () => {
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

      toast.error("Content flagged.");
      return;
    }

    setAiLoading(true);

    setTimeout(() => {
      const result = generateMockQuiz(aiTopic, aiSubjectId || null);
      setAiPreview(result);
      setAiLoading(false);
    }, 1200);
  };

  const handleConfirmQuiz = () => {
    if (!aiPreview) return;

    addQuiz({
      title: aiPreview.title,
      subjectId: aiSubjectId || null,
      questions: aiPreview.questions,
      createdAt: new Date().toISOString(),
    });

    toast.success("Quiz saved!");

    setShowAiModal(false);
    setAiPreview(null);
    setAiTopic("");
    setAiSubjectId("");
  };

  // ===== LIST VIEW =====
  if (!quiz) {
    return (
      <>
        <QuizList
          quizzes={quizzes}
          lastAttempts={lastAttempts}
          onSelectQuiz={handleSelectQuiz}
          onReviewQuiz={handleReviewLast}
          onDeleteQuiz={handleDeleteQuiz}
          onGenerateWithAi={() => setShowAiModal(true)}
        />

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
                className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-lg z-10"
              >
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Generate Quiz with AI
                  </h2>
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

                    <button
                      onClick={handleAiGenerate}
                      disabled={aiLoading}
                      className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Quiz
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

                    <div className="space-y-3 max-h-60 overflow-auto">
                      {aiPreview.questions.map((q, i) => (
                        <QuizQuestionCard
                          key={i}
                          question={q}
                          index={i}
                          selectedAnswer={q.correctIndex}
                          showResults={true}
                          onAnswer={() => {}}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAiPreview(null)}
                        className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
                      >
                        Regenerate
                      </button>

                      <button
                        onClick={handleConfirmQuiz}
                        className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform"
                      >
                        Save Quiz
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

  // ===== QUIZ VIEW =====
  const correctCount = showResults
    ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;

  const currentAttempt = lastAttempts[quiz.id];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* HEADER + BACK */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {quiz.title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {reviewMode
              ? "Reviewing your last attempt"
              : `${quiz.questions.length} questions`}
          </p>
        </div>

        <button
          onClick={handleBack}
          className="text-sm text-primary font-medium hover:underline"
        >
          ← Back
        </button>
      </div>

      {/* RESULT */}
      {showResults && (
        <>
          <QuizResultSummary
            correctCount={correctCount}
            totalCount={quiz.questions.length}
            reviewMode={reviewMode}
            timeSpent={currentAttempt?.timeSpent}
            onReset={handleReset}
            onBack={handleBack}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Question Review
            </p>

            <button
              onClick={() => setShowAllExplanations((prev) => !prev)}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              {showAllExplanations ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              {showAllExplanations
                ? "Hide All Explanations"
                : "Show All Explanations"}
            </button>
          </div>
        </>
      )}

      {/* QUESTIONS */}
      {quiz.questions.map((q, i) => (
        <QuizQuestionCard
          key={i}
          question={q}
          index={i}
          selectedAnswer={answers[i]}
          showResults={showResults}
          onAnswer={(oi) => handleAnswer(i, oi)}
          forceExpandExplanation={showResults ? showAllExplanations : undefined}
        />
      ))}

      {!showResults && (
        <button
          onClick={handleSubmit}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.01] active:scale-[0.98] transition-transform"
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}
