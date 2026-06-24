import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  ChevronLeft,
  Download,
  FileText,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ApplyConfirmDialog from "@/components/ai-plan/ApplyConfirmDialog";
import DifficultyChoiceForm from "@/components/ai-plan/DifficultyChoiceForm";
import DocumentUploadStep from "@/components/ai-plan/DocumentUploadStep";
import ExamDateForm from "@/components/ai-plan/ExamDateForm";
import LinkSubjectForm from "@/components/ai-plan/LinkSubjectForm";
import PlanChatPanel from "@/components/ai-plan/PlanChatPanel";
import PlanTimelinePreview from "@/components/ai-plan/PlanTimelinePreview";
import { useAppStore } from "@/lib/store";
import {
  buildApplyConfirmMessage,
  exportPlanToICS,
  flattenPlanSessions,
  toApplyPlanSessions,
} from "@/lib/study-plan/planActions";
import { AI_PLAN_MODES } from "@/lib/study-plan/types";
import {
  getSubjectScheduleMessage,
  getSubjectScheduleStatus,
  buildSchedulingOverridesFromSubjects,
} from "@/lib/study-plan/subjectSchedule";
import { subjectsQueryOptions } from "@/hooks/queries/subjects";
import {
  analyzeDocumentForPlan,
  applyAiPlan,
  chatAiPlan,
  generateAiPlan,
} from "@/services/aiPlanService";
import { updateSubject } from "@/services/subjectService";

const STEPS = {
  MODE: "mode",
  EXISTING: "existing",
  DOCUMENT: "document",
  EXAM_DATE: "exam_date",
  DIFFICULTY: "difficulty",
  LINK_SUBJECT: "link_subject",
  PREVIEW: "preview",
};

const needsDifficultyStep = (analysis, subject) => {
  if (!analysis) return false;
  const userDiff = subject?.difficulty || "Medium";
  const userHours =
    subject?.requiredHoursPerWeek ?? subject?.credits ?? analysis.hoursPerWeek;
  return (
    analysis.difficulty !== userDiff ||
    Number(analysis.hoursPerWeek) !== Number(userHours)
  );
};

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onApplied?: () => void,
 *   onSubjectsChange?: () => void,
 *   initialContext?: { mode?: string, documentId?: string, subjectId?: string } | null,
 *   subjects: Array<{ id: string, name: string, difficulty?: string|null, requiredHoursPerWeek?: number|null, credits?: number|null, priority?: string|null, examDate?: string|null }>,
 * }} props
 */
