import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Library,
  Loader2,
  PanelLeft,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAskAssistant,
  useAssistantConversations,
  useAssistantMessages,
  useAssistantSources,
  useCreateAssistantConversation,
  useUpdateAssistantConversation,
} from "@/hooks/queries/assistant";
import ConversationSidebar from "@/components/assistant/ConversationSidebar";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import AssistantMessage, {
  ThinkingIndicator,
  UserQuestion,
} from "@/components/assistant/AssistantMessage";
import ScopePickerModal from "@/components/assistant/ScopePickerModal";
import { ALL_SCOPE, describeScope } from "@/components/assistant/assistantScope";

// Fills the area under the 3.5rem TopBar, cancelling Layout's <main> padding.
const PAGE_FRAME_CLASS =
  "-m-4 md:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] flex overflow-hidden relative";

const SUGGESTIONS = [
  "Summarize the key ideas",
  "Explain the most important concepts",
  "What should I review before the exam?",
];

function scopeFromParams(searchParams) {
  const documentId = searchParams.get("documentId");
  if (documentId) return { type: "documents", documentIds: [documentId] };
  const subjectId = searchParams.get("subjectId");
  if (subjectId) return { type: "subject", subjectId };
  return ALL_SCOPE;
}

function ScopeButton({ scope, sources, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <Library className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{describeScope(scope, sources)}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

export default function Assistant() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sources } = useAssistantSources();
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useAssistantConversations();
  const { messages, isLoading: messagesLoading, error: messagesError } =
    useAssistantMessages(conversationId);
  const createConversation = useCreateAssistantConversation();
  const updateConversation = useUpdateAssistantConversation();
  const ask = useAskAssistant();

  const [draftScope, setDraftScope] = useState(() => scopeFromParams(searchParams));
  const [pending, setPending] = useState(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef(null);

  const conversation = conversations.find((item) => item.id === conversationId) ?? null;
  const scope = conversationId ? (conversation?.scope ?? ALL_SCOPE) : draftScope;
  const busy = pending?.status === "sending";
  const visiblePending = pending && pending.conversationId === (conversationId ?? null) ? pending : null;
  const isNewChat = !conversationId && !visiblePending;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, visiblePending?.status]);

  const send = async (content) => {
    let targetId = conversationId ?? null;
    setPending({ conversationId: targetId, content, status: "sending", error: null });
    try {
      if (!targetId) {
        const created = await createConversation.mutateAsync({ scope: draftScope });
        targetId = created.id;
        setPending({ conversationId: targetId, content, status: "sending", error: null });
        navigate(`/assistant/${targetId}`);
      }
      await ask.mutateAsync({ conversationId: targetId, content });
      setPending(null);
    } catch (error) {
      setPending({ conversationId: targetId, content, status: "failed", error: error.message });
    }
  };

  const applyScope = async (next) => {
    if (!conversationId) {
      setDraftScope(next);
      return;
    }
    try {
      await updateConversation.mutateAsync({ conversationId, payload: { scope: next } });
      toast.success("Scope updated for the next questions");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startNewChat = () => {
    setPending(null);
    setDraftScope(ALL_SCOPE);
    setSidebarOpen(false);
    navigate("/assistant");
  };

  const scopeButton = (
    <ScopeButton scope={scope} sources={sources} onClick={() => setScopeOpen(true)} />
  );

  return (
    <div className={PAGE_FRAME_CLASS}>
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-20 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-30 w-72 shrink-0 border-r border-border shadow-soft-lg transition-transform lg:static lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          isLoading={conversationsLoading}
          error={conversationsError}
          activeId={conversationId}
          onNewChat={startNewChat}
          onNavigate={() => setSidebarOpen(false)}
          onDeleted={(id) => {
            if (id === conversationId) navigate("/assistant", { replace: true });
          }}
        />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Show chats"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {conversation?.title ?? "AI Study Assistant"}
          </h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isNewChat ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </span>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Ask anything about your documents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Answers come only from your notes and files, with the exact sources quoted.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {messagesLoading && conversationId ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messagesError ? (
                <p className="text-center text-sm text-destructive">{messagesError}</p>
              ) : (
                messages.map((message) => <AssistantMessage key={message.id} message={message} />)
              )}

              {visiblePending?.status === "sending" && (
                <>
                  <UserQuestion content={visiblePending.content} muted />
                  <ThinkingIndicator />
                </>
              )}

              {visiblePending?.status === "failed" && (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-destructive">No answer received</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {visiblePending.error} · “{visiblePending.content}”
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => send(visiblePending.content)}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-2">
          <AssistantComposer
            busy={busy}
            placeholder="Ask about your notes and files…"
            scopeButton={scopeButton}
            onSend={send}
          />
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            The assistant only reads documents in the selected scope. Check the sources before relying on an answer.
          </p>
        </div>
      </section>

      <ScopePickerModal
        open={scopeOpen}
        scope={scope}
        sources={sources}
        onOpenChange={setScopeOpen}
        onApply={applyScope}
      />
    </div>
  );
}
