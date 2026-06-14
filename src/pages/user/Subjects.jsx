import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Star,
  Calendar,
  Trash2,
  X,
  FileText,
  Upload,
  Link2,
  PenLine,
  Eye,
  Edit3,
  CalendarIcon,
  Play,
  Sparkles,
  Loader2,
  Brain,
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import { Calendar as CalendarPicker } from "@/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { toast } from "sonner";
import { moderateContent } from "@/lib/ai-utils";
import {
  generateSubjectQuiz,
  mapGeneratedQuizForStore,
} from "@/services/aiService";
import AIDocumentSummary from "@/components/ai/AIDocumentSummary";
import AIQuizGenerator from "@/components/ai/AIQuizGenerator";
import AiPlanWizard from "@/components/ai-plan/AiPlanWizard";
import { AI_PLAN_MODES } from "@/lib/study-plan/types";
import {
  isValidUrl,
  normalizeSubjectId,
  validateUploadFile,
  handleUploadFileSelection,
  FILE_INPUT_ACCEPT,
  SUPPORTED_FILES_LABEL,
} from "@/lib/content-utils";
import { useAuthStore } from "@/lib/authStore";
import { FilePreviewActions } from "@/components/FilePreviewActions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/sheet";
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/accordion";

const typeIcons = { note: FileText, file: Upload, link: Link2 };

