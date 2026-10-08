import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b-8 border-secondary/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/40"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </section>
  );
}

export function InfoRow({ icon, label, hint, tone = "default", onClick, trailing }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary/40 transition-colors",
        tone === "danger" ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", tone === "danger" ? "" : "text-muted-foreground")} />
      <span className="flex-1 min-w-0">
        <span className="block truncate">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground truncate">{hint}</span>}
      </span>
      {trailing}
    </button>
  );
}

export function ViewAllButton({ onClick }) {
  return (
    <div className="px-4 pt-2">
      <button
        type="button"
        onClick={onClick}
        className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground hover:bg-secondary/70 transition-colors"
      >
        View all
      </button>
    </div>
  );
}