export default function AiPlanWizard({
  open,
  onClose,
  onApplied,
  onSubjectsChange,
  initialContext = null,
  subjects = [],
}) {
  const queryClient = useQueryClient();
  const content = useAppStore((state) => state.content);
  const fetchContent = useAppStore((state) => state.fetchContent);
  const uploadContentFile = useAppStore((state) => state.uploadContentFile);
  const contentUploading = useAppStore((state) => state.contentUploading);

  const [step, setStep] = useState(STEPS.MODE);
  const [planMode, setPlanMode] = useState(AI_PLAN_MODES.EXISTING_SUBJECTS);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [linkedSubjectId, setLinkedSubjectId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [examDateValue, setExamDateValue] = useState(undefined);
  const [resolvedExamDate, setResolvedExamDate] = useState("");
  const [schedulingChoice, setSchedulingChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [plan, setPlan] = useState(null);
  const [schedulingOverrides, setSchedulingOverrides] = useState([]);
  const [planConstraints, setPlanConstraints] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const schedulableSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) => getSubjectScheduleStatus(subject).schedulable,
      ),
    [subjects],
  );

  const ineligibleSubjects = useMemo(
    () =>
      subjects
        .map((subject) => ({
          subject,
          ...getSubjectScheduleStatus(subject),
        }))
        .filter((item) => !item.schedulable),
    [subjects],
  );

  const fileDocuments = useMemo(
    () => content.filter((item) => item.type === "file"),
    [content],
  );

  const linkedSubject = useMemo(
    () => subjects.find((subject) => subject.id === linkedSubjectId) || null,
    [subjects, linkedSubjectId],
  );

  const activeSubjectIds = useMemo(() => {
    if (planMode === AI_PLAN_MODES.DOCUMENT) {
      return linkedSubjectId ? [linkedSubjectId] : [];
    }
    return selectedSubjectIds;
  }, [planMode, linkedSubjectId, selectedSubjectIds]);

  const flatSessions = useMemo(
    () => (plan ? flattenPlanSessions(plan.weeks) : []),
    [plan],
  );

  const confirmCopy = useMemo(() => {
    if (!plan) return { title: "", description: "" };
    return buildApplyConfirmMessage(plan.replacePreview, flatSessions.length);
  }, [plan, flatSessions.length]);

  const resetWizard = useCallback(() => {
    setStep(STEPS.MODE);
    setPlanMode(AI_PLAN_MODES.EXISTING_SUBJECTS);
    setSelectedSubjectIds(schedulableSubjects.map((subject) => subject.id));
    setLinkedSubjectId("");
    setDocumentId("");
    setAnalysis(null);
    setExamDateValue(undefined);
    setResolvedExamDate("");
    setSchedulingChoice(null);
    setPlan(null);
    setSchedulingOverrides([]);
    setPlanConstraints([]);
    setChatMessages([]);
    setChatLoading(false);
    setShowConfirm(false);
  }, [schedulableSubjects]);

  const resolveLatestSubjects = useCallback(async () => {
    if (onSubjectsChange) {
      await Promise.resolve(onSubjectsChange());
    }

    try {
      const fresh = await queryClient.fetchQuery(subjectsQueryOptions());
      if (Array.isArray(fresh) && fresh.length > 0) {
        return fresh;
      }
    } catch {
      // Fall back to props when the refetch fails.
    }

    return subjects;
  }, [onSubjectsChange, queryClient, subjects]);

  const runGenerate = useCallback(
    async ({
      subjectIds,
      mode,
      docId,
      choice,
      examDate,
    }) => {
      if (!subjectIds.length) {
        toast.error("Link a subject before generating");
        return;
      }

      if (choice?.updateSubject && subjectIds.length === 1) {
        const result = await updateSubject(subjectIds[0], {
          difficulty: choice.difficulty,
          requiredHoursPerWeek: choice.hoursPerWeek,
          ...(examDate ? { examDate } : {}),
        });
        if (!result.success) {
          toast.error(result.message || "Failed to update subject");
          return;
        }
        onSubjectsChange?.();
      }

      setLoading(true);
      const latestSubjects = await resolveLatestSubjects();
      const overrides = buildSchedulingOverridesFromSubjects(
        latestSubjects,
        subjectIds,
      ).map((item) => {
        const subjectId = item.subjectId;
        return {
          ...item,
          ...(choice?.difficulty ? { difficulty: choice.difficulty } : {}),
          ...(choice?.hoursPerWeek != null
            ? { hoursPerWeek: choice.hoursPerWeek }
            : {}),
          ...(examDate ? { examDate } : {}),
          subjectId,
        };
      });
      const result = await generateAiPlan({
        mode,
        subjectIds,
        documentId: docId || undefined,
        examDate: examDate || undefined,
        schedulingOverrides: overrides,
      });
      setLoading(false);

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to generate study plan");
        return;
      }

      if (result.data.weeks.length === 0) {
        toast.error("No sessions could be scheduled");
      }

      setSchedulingOverrides(overrides);
      setPlanConstraints([]);
      setChatMessages([]);
      setPlan(result.data);
      setStep(STEPS.PREVIEW);
    },
    [onSubjectsChange, resolveLatestSubjects],
  );

  const continueAfterAnalysis = useCallback(
    (analysisResult, subjectIdOverride) => {
      const subject =
        subjects.find(
          (item) =>
            item.id === (subjectIdOverride || linkedSubjectId || analysisResult.linkedSubjectId),
        ) || analysisResult.userSubject;

      const exam =
        analysisResult.examDate ||
        subject?.examDate ||
        resolvedExamDate ||
        (examDateValue ? format(examDateValue, "yyyy-MM-dd") : "");

      if (!exam) {
        setStep(STEPS.EXAM_DATE);
        return;
      }

      setResolvedExamDate(exam);

      if (needsDifficultyStep(analysisResult, subject)) {
        setStep(STEPS.DIFFICULTY);
        return;
      }

      setSchedulingChoice({
        source: "user",
        difficulty: subject?.difficulty || analysisResult.difficulty,
        hoursPerWeek:
          subject?.requiredHoursPerWeek ??
          subject?.credits ??
          analysisResult.hoursPerWeek,
        updateSubject: false,
      });

      const subjectId =
        subjectIdOverride || linkedSubjectId || analysisResult.linkedSubjectId;
      if (!subjectId) {
        setStep(STEPS.LINK_SUBJECT);
        return;
      }

      runGenerate({
        subjectIds: [subjectId],
        mode: AI_PLAN_MODES.DOCUMENT,
        docId: analysisResult.documentId,
        choice: {
          difficulty: subject?.difficulty || analysisResult.difficulty,
          hoursPerWeek:
            subject?.requiredHoursPerWeek ??
            subject?.credits ??
            analysisResult.hoursPerWeek,
          updateSubject: false,
        },
        examDate: exam,
      });
    },
    [
      subjects,
      linkedSubjectId,
      resolvedExamDate,
      examDateValue,
      runGenerate,
    ],
  );

  const runAnalyze = useCallback(
    async (docId, subjectIdOverride) => {
      setLoading(true);
      const result = await analyzeDocumentForPlan({ documentId: docId });
      setLoading(false);

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to analyze document");
        return;
      }

      setAnalysis(result.data);
      setDocumentId(docId);

      if (result.data.linkedSubjectId || subjectIdOverride) {
        setLinkedSubjectId(subjectIdOverride || result.data.linkedSubjectId);
      }

      continueAfterAnalysis(result.data, subjectIdOverride);
    },
    [continueAfterAnalysis],
  );

  useEffect(() => {
    if (!open) return;

    onSubjectsChange?.();
    setStep(STEPS.MODE);
    setPlanMode(AI_PLAN_MODES.EXISTING_SUBJECTS);
    setSelectedSubjectIds(schedulableSubjects.map((subject) => subject.id));
    setLinkedSubjectId("");
    setDocumentId("");
    setAnalysis(null);
    setExamDateValue(undefined);
    setResolvedExamDate("");
    setSchedulingChoice(null);
    setPlan(null);
    setSchedulingOverrides([]);
    setPlanConstraints([]);
    setChatMessages([]);
    setChatLoading(false);
    setShowConfirm(false);
    fetchContent();

    const ctx = initialContext;
    if (ctx?.mode === AI_PLAN_MODES.DOCUMENT && ctx.documentId) {
      setPlanMode(AI_PLAN_MODES.DOCUMENT);
      setDocumentId(ctx.documentId);
      if (ctx.subjectId) {
        setLinkedSubjectId(ctx.subjectId);
      }
      runAnalyze(ctx.documentId, ctx.subjectId);
      return;
    }

    if (ctx?.mode === AI_PLAN_MODES.EXISTING_SUBJECTS) {
      setPlanMode(AI_PLAN_MODES.EXISTING_SUBJECTS);
      setStep(STEPS.EXISTING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialContext?.documentId, initialContext?.subjectId, initialContext?.mode]);

  useEffect(() => {
    if (!open) return;
    setSelectedSubjectIds((prev) => {
      const validIds = schedulableSubjects.map((subject) => subject.id);
      if (validIds.length === 0) return [];
      if (prev.length === 0) return validIds;
      return prev.filter((id) => validIds.includes(id));
    });
  }, [open, schedulableSubjects]);

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleExistingGenerate = async () => {
    if (schedulableSubjects.length === 0) {
      toast.error(
        "No subjects can be scheduled. Update exam dates to at least 1 week in the future.",
      );
      return;
    }

    if (selectedSubjectIds.length === 0) {
      toast.error("Select at least one subject");
      return;
    }

    setLoading(true);
    const latestSubjects = await resolveLatestSubjects();
    const schedulingOverrides = buildSchedulingOverridesFromSubjects(
      latestSubjects,
      selectedSubjectIds,
    );
    const result = await generateAiPlan({
      mode: AI_PLAN_MODES.EXISTING_SUBJECTS,
      subjectIds: selectedSubjectIds,
      schedulingOverrides,
    });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || "Failed to generate study plan");
      return;
    }

    if (result.data.weeks.length === 0) {
      const warning = result.data.warnings?.[0];
      toast.error(
        warning ||
          "No sessions could be scheduled. Check exam dates (must be more than 1 week away).",
      );
      return;
    }

    setSchedulingOverrides(schedulingOverrides);
    setPlanConstraints([]);
    setChatMessages([]);
    setPlan(result.data);
    setStep(STEPS.PREVIEW);
  };

  const handleChatSend = async (message) => {
    if (!activeSubjectIds.length) {
      toast.error("No subjects linked to this plan");
      return;
    }

    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatLoading(true);

    const result = await chatAiPlan({
      message,
      mode: planMode,
      documentId: documentId || undefined,
      subjectIds: activeSubjectIds,
      schedulingOverrides,
      constraints: planConstraints,
      planContext: {
        weeklySummary: plan?.summary,
      },
    });

    setChatLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || "Failed to update plan from chat");
      setChatMessages((prev) => prev.slice(0, -1));
      return;
    }

    const { data } = result;
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);

    if (data.needsClarification) return;

    if (data.schedulingOverrides) {
      setSchedulingOverrides(data.schedulingOverrides);
    }
    if (data.constraints) {
      setPlanConstraints(data.constraints);
    }

    setPlan((current) => ({
      ...current,
      weeks: data.weeks ?? current?.weeks ?? [],
      summary: data.summary ?? current?.summary ?? [],
      replacePreview: data.replacePreview ?? current?.replacePreview ?? [],
      warnings: data.warnings ?? current?.warnings ?? [],
      planStart: data.planStart ?? current?.planStart,
      planEnd: data.planEnd ?? current?.planEnd,
    }));
  };

  const handleUploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^.]+$/, "") || file.name);

    const result = await uploadContentFile(formData);
    if (!result.ok || !result.data?.id) {
      toast.error(result.message || "Failed to upload file");
      return;
    }

    setDocumentId(result.data.id);
    toast.success("File uploaded");
  };

  const handleDifficultyContinue = (choice) => {
    setSchedulingChoice(choice);

    if (!linkedSubjectId) {
      setStep(STEPS.LINK_SUBJECT);
      return;
    }

    runGenerate({
      subjectIds: [linkedSubjectId],
      mode: AI_PLAN_MODES.DOCUMENT,
      docId: documentId,
      choice,
      examDate: resolvedExamDate,
    });
  };

  const handleExamDateContinue = () => {
    if (!examDateValue) return;
    const exam = format(examDateValue, "yyyy-MM-dd");
    setResolvedExamDate(exam);

    const subject = linkedSubject || analysis?.userSubject;
    if (needsDifficultyStep(analysis, subject)) {
      setStep(STEPS.DIFFICULTY);
      return;
    }

    if (!linkedSubjectId) {
      setStep(STEPS.LINK_SUBJECT);
      return;
    }

    runGenerate({
      subjectIds: [linkedSubjectId],
      mode: AI_PLAN_MODES.DOCUMENT,
      docId: documentId,
      choice: {
        difficulty: analysis?.difficulty || "Medium",
        hoursPerWeek: analysis?.hoursPerWeek || 4,
        updateSubject: false,
      },
      examDate: exam,
    });
  };

  const handleClose = () => {
    onClose();
    resetWizard();
  };

  const handleApply = async () => {
    if (!plan || !flatSessions.length) {
      toast.error("No sessions to apply");
      return;
    }

    setApplying(true);
    const result = await applyAiPlan({
      subjectIds: activeSubjectIds,
      sessions: toApplyPlanSessions(flatSessions),
    });
    setApplying(false);
    setShowConfirm(false);

    if (!result.success) {
      toast.error(result.message || "Failed to apply study plan");
      return;
    }

    toast.success(
      `Study plan applied! ${result.data?.created ?? flatSessions.length} session(s) added`,
    );
    onApplied?.();
    handleClose();
  };

  const stepDescription = {
    [STEPS.MODE]: "Choose how you want to build your study plan",
    [STEPS.EXISTING]: "Schedule from subjects until 1 week before exams",
    [STEPS.DOCUMENT]: "Upload or select a syllabus document to analyze",
    [STEPS.EXAM_DATE]: "Add the expected exam date",
    [STEPS.DIFFICULTY]: "Choose which difficulty and workload to use",
    [STEPS.LINK_SUBJECT]: "Link the plan to a subject",
    [STEPS.PREVIEW]: "Review your multi-week timeline before applying",
  };

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-5xl z-10 max-h-[90vh] overflow-auto border border-border"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  AI Study Plan
                </h2>
                <p className="text-xs text-muted-foreground">
                  {stepDescription[step]}
                </p>
              </div>
            </div>

            {loading && step !== STEPS.PREVIEW ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                Working on your plan…
              </div>
            ) : step === STEPS.MODE ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlanMode(AI_PLAN_MODES.EXISTING_SUBJECTS);
                    setStep(STEPS.EXISTING);
                  }}
                  className="rounded-2xl border border-border bg-secondary/30 p-5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <Sparkles className="h-5 w-5 text-primary mb-3" />
                  <p className="font-medium text-foreground">From my subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use difficulty, hours, and exam dates already in your subjects.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanMode(AI_PLAN_MODES.DOCUMENT);
                    setStep(STEPS.DOCUMENT);
                  }}
                  className="rounded-2xl border border-border bg-secondary/30 p-5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-primary mb-3" />
                  <p className="font-medium text-foreground">From a document</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a syllabus and let the system estimate workload before scheduling.
                  </p>
                </button>
              </div>
            ) : step === STEPS.EXISTING ? (
              <div className="space-y-4">
                {schedulableSubjects.length === 0 ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
                    <p className="font-medium">No subjects ready for planning</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each subject needs an exam date at least 1 week in the future.
                      Plans run from today until 7 days before the exam.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
                    {schedulableSubjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary/60 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSubjectIds.includes(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                          />
                          <span className="text-sm font-medium">{subject.name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          exam {subject.examDate?.slice(0, 10)} ·{" "}
                          {subject.requiredHoursPerWeek || subject.credits || 3}h/wk
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {ineligibleSubjects.length > 0 && (
                  <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Not available for planning
                    </p>
                    {ineligibleSubjects.map(({ subject, reason }) => (
                      <div
                        key={subject.id}
                        className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 opacity-70"
                      >
                        <span className="text-sm text-foreground">{subject.name}</span>
                        <span className="text-[10px] text-muted-foreground text-right max-w-[55%]">
                          {getSubjectScheduleMessage(reason)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.MODE)}
                    className="h-10 px-4 rounded-full bg-secondary text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExistingGenerate}
                    disabled={schedulableSubjects.length === 0}
                    className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    Generate Plan
                  </button>
                </div>
              </div>
            ) : step === STEPS.DOCUMENT ? (
              <DocumentUploadStep
                fileDocuments={fileDocuments}
                selectedDocumentId={documentId}
                uploading={contentUploading}
                onSelectDocument={setDocumentId}
                onUploadFile={handleUploadDocument}
                onContinue={() => runAnalyze(documentId)}
                onBack={() => setStep(STEPS.MODE)}
              />
            ) : step === STEPS.EXAM_DATE ? (
              <ExamDateForm
                value={examDateValue}
                onChange={setExamDateValue}
                onContinue={handleExamDateContinue}
                onBack={() => setStep(STEPS.DOCUMENT)}
              />
            ) : step === STEPS.DIFFICULTY && analysis ? (
              <DifficultyChoiceForm
                userDifficulty={linkedSubject?.difficulty || analysis.userSubject?.difficulty}
                userHours={
                  linkedSubject?.requiredHoursPerWeek ??
                  linkedSubject?.credits ??
                  analysis.userSubject?.requiredHoursPerWeek ??
                  analysis.userSubject?.credits
                }
                aiDifficulty={analysis.difficulty}
                aiHours={analysis.hoursPerWeek}
                rationale={analysis.rationale}
                onContinue={handleDifficultyContinue}
                onBack={() =>
                  setStep(resolvedExamDate ? STEPS.DOCUMENT : STEPS.EXAM_DATE)
                }
              />
            ) : step === STEPS.LINK_SUBJECT ? (
              <LinkSubjectForm
                subjects={subjects}
                suggestedName={analysis?.suggestedName || ""}
                examDate={
                  resolvedExamDate
                    ? new Date(`${resolvedExamDate}T12:00:00`)
                    : examDateValue
                }
                difficulty={schedulingChoice?.difficulty || analysis?.difficulty}
                hoursPerWeek={
                  schedulingChoice?.hoursPerWeek || analysis?.hoursPerWeek || 4
                }
                onLinked={(subjectId) => {
                  setLinkedSubjectId(subjectId);
                  runGenerate({
                    subjectIds: [subjectId],
                    mode: AI_PLAN_MODES.DOCUMENT,
                    docId: documentId,
                    choice: schedulingChoice || {
                      difficulty: analysis?.difficulty,
                      hoursPerWeek: analysis?.hoursPerWeek,
                      updateSubject: false,
                    },
                    examDate: resolvedExamDate,
                  });
                }}
                onSubjectCreated={onSubjectsChange}
                onBack={() => setStep(STEPS.DIFFICULTY)}
              />
            ) : (
              <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
                {plan && (
                  <PlanTimelinePreview
                    weeks={plan.weeks}
                    summary={plan.summary}
                  />
                )}
                <PlanChatPanel
                  messages={chatMessages}
                  loading={chatLoading}
                  onSend={handleChatSend}
                />

                <div className="lg:col-span-2 flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setStep(
                        planMode === AI_PLAN_MODES.DOCUMENT
                          ? STEPS.DOCUMENT
                          : STEPS.EXISTING,
                      )
                    }
                    className="inline-flex items-center gap-1 h-10 px-4 rounded-full bg-secondary text-sm font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 px-4 rounded-full bg-secondary text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!flatSessions.length) return;
                      exportPlanToICS(flatSessions);
                      toast.success("Calendar file downloaded");
                    }}
                    disabled={!flatSessions.length}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-secondary text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" /> Download ICS
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    disabled={!flatSessions.length || applying}
                    className="ml-auto h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    Apply plan
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      <ApplyConfirmDialog
        open={showConfirm}
        title={confirmCopy.title}
        description={confirmCopy.description}
        loading={applying}
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