const formatExamDate = (examDate) => {
  if (!examDate) return "";
  try {
    const parsed = new Date(`${examDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return examDate;
    return format(parsed, "MMM dd");
  } catch {
    return examDate;
  }
};

export default function Subjects() {
  const content = useAppStore((state) => state.content);
  const {
    subjects,
    quizzes,
    subjectsLoading,
    subjectsError,
    contentLoading,
    contentUploading,
    contentError,
    fetchSubjects,
    fetchSubjectById,
    fetchContent,
    fetchContentBySubject,
    addSubject,
    updateSubject,
    deleteSubject,
    createContentNote,
    createContentLink,
    uploadContentFile,
    updateContentItem,
    deleteContentItem,
    addQuiz,
    fetchQuizzes,
    upsertQuiz,
    addViolation,
  } = useAppStore();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDocId, setDeleteDocId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("note");
  const [newForm, setNewForm] = useState({
    name: "",
    credits: "3",
    difficulty: "Medium",
    examDate: undefined,
    requiredHoursPerWeek: "",
    priority: "medium",
  });
  const [examDateError, setExamDateError] = useState("");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    subjectId: "",
    content: "",
    url: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [quizTargetDoc, setQuizTargetDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    subjectId: "",
  });

  // Quick AI Quiz state (per subject)
  const [quizSubject, setQuizSubject] = useState(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("mixed");
  const [aiNumberOfQuestions, setAiNumberOfQuestions] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [showAiPlanWizard, setShowAiPlanWizard] = useState(false);
  const [aiPlanContext, setAiPlanContext] = useState(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  const isEditMode = Boolean(editingSubjectId);

  const defaultSubjectForm = {
    name: "",
    credits: "3",
    difficulty: "Medium",
    examDate: undefined,
    requiredHoursPerWeek: "",
    priority: "medium",
  };

  const resetSubjectForm = () => {
    setNewForm(defaultSubjectForm);
    setExamDateError("");
    setEditingSubjectId(null);
  };

  const openAddSubject = () => {
    resetSubjectForm();
    setShowAdd(true);
  };

  const openEditSubject = (subject) => {
    setEditingSubjectId(subject.id);
    setNewForm({
      name: subject.name,
      credits: String(subject.credits ?? 3),
      difficulty: subject.difficulty || "Medium",
      examDate: subject.examDate
        ? new Date(`${subject.examDate}T00:00:00`)
        : undefined,
      requiredHoursPerWeek:
        subject.requiredHoursPerWeek != null
          ? String(subject.requiredHoursPerWeek)
          : "",
      priority: subject.priority || "medium",
    });
    setExamDateError("");
    setShowAdd(true);
  };

  const closeSubjectForm = () => {
    setShowAdd(false);
    resetSubjectForm();
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchSubjects();
    fetchContent();
    fetchQuizzes();
  }, [accessToken, fetchSubjects, fetchContent, fetchQuizzes]);

  useEffect(() => {
    if (subjectsError) {
      toast.error(subjectsError);
    }
  }, [subjectsError]);

  useEffect(() => {
    if (contentError) {
      toast.error(contentError);
    }
  }, [contentError]);

  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    const result = await fetchSubjectById(subject.id);
    if (result.ok) {
      setSelectedSubject(result.data);
    } else if (result.message) {
      toast.error(result.message);
    }
    await fetchContentBySubject(subject.id);
  };

  const openQuickQuiz = (s) => {
    setQuizSubject(s);
    setAiTopic(s.name);
    setAiPreview(null);
  };

  const handleQuizCreated = (quiz) => {
    addQuiz(quiz);
    setViewDoc(null);
    fetchQuizzes();
  };

  const handleGenerateQuiz = async (forceRegenerate = true) => {
    if (!quizSubject) return;

    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    const mod = moderateContent(aiTopic);
    if (mod?.flagged) {
      addViolation({
        userId: "u1",
        userName: "Student",
        userEmail: "student@example.com",
        type: mod.type,
        contentId: "",
        contentTitle: aiTopic,
        contentType: "note",
        detectedAt: new Date().toLocaleString(),
        resolved: false,
      });
      toast.error("Content flagged for moderation.");
      return;
    }

    setAiLoading(true);
    const result = await generateSubjectQuiz(quizSubject.id, {
      topic: aiTopic.trim(),
      difficulty: aiDifficulty,
      numberOfQuestions: aiNumberOfQuestions,
      forceRegenerate,
    });
    setAiLoading(false);

    if (!result.success) {
      toast.error(result.message || "Không thể tạo quiz bằng AI");
      return;
    }

    const quiz = mapGeneratedQuizForStore(result.data, {
      subjectId: quizSubject.id,
    });
    upsertQuiz(quiz);
    setAiPreview(quiz);
  };

  const handleSaveQuiz = () => {
    if (!aiPreview || !quizSubject) return;

    toast.success("Quiz saved! 🎉");
    setQuizSubject(null);
    setAiPreview(null);
    setAiTopic("");
    navigate("/quiz", { state: { activeQuizId: aiPreview.id } });
  };

  const handleStartStudy = (s) => navigate(`/pomodoro?subjectId=${s.id}`);

  const getSubjectName = (subjectId) => {
    if (!subjectId) return "General";
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown";
  };

  const tomorrow = addDays(startOfDay(new Date()), 1);

  const buildSubjectPayload = () => ({
    name: newForm.name.trim(),
    credits: parseInt(newForm.credits, 10),
    difficulty: newForm.difficulty,
    examDate: format(newForm.examDate, "yyyy-MM-dd"),
    priority: newForm.priority,
    requiredHoursPerWeek: newForm.requiredHoursPerWeek
      ? parseFloat(newForm.requiredHoursPerWeek)
      : undefined,
  });

  const validateSubjectForm = () => {
    if (!newForm.name.trim()) {
      toast.error("Subject name is required");
      return false;
    }

    if (!newForm.examDate) {
      setExamDateError("Please select an exam date");
      return false;
    }

    if (!isEditMode && newForm.examDate <= new Date()) {
      setExamDateError("Please select a future date");
      return false;
    }

    const credits = parseInt(newForm.credits, 10);
    if (!credits || credits <= 0) {
      toast.error("Credits must be greater than 0");
      return false;
    }

    if (newForm.requiredHoursPerWeek) {
      const hours = parseFloat(newForm.requiredHoursPerWeek);
      if (!hours || hours <= 0) {
        toast.error("Study hours per week must be greater than 0");
        return false;
      }
    }

    setExamDateError("");
    return true;
  };

  const handleSubmitSubject = async () => {
    if (!validateSubjectForm()) return;

    setIsSubmitting(true);
    const payload = buildSubjectPayload();

    const result = isEditMode
      ? await updateSubject(editingSubjectId, payload)
      : await addSubject(payload);

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(
        result.message || `Failed to ${isEditMode ? "update" : "add"} subject`,
      );
      return;
    }

    if (isEditMode && selectedSubject?.id === editingSubjectId) {
      setSelectedSubject(result.data);
    }

    closeSubjectForm();
    toast.success(
      isEditMode
        ? "Subject updated successfully! ✅"
        : "Subject added successfully! 📚",
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    const result = await deleteSubject(deleteId);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message || "Failed to delete subject");
      return;
    }

    if (selectedSubject?.id === deleteId) setSelectedSubject(null);
    setDeleteId(null);
    toast.success("Subject deleted");
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;

    setIsSubmitting(true);
    const result = await deleteContentItem(deleteDocId);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message || "Failed to delete document");
      return;
    }

    await fetchContent();
    if (selectedSubject) {
      await fetchContentBySubject(selectedSubject.id);
    }

    setDeleteDocId(null);
    toast.success("Document deleted");
  };

  const resetUploadForm = () => {
    setUploadForm({ title: "", subjectId: "", content: "", url: "" });
    setSelectedFile(null);
    setActiveTab("note");
  };

  const handleUpload = async () => {
    // TEMP DISABLED:
    // AI moderation for Content module is postponed until Phase 5.

    if (!uploadForm.title.trim()) {
      toast.error("Please add a title");
      return;
    }

    const subjectId = normalizeSubjectId(
      uploadForm.subjectId || selectedSubject?.id || null,
    );

    setIsSubmitting(true);
    let result;

    if (activeTab === "note") {
      if (!uploadForm.content.trim()) {
        toast.error("Note content is required");
        setIsSubmitting(false);
        return;
      }
      result = await createContentNote({
        title: uploadForm.title.trim(),
        content: uploadForm.content.trim(),
        subjectId,
      });
    } else if (activeTab === "link") {
      if (!isValidUrl(uploadForm.url)) {
        toast.error("Please enter a valid URL (https://...)");
        setIsSubmitting(false);
        return;
      }
      result = await createContentLink({
        title: uploadForm.title.trim(),
        content: uploadForm.url.trim(),
        subjectId,
      });
    } else {
      const fileCheck = validateUploadFile(selectedFile);
      if (!fileCheck.ok) {
        toast.error(fileCheck.message);
        setSelectedFile(null);
        setIsSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadForm.title.trim());
      if (subjectId) {
        formData.append("subjectId", subjectId);
      }
      result = await uploadContentFile(formData);
    }

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message || "Failed to save content");
      return;
    }

    await fetchContent();
    if (selectedSubject) {
      await fetchContentBySubject(selectedSubject.id);
    }

    setShowUpload(false);
    resetUploadForm();
    toast.success(
      activeTab === "file"
        ? "File uploaded! 📁"
        : activeTab === "note"
          ? "Note created! 📝"
          : "Link added! 🔗",
    );
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setReplacementFile(null);
    setEditForm({
      title: doc.title,
      content: doc.content || doc.fileUrl || "",
      subjectId: doc.subjectId || "",
    });
  };

  const closeEditModal = () => {
    setEditDoc(null);
    setReplacementFile(null);
  };

  const handleEdit = async () => {
    if (!editDoc || !editForm.title.trim()) {
      toast.error("Title required");
      return;
    }

    if (editDoc.type === "link" && !isValidUrl(editForm.content)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (editDoc.type === "note" && !editForm.content.trim()) {
      toast.error("Note content is required");
      return;
    }

    const payload = {
      title: editForm.title.trim(),
      subjectId: normalizeSubjectId(editForm.subjectId),
    };

    if (editDoc.type === "note" || editDoc.type === "link") {
      payload.content = editForm.content.trim();
    }

    if (editDoc.type === "file" && replacementFile) {
      const fileCheck = validateUploadFile(replacementFile);
      if (!fileCheck.ok) {
        toast.error(fileCheck.message);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await updateContentItem(
      editDoc.id,
      payload,
      editDoc.type === "file" ? replacementFile : null,
    );
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message || "Failed to update document");
      return;
    }

    await fetchContent();
    if (selectedSubject) {
      await fetchContentBySubject(selectedSubject.id);
    }

    closeEditModal();
    toast.success("Document updated! ✅");
  };

  const subjectDocs = selectedSubject
    ? content.filter((d) => d.subjectId === selectedSubject.id)
    : [];
  const subjectQuizzes = selectedSubject
    ? quizzes.filter((q) => q.subjectId === selectedSubject.id)
    : [];
  const isEditBusy =
    isSubmitting || (editDoc?.type === "file" && contentUploading);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            My Subjects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your courses and track progress
          </p>
        </div>
        <button
          onClick={openAddSubject}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] transition-transform"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Subject
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectsLoading && subjects.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <BookOpen
              className="h-10 w-10 mx-auto mb-3 opacity-40"
              strokeWidth={1.5}
            />
            <p className="text-sm">
              No subjects yet. Add your first course to get started.
            </p>
          </div>
        ) : (
          subjects.map((subject, i) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer group relative"
              onClick={() => handleSelectSubject(subject)}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${subject.color} / 0.15)` }}
                >
                  <BookOpen
                    className="h-5 w-5"
                    style={{ color: `hsl(${subject.color})` }}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditSubject(subject);
                    }}
                    disabled={isSubmitting}
                    title="Edit subject"
                    aria-label="Edit subject"
                    className="h-7 w-7 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center hover:bg-secondary/80 hover:text-foreground shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(subject.id);
                    }}
                    title="Delete subject"
                    aria-label="Delete subject"
                    className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {subject.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" strokeWidth={1.5} />
                  {subject.credits} credits
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {formatExamDate(subject.examDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${subject.difficulty === "Hard" ? "bg-destructive/10 text-destructive" : subject.difficulty === "Medium" ? "bg-warning/20 text-foreground" : "bg-accent/20 text-accent-foreground"}`}
                >
                  {subject.difficulty}
                </span>
                {subject.requiredHoursPerWeek && (
                  <span className="text-[10px] text-muted-foreground">
                    {subject.requiredHoursPerWeek}h/week
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${subject.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {subject.progress}% complete
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Subject Detail Sheet */}
      <Sheet
        open={!!selectedSubject}
        onOpenChange={(o) => !o && setSelectedSubject(null)}
      >
        <SheetContent className="overflow-auto">
          {selectedSubject && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `hsl(${selectedSubject.color} / 0.15)`,
                    }}
                  >
                    <BookOpen
                      className="h-4 w-4"
                      style={{ color: `hsl(${selectedSubject.color})` }}
                      strokeWidth={1.5}
                    />
                  </div>
                  {selectedSubject.name}
                </SheetTitle>
                <SheetDescription>
                  Subject details and documents
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Credits", value: selectedSubject.credits },
                    { label: "Difficulty", value: selectedSubject.difficulty },
                    {
                      label: "Exam Date",
                      value: formatExamDate(selectedSubject.examDate),
                    },
                    {
                      label: "Progress",
                      value: `${selectedSubject.progress}%`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-secondary/40 rounded-xl p-3"
                    >
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStartStudy(selectedSubject)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:scale-[1.02] transition-transform"
                  >
                    <Play className="h-3.5 w-3.5" strokeWidth={2} /> Start Study
                  </button>

                  <button
                    onClick={() => openQuickQuiz(selectedSubject)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80"
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />{" "}
                    Generate Quiz
                  </button>
                </div>

                <Accordion
                  type="multiple"
                  defaultValue={["documents", "quizzes"]}
                  className="space-y-2"
                >
                  {/* Documents Section */}
                  <AccordionItem value="documents" className="border-none">
                    <AccordionTrigger className="py-3 px-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 hover:no-underline transition-colors data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText
                            className="h-3.5 w-3.5 text-primary"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Documents
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({subjectDocs.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="px-4 pb-4 pt-1 bg-secondary/30 rounded-b-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            Study materials & notes
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadForm({
                                ...uploadForm,
                                subjectId: selectedSubject.id,
                              });
                              setShowUpload(true);
                            }}
                            className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-primary text-primary-foreground text-[11px] font-medium"
                          >
                            <Plus className="h-3 w-3" strokeWidth={2} /> Upload
                          </button>
                        </div>
                        {contentLoading && subjectDocs.length === 0 ? (
                          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading documents...
                          </div>
                        ) : subjectDocs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No documents yet. Upload your first one!
                          </p>
                        ) : (
                          <div className="max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl">
                            <div className="space-y-1.5 pr-2">
                              {subjectDocs.map((doc) => {
                                const Icon = typeIcons[doc.type];
                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-background/60 hover:bg-secondary/30 transition-colors group/doc"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                      <Icon
                                        className="h-4 w-4 text-primary"
                                        strokeWidth={1.5}
                                      />
                                    </div>
                                    <div
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => setViewDoc(doc)}
                                    >
                                      <p
                                        className="text-sm font-medium text-foreground truncate"
                                        title={doc.title}
                                      >
                                        {doc.title}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {doc.type} · {doc.date} ·{" "}
                                        {doc.createdAt}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                      {doc.type === "file" && (
                                        <button
                                          onClick={() => {
                                            setAiPlanContext({
                                              mode: AI_PLAN_MODES.DOCUMENT,
                                              documentId: doc.id,
                                              subjectId: doc.subjectId || selectedSubject?.id || null,
                                            });
                                            setShowAiPlanWizard(true);
                                          }}
                                          className="h-7 w-7 rounded-md hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary"
                                          title="AI Plan"
                                        >
                                          <Sparkles
                                            className="h-3.5 w-3.5"
                                            strokeWidth={1.5}
                                          />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setViewDoc(doc)}
                                        className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                                      >
                                        <Eye
                                          className="h-3.5 w-3.5"
                                          strokeWidth={1.5}
                                        />
                                      </button>
                                      <button
                                        onClick={() => openEdit(doc)}
                                        className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                                      >
                                        <Edit3
                                          className="h-3.5 w-3.5"
                                          strokeWidth={1.5}
                                        />
                                      </button>
                                      <button
                                        onClick={() => setDeleteDocId(doc.id)}
                                        className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2
                                          className="h-3.5 w-3.5"
                                          strokeWidth={1.5}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Quizzes Section */}
                  <AccordionItem value="quizzes" className="border-none">
                    <AccordionTrigger className="py-3 px-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 hover:no-underline transition-colors data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain
                            className="h-3.5 w-3.5 text-primary"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Quizzes
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({subjectQuizzes.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="px-4 pb-4 pt-1 bg-secondary/30 rounded-b-xl">
                        {subjectQuizzes.length === 0 ? (
                          <div className="text-center py-5">
                            <p className="text-sm text-muted-foreground mb-3">
                              No quizzes for this subject yet.
                            </p>
                            <button
                              onClick={() => openQuickQuiz(selectedSubject)}
                              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:scale-[1.02] transition-transform"
                            >
                              <Sparkles
                                className="h-3.5 w-3.5"
                                strokeWidth={2}
                              />{" "}
                              Generate Quiz
                            </button>
                          </div>
                        ) : (
                          <div className="max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl">
                            <div className="space-y-1.5 pr-2">
                              {subjectQuizzes.map((quiz) => (
                                <div
                                  key={quiz.id}
                                  className="flex items-center gap-3 p-2.5 rounded-xl bg-background/60 hover:bg-secondary/30 transition-colors group/quiz"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Brain
                                      className="h-4 w-4 text-primary"
                                      strokeWidth={1.5}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="text-sm font-medium text-foreground truncate"
                                      title={quiz.title}
                                    >
                                      {quiz.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {quiz.questions.length} questions ·{" "}
                                      {new Date(
                                        quiz.createdAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      navigate("/quiz", {
                                        state: { activeQuizId: quiz.id },
                                      })
                                    }
                                    className="h-7 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-medium opacity-0 group-hover/quiz:opacity-100 transition-opacity hover:bg-primary/20 shrink-1"
                                  >
                                    Take Quiz
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* View Doc Detail Modal */}
      <AnimatePresence>
        {viewDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setViewDoc(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-lg z-10 max-h-[80vh] overflow-auto"
            >
              <button
                onClick={() => setViewDoc(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  {(() => {
                    const Icon = typeIcons[viewDoc.type];
                    return (
                      <Icon
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                    );
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    {viewDoc.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {viewDoc.type} · {getSubjectName(viewDoc.subjectId)}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/40 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Created
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {viewDoc.createdAt}
                    </p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {viewDoc.date}
                    </p>
                  </div>
                </div>
                {viewDoc.type === "file" && viewDoc.fileUrl && (
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      File
                    </p>
                    <p className="text-sm text-foreground mb-2">
                      {viewDoc.fileName || "Uploaded file"}
                    </p>
                    <FilePreviewActions item={viewDoc} />
                  </div>
                )}
                {viewDoc.type === "link" && viewDoc.content && (
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      URL
                    </p>
                    <a
                      href={viewDoc.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {viewDoc.content}
                    </a>
                  </div>
                )}
                {viewDoc.type === "note" && viewDoc.content && (
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Content
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {viewDoc.content}
                    </p>
                  </div>
                )}
              </div>

              <AIDocumentSummary
                documentId={viewDoc.id}
                documentTitle={viewDoc.title}
                document={viewDoc}
              />

              <div className="flex gap-2 mt-4 mb-2">
                <button
                  type="button"
                  onClick={() => setQuizTargetDoc(viewDoc)}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 h-10 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Brain className="h-4 w-4" />
                  Tạo Quiz bằng AI
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setViewDoc(null);
                    openEdit(viewDoc);
                  }}
                  className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setViewDoc(null);
                    setDeleteDocId(viewDoc.id);
                  }}
                  className="h-10 px-5 rounded-full bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIQuizGenerator
        open={Boolean(quizTargetDoc)}
        onOpenChange={(open) => {
          if (!open) setQuizTargetDoc(null);
        }}
        documentId={quizTargetDoc?.id}
        documentTitle={quizTargetDoc?.title}
        document={quizTargetDoc}
        subjectId={quizTargetDoc?.subjectId}
        onQuizCreated={handleQuizCreated}
      />

      {/* Edit Doc Modal */}
      <AnimatePresence>
        {editDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeEditModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10"
            >
              <button
                onClick={closeEditModal}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Edit Document
              </h2>
              <div className="space-y-3">
                <input
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                />
                {(editDoc.type === "note" || editDoc.type === "link") && (
                  <textarea
                    placeholder={editDoc.type === "link" ? "URL" : "Content"}
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    rows={5}
                    className="w-full rounded-xl bg-background px-4 py-3 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                )}
                {editDoc.type === "file" && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Current File
                    </p>
                    <p className="text-sm text-foreground bg-secondary/40 rounded-xl px-4 py-2.5 break-all">
                      {editDoc.fileName || "Uploaded file"}
                    </p>
                    <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
                      <Upload className="h-4 w-4" strokeWidth={1.5} />
                      Replace File
                      <input
                        type="file"
                        className="hidden"
                        accept={FILE_INPUT_ACCEPT}
                        onChange={(e) => {
                          handleUploadFileSelection(e.target.files, {
                            setSelectedFile: setReplacementFile,
                            clearInput: () => {
                              e.target.value = "";
                            },
                            toastError: toast.error,
                          });
                        }}
                      />
                    </label>
                    {replacementFile && (
                      <p className="text-xs text-muted-foreground break-all">
                        New file: {replacementFile.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {SUPPORTED_FILES_LABEL}
                    </p>
                  </div>
                )}
                <select
                  value={editForm.subjectId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, subjectId: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                >
                  <option value="">None (Global)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleEdit}
                  disabled={isEditBusy}
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isEditBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Subject Dialog */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeSubjectForm}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10"
            >
              <button
                onClick={closeSubjectForm}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                {isEditMode ? "Edit Subject" : "Add New Subject"}
              </h2>
              <div className="space-y-3">
                <input
                  placeholder="Subject name"
                  value={newForm.name}
                  onChange={(e) =>
                    setNewForm({ ...newForm, name: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newForm.credits}
                    onChange={(e) =>
                      setNewForm({ ...newForm, credits: e.target.value })
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((c) => (
                      <option key={c} value={c}>
                        {c} credits
                      </option>
                    ))}
                  </select>
                  <select
                    value={newForm.difficulty}
                    onChange={(e) =>
                      setNewForm({ ...newForm, difficulty: e.target.value })
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 rounded-xl justify-start text-left font-normal",
                          !newForm.examDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newForm.examDate ? (
                          format(newForm.examDate, "PPP")
                        ) : (
                          <span>Select exam date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={newForm.examDate}
                        onSelect={(date) => {
                          setNewForm({ ...newForm, examDate: date });
                          setExamDateError("");
                        }}
                        disabled={(date) => !isEditMode && date < tomorrow}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {examDateError && (
                    <p className="text-xs text-destructive mt-1">
                      {examDateError}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Study hours/week"
                    value={newForm.requiredHoursPerWeek}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        requiredHoursPerWeek: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                    min="0"
                    step="0.5"
                  />
                  <select
                    value={newForm.priority}
                    onChange={(e) =>
                      setNewForm({ ...newForm, priority: e.target.value })
                    }
                    className="h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                </div>
                <button
                  onClick={handleSubmitSubject}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEditMode ? "Saving..." : "Adding..."}
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Add Subject"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Dialog */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => {
                setShowUpload(false);
                resetUploadForm();
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10"
            >
              <button
                onClick={() => {
                  setShowUpload(false);
                  resetUploadForm();
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Add Study Material
              </h2>
              <div className="flex bg-secondary/50 rounded-xl p-1 mb-4">
                {[
                  { key: "file", label: "Upload File", icon: Upload },
                  { key: "note", label: "Write Note", icon: PenLine },
                  { key: "link", label: "Add Link", icon: Link2 },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />{" "}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Title"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <AnimatePresence mode="wait">
                  {activeTab === "file" && (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label
                        className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-background/50 cursor-pointer transition-colors"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleUploadFileSelection(e.dataTransfer.files, {
                            setSelectedFile,
                            toastError: toast.error,
                          });
                        }}
                      >
                        <Upload
                          className="h-6 w-6 text-muted-foreground mb-2"
                          strokeWidth={1.5}
                        />
                        <span className="text-xs text-muted-foreground text-center px-4">
                          {selectedFile
                            ? selectedFile.name
                            : "Click to upload or drag & drop"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept={FILE_INPUT_ACCEPT}
                          onChange={(e) => {
                            handleUploadFileSelection(e.target.files, {
                              setSelectedFile,
                              clearInput: () => {
                                e.target.value = "";
                              },
                              toastError: toast.error,
                            });
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                        {SUPPORTED_FILES_LABEL}
                      </p>
                    </motion.div>
                  )}
                  {activeTab === "note" && (
                    <motion.div
                      key="note"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <textarea
                        placeholder="Write your note here..."
                        value={uploadForm.content}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            content: e.target.value,
                          })
                        }
                        rows={5}
                        className="w-full rounded-xl bg-background px-4 py-3 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                      />
                    </motion.div>
                  )}
                  {activeTab === "link" && (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type="url"
                        placeholder="https://example.com/resource"
                        value={uploadForm.url}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, url: e.target.value })
                        }
                        className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <select
                  value={uploadForm.subjectId}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, subjectId: e.target.value })
                  }
                  className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                >
                  <option value="">None (Global)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleUpload}
                  disabled={isSubmitting || contentUploading}
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting || contentUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {activeTab === "file" ? "Uploading..." : "Saving..."}
                    </>
                  ) : activeTab === "file" ? (
                    "Upload File"
                  ) : activeTab === "note" ? (
                    "Save Note"
                  ) : (
                    "Add Link"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Subject Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subject permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Doc Confirmation */}
      <AlertDialog
        open={!!deleteDocId}
        onOpenChange={(o) => !o && setDeleteDocId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoc}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick AI Quiz Modal */}
      <AnimatePresence>
        {quizSubject && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => {
                setQuizSubject(null);
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
                  setQuizSubject(null);
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
                    Quick Quiz · {quizSubject.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    AI-generated quiz linked to this subject
                  </p>
                </div>
              </div>

              {!aiPreview ? (
                <div className="space-y-3">
                  <input
                    placeholder="Topic"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
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
                    onClick={() => handleGenerateQuiz(true)}
                    disabled={aiLoading}
                    className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Generating...
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
                      onClick={() => handleGenerateQuiz(true)}
                      disabled={aiLoading}
                      className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleSaveQuiz}
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

      <AiPlanWizard
        open={showAiPlanWizard}
        onClose={() => {
          setShowAiPlanWizard(false);
          setAiPlanContext(null);
        }}
        initialContext={aiPlanContext}
        subjects={subjects}
        onSubjectsChange={fetchSubjects}
        onApplied={() => {
          fetchSubjects();
          fetchContent();
        }}
      />
    </div>
  );
}