import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { patchCachedCallMeet } from "@/hooks/queries/groupCall";
import {
  endGoogleMeet,
  shareGoogleMeet,
  startGoogleMeet,
} from "@/services/groupCallService";

const NEW_MEET_URL = "https://meet.google.com/new";
const MEET_LINK_PATTERN = /^(?:https?:\/\/)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#].*)?$/i;

/**
 * Opens `url` in the tab opened during the click. Browsers block tabs opened after an
 * await, so the tab is opened first and pointed at the Meet once we have the link.
 */
function navigate(tab, url) {
  if (tab && !tab.closed) {
    tab.opener = null;
    tab.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

const styles = {
  lobby: {
    card: "border border-border bg-card text-foreground",
    muted: "text-muted-foreground",
    input: "border-border bg-background text-foreground placeholder:text-muted-foreground",
    secondary: "text-muted-foreground hover:text-foreground",
  },
  call: {
    card: "border border-white/10 bg-[hsl(var(--brand-h),28%,12%)] text-white shadow-lg",
    muted: "text-white/60",
    input: "border-white/15 bg-white/5 text-white placeholder:text-white/40",
    secondary: "text-white/60 hover:text-white",
  },
};

/**
 * Google Meet fallback, used when Loopi calls are unavailable or the group moves to Meet.
 *
 * Getting a link, in order: the group's current Meet → one created by the backend
 * (Google Meet API) → the group's standing link → a Meet the member creates and pastes.
 * Whatever link is used is shared with the whole group (call:status + a chat message).
 */
export default function MeetFallback({
  group,
  meet,
  failure,
  variant = "lobby",
  title,
  description,
  onJoin,
  onDismiss,
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("offer");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [pasted, setPasted] = useState("");
  const look = styles[variant];

  const publish = (nextMeet) => patchCachedCallMeet(queryClient, group.id, nextMeet);

  const start = async () => {
    const tab = window.open("", "_blank");
    setBusy(true);
    setNote(null);
    try {
      const created = await startGoogleMeet(group.id);
      if (created.success && created.data?.meet?.url) {
        publish(created.data.meet);
        navigate(tab, created.data.meet.url);
        onJoin?.();
        return;
      }

      const backup =
        created.error?.details?.fallback?.backupMeetUrl ??
        failure?.fallback?.backupMeetUrl ??
        group.backupMeetUrl ??
        null;
      if (backup) {
        const shared = await shareGoogleMeet(group.id, backup);
        if (shared.success && shared.data?.meet?.url) {
          publish(shared.data.meet);
          navigate(tab, shared.data.meet.url);
          onJoin?.();
          return;
        }
      }

      // Last resort: the member creates a Meet and pastes its link here.
      navigate(tab, NEW_MEET_URL);
      setMode("paste");
      setNote(
        `${created.message || "Could not create a Meet automatically."} A new Google Meet opened in another tab — copy its link and paste it below.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const share = async (event) => {
    event.preventDefault();
    const url = pasted.trim();
    if (!MEET_LINK_PATTERN.test(url)) {
      setNote("Paste a Google Meet link, for example https://meet.google.com/abc-defg-hij.");
      return;
    }
    setBusy(true);
    try {
      const shared = await shareGoogleMeet(group.id, url);
      if (!shared.success) {
        setNote(shared.message || "Could not share the link.");
        return;
      }
      publish(shared.data?.meet ?? null);
      setMode("offer");
      setPasted("");
      setNote(null);
    } finally {
      setBusy(false);
    }
  };

  const end = async () => {
    setBusy(true);
    try {
      const ended = await endGoogleMeet(group.id);
      if (ended.success) publish(null);
      else setNote(ended.message || "Could not end the Google Meet.");
    } finally {
      setBusy(false);
    }
  };

  if (meet?.url) {
    return (
      <div className={cn("w-full max-w-xl rounded-2xl p-4", look.card)}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
            <Video className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {variant === "call" ? "This call moved to Google Meet" : "This group is on Google Meet"}
            </p>
            <p className={cn("mt-0.5 text-xs", look.muted)}>
              {meet.startedBy?.fullName ? `Started by ${meet.startedBy.fullName}. ` : ""}
              Anyone in the group can join with this link.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={meet.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onJoin?.()}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-600/90"
              >
                <ExternalLink className="h-4 w-4" />
                Join on Google Meet
              </a>
              <button
                type="button"
                onClick={end}
                disabled={busy}
                className={cn("text-xs font-medium disabled:opacity-50", look.secondary)}
              >
                Stop using Meet
              </button>
            </div>
            {note && <p className="mt-2 text-xs text-destructive">{note}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-xl rounded-2xl p-4", look.card)}>
      <p className="text-sm font-semibold">{title ?? "Use Google Meet instead?"}</p>
      <p className={cn("mt-1 text-xs", look.muted)}>
        {description ??
          failure?.message ??
          "Loopi calls are unavailable right now. Move the group to Google Meet so everyone can keep talking."}
      </p>

      {mode === "paste" ? (
        <form onSubmit={share} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            inputMode="url"
            autoFocus
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            aria-label="Google Meet link"
            className={cn("h-9 flex-1 rounded-lg border px-3 text-sm outline-none", look.input)}
          />
          <button
            type="submit"
            disabled={busy || !pasted.trim()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-600/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Share with the group
          </button>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-600/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {busy ? "Opening Google Meet…" : "Start Google Meet"}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              disabled={busy}
              className={cn("text-xs font-medium", look.secondary)}
            >
              Not now
            </button>
          )}
        </div>
      )}

      {note && <p className={cn("mt-2 text-xs", mode === "paste" ? look.muted : "text-destructive")}>{note}</p>}
    </div>
  );
}
