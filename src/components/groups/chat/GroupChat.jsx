import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { getAuthUser } from "@/lib/authSession";
import {
  createOutgoingMessage,
  useGroupMessages,
  useMarkGroupRead,
  useSendGroupMessage,
} from "@/hooks/queries/chat";
import ImageLightbox from "./ImageLightbox";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";

export default function GroupChat({ group }) {
  const myUserId = getAuthUser()?.id ?? null;
  const {
    messages,
    isLoading,
    error,
    refetch,
    hasOlder,
    loadOlder,
    isLoadingOlder,
  } = useGroupMessages(group.id);
  const sendMessage = useSendGroupMessage(group.id);
  const markRead = useMarkGroupRead();
  const composerRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [outbox, setOutbox] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [dragging, setDragging] = useState(false);

  const { mutate: markGroupRead } = markRead;
  const unreadCount = group.unreadCount ?? 0;
  const lastIncomingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].sender?.userId !== myUserId) return messages[i].id;
    }
    return null;
  }, [messages, myUserId]);
  const markedIncomingIdRef = useRef(undefined);

  useEffect(() => {
    if (!lastIncomingId || markedIncomingIdRef.current === lastIncomingId) return;
    const isFirstCheck = markedIncomingIdRef.current === undefined;
    markedIncomingIdRef.current = lastIncomingId;
    if (isFirstCheck && unreadCount === 0) return;
    markGroupRead(group.id);
  }, [group.id, lastIncomingId, unreadCount, markGroupRead]);

  const deliver = async (outgoing) => {
    setOutbox((current) => [
      ...current.filter((item) => item.id !== outgoing.id),
      { ...outgoing, status: "sending", error: null },
    ]);
    try {
      await sendMessage.mutateAsync({ content: outgoing.content, files: outgoing.files });
      setOutbox((current) => current.filter((item) => item.id !== outgoing.id));
    } catch (sendError) {
      setOutbox((current) =>
        current.map((item) =>
          item.id === outgoing.id
            ? { ...item, status: "failed", error: sendError.message }
            : item,
        ),
      );
    }
  };

  const handleSend = ({ content, files }) =>
    deliver(createOutgoingMessage(group.id, { content, files }));

  const discard = (outgoing) =>
    setOutbox((current) => current.filter((item) => item.id !== outgoing.id));

  const visibleMessages = useMemo(() => [...messages, ...outbox], [messages, outbox]);

  const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

  return (
    <div
      className="relative flex-1 min-h-0 flex flex-col bg-background"
      onDragEnter={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (hasFiles(event)) event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (!hasFiles(event)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current = 0;
        setDragging(false);
        composerRef.current?.addFiles(event.dataTransfer.files);
      }}
    >
      <MessageList
        key={group.id}
        messages={visibleMessages}
        myUserId={myUserId}
        isLoading={isLoading}
        error={error}
        onRetryLoad={refetch}
        hasOlder={hasOlder}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={loadOlder}
        onOpenImage={setLightboxImage}
        onRetrySend={deliver}
        onDiscard={discard}
      />

      <MessageComposer
        ref={composerRef}
        groupName={group.name}
        disabled={isLoading || Boolean(error)}
        onSend={handleSend}
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-10 rounded-2xl border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-primary">Drop files to attach</p>
        </div>
      )}

      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
