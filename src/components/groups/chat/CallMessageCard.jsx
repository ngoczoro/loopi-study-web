import { Link } from "react-router-dom";
import { ExternalLink, Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** "less than a minute", "23 min", "1 h 5 min"; same wording as the backend. */
function formatDuration(ms) {
  const minutes = Math.floor(Math.max(Number(ms) || 0, 0) / 60_000);
  if (minutes < 1) return "less than a minute";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function meetCode(url) {
  try {
    return new URL(url).pathname.replace(/^\//, "") || url;
  } catch {
    return url;
  }
}

function describe(message, live) {
  const meta = message.metadata ?? {};
  if (message.kind === "call_started") {
    return {
      Icon: Phone,
      tone: live ? "live" : "done",
      title: "Group call",
      detail: live ? "In progress" : "Started a call",
    };
  }
  if (message.kind === "call_ended") {
    return {
      Icon: PhoneOff,
      tone: "done",
      title: "Call ended",
      detail:
        meta.durationMs != null
          ? formatDuration(meta.durationMs)
          : message.content.replace(/^Call ended · /, ""),
    };
  }
  const url = meta.url ?? message.content.replace(/^Google Meet: /, "");
  return { Icon: ExternalLink, tone: "meet", title: "Moved to Google Meet", detail: meetCode(url), url };
}

/**
 * A message posted by the call system, shown like a call entry in a chat app:
 * an icon, what happened, and a Join button while the call is still going.
 */
export default function CallMessageCard({ message, groupId, live = false }) {
  const { Icon, tone, title, detail, url } = describe(message, live);

  return (
    <div className="flex w-64 max-w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          tone === "live" && "bg-emerald-500 text-white",
          tone === "done" && "bg-secondary text-muted-foreground",
          tone === "meet" && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {live && (
        <Link
          to={`/groups/${groupId}?view=call`}
          replace
          className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          Join
        </Link>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open
        </a>
      )}
    </div>
  );
}
