import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BellOff,
  CalendarClock,
  FolderOpen,
  PanelRight,
  Pin,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import GroupAvatar from "../GroupAvatar";

function HeaderButton({ label, active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "h-9 w-9 rounded-lg inline-flex items-center justify-center transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

const backButtonClassName =
  "h-9 w-9 -ml-1 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary";

export default function ChatHeader({
  group,
  view,
  infoOpen,
  onToggleInfo,
  onOpenMembers,
  onChangeView,
}) {
  const toggleView = (target) => onChangeView(view === target ? "chat" : target);

  return (
    <header className="h-16 shrink-0 border-b border-border bg-card flex items-center gap-3 px-3 sm:px-4">
      {view === "chat" ? (
        <Link
          to="/groups"
          aria-label="Back to all groups"
          className={backButtonClassName}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onChangeView("chat")}
          aria-label="Back to chat"
          className={backButtonClassName}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <GroupAvatar group={group} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
            {group.name}
          </h1>
          {group.isPinned && <Pin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          {group.isMuted && <BellOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </div>
        <button
          type="button"
          onClick={onOpenMembers}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Users className="h-3 w-3" />
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <HeaderButton label="Video call" active={view === "call"} onClick={() => onChangeView("call")}>
          <Video className="h-[18px] w-[18px]" />
        </HeaderButton>
        <HeaderButton
          label="Reminders & deadlines"
          active={view === "tasks"}
          onClick={() => toggleView("tasks")}
        >
          <CalendarClock className="h-[18px] w-[18px]" />
        </HeaderButton>
        <HeaderButton
          label="Shared resources"
          active={view === "resources"}
          onClick={() => toggleView("resources")}
        >
          <FolderOpen className="h-[18px] w-[18px]" />
        </HeaderButton>
        <HeaderButton label="Conversation info" active={infoOpen} onClick={onToggleInfo}>
          <PanelRight className="h-[18px] w-[18px]" />
        </HeaderButton>
      </div>
    </header>
  );
}
