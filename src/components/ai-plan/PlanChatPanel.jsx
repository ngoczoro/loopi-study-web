import { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  "Reduce hours for the hardest subject",
  "No study after 8pm",
  "Block Saturday this week",
  "Make Math a higher priority",
];

/**
 * @param {{
 *   messages: Array<{ role: "user" | "assistant", content: string }>,
 *   loading?: boolean,
 *   onSend: (message: string) => void | Promise<void>,
 *   suggestions?: string[],
 * }} props
 */
export default function PlanChatPanel({
  messages,
  loading = false,
  onSend,
  suggestions = DEFAULT_SUGGESTIONS,
}) {
  const [input, setInput] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await onSend(text);
  };

  const handleSuggestion = (text) => {
    if (loading) return;
    onSend(text);
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 h-full min-h-[320px] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Plan chat</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] pr-1">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Ask to adjust hours, priorities, or blocked days. The timeline updates
            after each message.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl px-3 py-2 text-xs max-w-[95%] ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-card border border-border text-foreground"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating plan…
          </div>
        )}
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((text) => (
            <button
              key={text}
              type="button"
              disabled={loading}
              onClick={() => handleSuggestion(text)}
              className="rounded-full bg-card border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading}
          placeholder="e.g. Study max 2h/day for Physics"
          className="flex-1 h-10 rounded-full bg-card border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
