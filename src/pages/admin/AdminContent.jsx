import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  useAdminContent,
  useAdminDeleteContent,
  useAdminDeleteSubject,
  useAdminSubjects,
} from "@/hooks/queries/adminContent";
import { formatAdminUserDate } from "@/lib/adminUserUtils";
import { motion } from "framer-motion";
import { BookOpen, FileText, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { Skeleton } from "@/components/skeleton";

const typeIcon = {
  note: FileText,
  file: BookOpen,
  link: Link2,
};

const SKELETON_ROWS = 5;

function TableSkeleton({ columns }) {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-5 w-full rounded-md" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow({ colSpan, message }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-10 text-center text-sm text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

export default function AdminContent() {
  const location = useLocation();
  const {
    subjects,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useAdminSubjects();
  const {
    content,
    isLoading: contentLoading,
    error: contentError,
  } = useAdminContent();
  const deleteSubjectMutation = useAdminDeleteSubject();
  const deleteContentMutation = useAdminDeleteContent();

  const deletingSubjectId = deleteSubjectMutation.isPending
    ? deleteSubjectMutation.variables
    : null;
  const deletingContentId = deleteContentMutation.isPending
    ? deleteContentMutation.variables
    : null;

  useEffect(() => {
    const subjectId = location.state?.highlightSubjectId;
    if (!subjectId || subjectsLoading) return;

    const element = document.getElementById(`admin-subject-row-${subjectId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, subjectsLoading, subjects.length]);

  useEffect(() => {
    const quizTitle = location.state?.highlightQuizTitle;
    if (!quizTitle) return;

    toast.info(`Quiz found: ${quizTitle}. Open Content Management to review related documents.`);
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const handleDeleteSubject = async (id) => {
    try {
      await deleteSubjectMutation.mutateAsync(id);
      toast.success("Subject deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete subject");
    }
  };

  const handleDeleteContent = async (id) => {
    try {
      await deleteContentMutation.mutateAsync(id);
      toast.success("Document deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Content Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and manage all system content
        </p>
      </div>

      {/* Subjects */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">
            All Subjects ({subjects.length})
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {subjectsLoading ? (
              <TableSkeleton columns={5} />
            ) : subjectsError ? (
              <EmptyRow colSpan={5} message={subjectsError} />
            ) : subjects.length === 0 ? (
              <EmptyRow colSpan={5} message="No subjects found." />
            ) : (
              subjects.map((s) => (
                <TableRow key={s.id} id={`admin-subject-row-${s.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {s.color ? (
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ background: `hsl(${s.color})` }}
                        />
                      ) : null}
                      <span className="font-medium text-foreground">
                        {s.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {s.credits ?? "—"}
                  </TableCell>

                  <TableCell>
                    {s.difficulty ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.difficulty === "Hard"
                            ? "bg-destructive/10 text-destructive"
                            : s.difficulty === "Medium"
                              ? "bg-warning/20 text-foreground"
                              : "bg-accent/20 text-accent-foreground"
                        }`}
                      >
                        {s.difficulty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatAdminUserDate(s.examDate)}
                  </TableCell>

                  <TableCell className="text-right">
                    <DeleteButton
                      onConfirm={() => handleDeleteSubject(s.id)}
                      label={s.name}
                      isDeleting={deletingSubjectId === s.id}
                      disabled={deleteSubjectMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Documents */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">
            All Documents ({content.length})
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {contentLoading ? (
              <TableSkeleton columns={5} />
            ) : contentError ? (
              <EmptyRow colSpan={5} message={contentError} />
            ) : content.length === 0 ? (
              <EmptyRow colSpan={5} message="No documents found." />
            ) : (
              content.map((d) => {
                const Icon = typeIcon[d.type] || FileText;

                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 text-muted-foreground"
                          strokeWidth={1.5}
                        />
                        <span className="font-medium text-foreground">
                          {d.title}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground capitalize">
                      {d.type}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-primary">
                            {d.ownerName?.charAt(0) || "?"}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-foreground">
                          {d.ownerName || "Unknown"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs">
                      {formatAdminUserDate(d.createdAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <DeleteButton
                        onConfirm={() => handleDeleteContent(d.id)}
                        label={d.title}
                        isDeleting={deletingContentId === d.id}
                        disabled={deleteContentMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}

function DeleteButton({ onConfirm, label, isDeleting, disabled }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{label}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-destructive text-destructive-foreground"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
