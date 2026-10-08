import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractUrls, splitTextWithLinks } from "@/lib/chatLinks";
import MemberAvatar from "../MemberAvatar";
import { formatMessageTime } from "./chatFormat";
import { FileCard, ImageGrid, LinkPreviewCard } from "./MessageAttachments";

function MessageText({ content }) {
  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {splitTextWithLinks(content).map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={index}
            href={segment.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 break-all"
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </p>
  );
}

/**
 * `isFirstInCluster` shows the sender (others only); `isLastInCluster` shows
 * the time, mirroring how consecutive messages are grouped in chat apps.
 */
export default function MessageItem({
  message,
  isMine,
  isFirstInCluster,
  isLastInCluster,
  onOpenImage,
  onRetry,
  onDiscard,
}) {
  const attachments = message.attachments ?? [];
  const images = attachments.filter((item) => item.kind === "image");
  const files = attachments.filter((item) => item.kind !== "image");
  const firstUrl = extractUrls(message.content)[0];
  const hasText = Boolean(message.content?.trim());

  return (
    <div
      className={cn(
        "flex gap-2",
        isMine ? "justify-end" : "justify-start",
        isFirstInCluster ? "mt-3" : "mt-0.5",
      )}
    >
      {!isMine && (
        <div className="w-8 shrink-0">
          {isFirstInCluster && <MemberAvatar user={message.sender} size="sm" className="h-8 w-8" />}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%] min-w-0",
          isMine ? "items-end" : "items-start",
          message.status === "sending" && "opacity-70",
        )}
      >
        {hasText && (
          <div
            className={cn(
              "rounded-2xl px-3 py-2 shadow-sm",
              isMine
                ? "bg-primary/10 border border-primary/20 text-foreground"
                : "bg-card border border-border text-foreground",
            )}
          >
            {!isMine && isFirstInCluster && (
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                {message.sender?.fullName}
              </p>
            )}
            <MessageText content={message.content} />
          </div>
        )}

        {!hasText && !isMine && isFirstInCluster && (
          <p className="text-[11px] font-medium text-muted-foreground">
            {message.sender?.fullName}
          </p>
        )}

        <ImageGrid images={images} onOpenImage={onOpenImage} />
        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
        {firstUrl && <LinkPreviewCard url={firstUrl} />}

        {message.status === "sending" && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending…
          </span>
        )}
        {message.status === "failed" && (
          <span className="text-[11px] text-destructive inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {message.error ?? "Failed to send"}
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="font-medium underline underline-offset-2"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => onDiscard(message)}
              className="font-medium underline underline-offset-2"
            >
              Remove
            </button>
          </span>
        )}
        {!message.status && isLastInCluster && (
          <span className="text-[11px] text-muted-foreground">
            {formatMessageTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
