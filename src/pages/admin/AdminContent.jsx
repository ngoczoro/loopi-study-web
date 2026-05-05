import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Trash2, FileText, BookOpen, Link2 } from "lucide-react";
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

const typeIcon = {
  note: FileText,
  file: BookOpen,
  link: Link2,
};

export default function AdminContent() {
  const { subjects, documents, deleteDocument, deleteSubject } = useAppStore();

  const handleDeleteDoc = (id) => {
    deleteDocument(id);
    toast.success("Document deleted");
  };

  const handleDeleteSubject = (id) => {
    deleteSubject(id);
    toast.success("Subject deleted");
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
            {subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: `hsl(${s.color})` }}
                    />
                    <span className="font-medium text-foreground">
                      {s.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {s.credits}
                </TableCell>

                <TableCell>
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
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {s.examDate}
                </TableCell>

                <TableCell className="text-right">
                  <DeleteButton
                    onConfirm={() => handleDeleteSubject(s.id)}
                    label={s.name}
                  />
                </TableCell>
              </TableRow>
            ))}
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
            All Documents ({documents.length})
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
            {documents.map((d) => {
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
                    {d.createdAt || d.date}
                  </TableCell>

                  <TableCell className="text-right">
                    <DeleteButton
                      onConfirm={() => handleDeleteDoc(d.id)}
                      label={d.title}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}

function DeleteButton({ onConfirm, label }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
          <Trash2 className="h-3 w-3" />
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
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full bg-destructive text-destructive-foreground"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
