import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;
const MAX_TEXTAREA_PX = 160;

export default function AssistantComposer({ busy, disabled, placeholder, scopeButton, onSend }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const canSend = !busy && !disabled && text.trim().length > 0;

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  };

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    requestAnimationFrame(resize);
  };

  return (
    <div className="rounded-[24px] border border-border bg-background shadow-soft focus-within:ring-2 focus-within:ring-primary/20">
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          setText(event.target.value);
          resize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        className="block w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="min-w-0">{scopeButton}</div>
        <div className="flex items-center gap-2">
          {text.length > MAX_LENGTH * 0.8 && (
            <span className="text-[11px] text-muted-foreground">
              {text.length}/{MAX_LENGTH}
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Ask"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
