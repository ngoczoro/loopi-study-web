import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Upload,
  Link2,
  Plus,
  Search,
  X,
  PenLine,
  Trash2,
  Eye,
  Edit3,
  Sparkles,
  Loader2,
  Brain,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import {
  suggestMaterials,
} from "@/lib/ai-utils";
import AIDocumentSummary from "@/components/ai/AIDocumentSummary";
import AIQuizGenerator from "@/components/ai/AIQuizGenerator";
import {
  isValidUrl,
  normalizeSubjectId,
  validateUploadFile,
  handleUploadFileSelection,
  FILE_INPUT_ACCEPT,
  SUPPORTED_FILES_LABEL,
} from "@/lib/content-utils";
import { FilePreviewActions } from "@/components/FilePreviewActions";
import { useLocation } from "react-router-dom";
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

const typeIcons = { note: FileText, file: Upload, link: Link2 };

const defaultForm = { title: "", subjectId: "", content: "", url: "" };

export default function Notes() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  const {
    content,
    subjects,
    contentLoading,
    contentUploading,
    contentError,
    fetchContent,
    fetchSubjects,
    createContentNote,
    createContentLink,
    uploadContentFile,
    updateContentItem,
    deleteContentItem,
    addQuiz,
  } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState("note");
  const [form, setForm] = useState(defaultForm);

  const [viewDoc, setViewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    subjectId: "",
  });

  const [deleteId, setDeleteId] = useState(null);
  const [quizTargetDoc, setQuizTargetDoc] = useState(null);

  const [aiLoading, setAiLoading] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestSubjectId, setSuggestSubjectId] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetchSubjects();
    fetchContent();
  }, [accessToken, fetchSubjects, fetchContent]);

  useEffect(() => {
    const contentId = location.state?.contentId;
    if (!contentId || content.length === 0) return;

    const doc = content.find((item) => item.id === contentId);
    if (doc) {
      setViewDoc(doc);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, content]);

  useEffect(() => {
    if (contentError) {
      toast.error(contentError);
    }
  }, [contentError]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return content.filter((item) => {
      const matchesSearch =
        !query || item.title?.toLowerCase().includes(query);
      const matchesSubject =
        !subjectFilter || item.subjectId === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [content, search, subjectFilter]);

  const getSubjectName = (subjectId) => {
    if (!subjectId) return "General";
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown";
  };

  const resetAddForm = () => {
    setForm(defaultForm);
    setSelectedFile(null);
    setActiveTab("note");
  };

  const closeAddModal = () => {
    setShowAdd(false);
    resetAddForm();
  };

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error("Please add a title");
      return;
    }

    const subjectId = normalizeSubjectId(form.subjectId);

    setIsSubmitting(true);
    let result;

    if (activeTab === "note") {
      if (!form.content.trim()) {
        toast.error("Note content is required");
        setIsSubmitting(false);
        return;
      }
      result = await createContentNote({
        title: form.title.trim(),
        content: form.content.trim(),
        subjectId,
      });
    } else if (activeTab === "link") {
      if (!isValidUrl(form.url)) {
        toast.error("Please enter a valid URL (https://...)");
        setIsSubmitting(false);
        return;
      }
      result = await createContentLink({
        title: form.title.trim(),
        content: form.url.trim(),
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
      formData.append("title", form.title.trim());
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

    closeAddModal();
    toast.success(
      activeTab === "file"
        ? "File uploaded successfully"
        : activeTab === "note"
          ? "Note created successfully"
          : "Link added successfully",
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    const result = await deleteContentItem(deleteId);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message || "Failed to delete content");
      return;
    }

    setDeleteId(null);
    toast.success("Content deleted successfully");
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
      toast.error("Title is required");
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
      toast.error(result.message || "Failed to update content");
      return;
    }

    closeEditModal();
    toast.success("Content updated successfully");
  };

  const handleQuizCreated = (quiz) => {
    addQuiz(quiz);
    setViewDoc(null);
  };

  const handleSuggestMaterials = () => {
    const subjectName =
      subjects.find((s) => s.id === suggestSubjectId)?.name || "General Study";

    setAiLoading("suggest");

    setTimeout(() => {
      setSuggestions(suggestMaterials(subjectName));
      setAiLoading(null);
    }, 800);
  };

  const handleAddSuggestion = async (sug) => {
    const subjectId = normalizeSubjectId(suggestSubjectId);

    const result =
      sug.type === "link"
        ? await createContentLink({
            title: sug.title,
            content: sug.content,
            subjectId,
          })
        : await createContentNote({
            title: sug.title,
            content: sug.content,
            subjectId,
          });

    if (result.ok) {
      toast.success("Suggestion added");
    } else {
      toast.error(result.message || "Failed to add suggestion");
    }
  };

  const tabs = [
    { key: "file", label: "Upload File", icon: Upload },
    { key: "note", label: "Write Note", icon: PenLine },
    { key: "link", label: "Add Link", icon: Link2 },
  ];

  const isBusy = isSubmitting || contentUploading;
  const isEditBusy = isSubmitting || (editDoc?.type === "file" && contentUploading);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Documents & Notes
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep all your study materials organized
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggestions(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.5} /> AI Suggest
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Add Note
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes & documents..."
            className="w-full h-10 rounded-xl bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="h-10 rounded-xl bg-card px-3 text-sm text-foreground shadow-soft outline-none focus:ring-2 focus:ring-primary/20 sm:min-w-[180px]"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {contentLoading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading content...
          </div>
        ) : (
          filtered.map((note) => {
            const Icon = typeIcons[note.type] || FileText;
            return (
              <div
                key={note.id}
                className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4 hover:shadow-soft-md transition-shadow group"
              >
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setViewDoc(note)}
                >
                  <p
                    className="text-sm font-medium text-foreground truncate"
                    title={note.title}
                  >
                    {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getSubjectName(note.subjectId)} · {note.date} ·{" "}
                    {note.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewDoc(note)}
                    className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => openEdit(note)}
                    className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setDeleteId(note.id)}
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {!contentLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No documents found.
          </p>
        )}
      </div>

      <AnimatePresence>
        {viewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                    const Icon = typeIcons[viewDoc.type] || FileText;
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

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                  AI Actions
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setQuizTargetDoc(viewDoc)}
                    disabled={!!aiLoading}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Tạo Quiz bằng AI
                  </button>
                </div>
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
                    setDeleteId(viewDoc.id);
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

      <AnimatePresence>
        {editDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={closeAddModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10"
            >
              <button
                onClick={closeAddModal}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Add Study Material
              </h2>
              <div className="flex bg-secondary/50 rounded-xl p-1 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />{" "}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                        value={form.content}
                        onChange={(e) =>
                          setForm({ ...form, content: e.target.value })
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
                        value={form.url}
                        onChange={(e) =>
                          setForm({ ...form, url: e.target.value })
                        }
                        className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <select
                  value={form.subjectId}
                  onChange={(e) =>
                    setForm({ ...form, subjectId: e.target.value })
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
                  onClick={handleAdd}
                  disabled={isBusy}
                  className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {activeTab === "file" ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      {activeTab === "file"
                        ? "Upload File"
                        : activeTab === "note"
                          ? "Save Note"
                          : "Add Link"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => {
                setShowSuggestions(false);
                setSuggestions([]);
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
                  setShowSuggestions(false);
                  setSuggestions([]);
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
                    AI Suggest Materials
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Get AI-recommended study materials
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <select
                  value={suggestSubjectId}
                  onChange={(e) => setSuggestSubjectId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-background px-3 text-sm text-foreground border border-border outline-none"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {suggestions.length === 0 ? (
                  <button
                    onClick={handleSuggestMaterials}
                    disabled={!suggestSubjectId || aiLoading === "suggest"}
                    className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading === "suggest" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Get Suggestions
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map((sug, i) => (
                      <div
                        key={i}
                        className="bg-secondary/40 rounded-xl p-3 flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            {sug.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {sug.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddSuggestion(sug)}
                          className="shrink-0 h-7 px-3 rounded-full bg-primary text-primary-foreground text-[11px] font-medium hover:scale-[1.02] transition-transform"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
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
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
