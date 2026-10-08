import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";

/**
 * Confirm button is a plain button (not AlertDialogAction) so the dialog
 * stays open while the async action runs and can show its error.
 */
export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  error = null,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 px-5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
