import { motion } from "framer-motion";

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   description: string,
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ApplyConfirmDialog({
  open,
  title,
  description,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 px-4 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-10 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {loading ? "Applying…" : "Apply plan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
