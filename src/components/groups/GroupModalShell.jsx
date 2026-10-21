import { useEffect } from "react";
import { X } from "lucide-react";

export default function GroupModalShell({
  open,
  title,
  description,
  busy = false,
  onClose,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-modal-title"
        className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto z-10"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="group-modal-title"
          className="text-lg font-display font-semibold text-foreground mb-1"
        >
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground mb-4">{description}</p>
        )}

        {children}
      </div>
    </div>
  );
}

export const groupInputClassName =
  "w-full rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50";

export const groupPrimaryButtonClassName =
  "flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2";

export const groupSecondaryButtonClassName =
  "flex-1 h-10 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50";
