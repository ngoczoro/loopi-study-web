import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2, MessageCircle } from "lucide-react";
import { formatDayLabel, isSameDay } from "./chatFormat";
import MessageItem from "./MessageItem";

const CLUSTER_GAP_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;
const LOAD_OLDER_THRESHOLD_PX = 80;

function startsCluster(previous, message) {
  if (!previous) return true;
  if (previous.sender?.userId !== message.sender?.userId) return true;
  if (!isSameDay(previous.createdAt, message.createdAt)) return true;
  return new Date(message.createdAt) - new Date(previous.createdAt) > CLUSTER_GAP_MS;
}

export default function MessageList({
  messages,
  myUserId,
  isLoading,
  error,
  onRetryLoad,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  onOpenImage,
  onRetrySend,
  onDiscard,
}) {
  const scrollRef = useRef(null);
  const nearBottomRef = useRef(true);
  const olderAnchorRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const firstMessageIdRef = useRef(null);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = (behavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const firstId = messages[0]?.id ?? null;
    const prependedOlder =
      olderAnchorRef.current !== null && firstId !== firstMessageIdRef.current;
    firstMessageIdRef.current = firstId;
    if (prependedOlder) {
      el.scrollTop = el.scrollHeight - olderAnchorRef.current;
      olderAnchorRef.current = null;
      return;
    }

    const last = messages[messages.length - 1];
    const lastId = last?.id ?? null;
    if (lastId === lastMessageIdRef.current) return;
    const isFirstRender = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;

    const mine = last?.sender?.userId === myUserId;
    if (isFirstRender || mine || nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, myUserId]);

  useEffect(() => {
    if (!isLoadingOlder) olderAnchorRef.current = null;
  }, [isLoadingOlder]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_PX;
    setShowJump(!nearBottomRef.current);

    if (el.scrollTop < LOAD_OLDER_THRESHOLD_PX && hasOlder && !isLoadingOlder) {
      olderAnchorRef.current = el.scrollHeight - el.scrollTop;
      onLoadOlder();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={onRetryLoad}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-3"
      >
        {hasOlder && (
          <div className="flex justify-center py-2">
            {isLoadingOlder ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <button
                type="button"
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) olderAnchorRef.current = el.scrollHeight - el.scrollTop;
                  onLoadOlder();
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Load older messages
              </button>
            )}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground">Say hi to your group 👋</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const newDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="flex justify-center my-4">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </div>
                )}
                <MessageItem
                  message={message}
                  isMine={message.sender?.userId === myUserId}
                  isFirstInCluster={startsCluster(previous, message)}
                  isLastInCluster={!next || startsCluster(message, next)}
                  onOpenImage={onOpenImage}
                  onRetry={onRetrySend}
                  onDiscard={onDiscard}
                />
              </Fragment>
            );
          })
        )}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          aria-label="Scroll to latest messages"
          className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-card border border-border shadow-soft inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
