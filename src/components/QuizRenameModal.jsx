import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export default function QuizRenameModal({
  open,
  quiz,
  onOpenChange,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && quiz) {
      setTitle(quiz.title ?? "");
    }
  }, [open, quiz]);

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed || !quiz?.id || saving) return;

    setSaving(true);
    const result = await onSave?.(quiz.id, trimmed);
    setSaving(false);

    if (result?.ok) {
      onOpenChange(false);
    }
  };

  if (!open || !quiz) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card rounded-2xl p-6 shadow-soft-lg w-full max-w-md z-10">
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-display font-semibold text-foreground mb-1">
          Đổi tên quiz
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Cập nhật tên hiển thị của quiz này.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="quiz-rename-title"
              className="text-sm font-medium text-foreground"
            >
              Tên quiz
            </label>
            <input
              id="quiz-rename-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={saving}
              className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
              placeholder="Nhập tên quiz"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 h-10 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
