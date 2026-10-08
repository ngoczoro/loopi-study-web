import { useImperativeHandle, useRef, useState } from "react";
import { Image as ImageIcon, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { cn } from "@/lib/utils";
import { formatFileSize } from "./chatFormat";
import { FileBadge } from "./MessageAttachments";

const MAX_CONTENT_LENGTH = 2000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXTAREA_PX = 140;

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
  "🤔", "😅", "😭", "😡", "😴", "🥳", "🤩", "😇",
  "👍", "👎", "👏", "🙏", "💪", "👌", "✌️", "🤝",
  "❤️", "🔥", "🎉", "✅", "❌", "⭐", "📚", "📝",
  "💡", "⏰", "📌", "🚀", "☕", "🍀", "💯", "👀",
];

const toolButtonClassName =
  "h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50";

let pendingIdCounter = 0;

function toPendingFile(file) {
  return {
    id: `pending-${++pendingIdCounter}`,
    file,
    previewUrl: file.type?.startsWith("image/") ? URL.createObjectURL(file) : null,
  };
}

export default function MessageComposer({ ref, groupName, disabled, onSend }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList ?? []);
    if (incoming.length === 0) return;
    const tooLarge = incoming.filter((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge.length) {
      toast.error(`${tooLarge.map((f) => f.name).join(", ")} is larger than 5 MB`);
    }
    setPending((current) => {
      const room = MAX_FILES - current.length;
      const accepted = incoming.filter((file) => file.size <= MAX_FILE_BYTES);
      if (accepted.length > room) {
        toast.error(`You can attach at most ${MAX_FILES} files per message`);
      }
      return [...current, ...accepted.slice(0, Math.max(0, room)).map(toPendingFile)];
    });
    textareaRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({ addFiles }));

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  };

  const insertText = (value) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${value}${text.slice(end)}`.slice(0, MAX_CONTENT_LENGTH);
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + value.length;
      el.setSelectionRange(caret, caret);
      resizeTextarea();
    });
  };

  const removePending = (id) =>
    setPending((current) => current.filter((item) => item.id !== id));

  const canSend = !disabled && (text.trim().length > 0 || pending.length > 0);

  const submit = () => {
    if (!canSend) return;
    onSend({ content: text.trim(), files: pending.map((item) => item.file) });
    setText("");
    setPending([]);
    requestAnimationFrame(resizeTextarea);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const handlePaste = (event) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length) {
      event.preventDefault();
      addFiles(files);
    }
  };

  return (
    <div className="border-t border-border bg-card shrink-0">
      <div className="flex items-center gap-0.5 px-3 pt-2">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Insert emoji"
              title="Emoji"
              className={toolButtonClassName}
            >
              <Smile className="h-[18px] w-[18px]" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-72 p-2 rounded-xl">
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    insertText(emoji);
                    setEmojiOpen(false);
                  }}
                  className="h-8 w-8 rounded-md text-lg hover:bg-secondary"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          disabled={disabled}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Send images"
          title="Images"
          className={toolButtonClassName}
        >
          <ImageIcon className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          title="Files"
          className={toolButtonClassName}
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2">
          {pending.map((item) => (
            <div
              key={item.id}
              className="relative shrink-0 rounded-xl border border-border bg-background"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="h-16 w-44 flex items-center gap-2 px-2">
                  <FileBadge name={item.file.name} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background inline-flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 mx-3 my-2 px-3 py-1 rounded-[24px] border border-border bg-background shadow-soft">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          disabled={disabled}
          maxLength={MAX_CONTENT_LENGTH}
          onChange={(e) => {
            setText(e.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`Message ${groupName}`}
          className="flex-1 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors shrink-0",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground",
          )}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
