import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Copy,
  Eraser,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  Pin,
  PinOff,
  Settings,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGroupResources, useUpdateMyGroupSettings } from "@/hooks/queries/groups";
import { useClearGroupHistory, useGroupShared } from "@/hooks/queries/chat";
import ConfirmActionDialog from "../ConfirmActionDialog";
import GroupAvatar from "../GroupAvatar";
import ImageLightbox from "../chat/ImageLightbox";
import { InfoRow, InfoSection, ViewAllButton } from "./InfoSection";
import MembersList from "./MembersList";
import { FileRow, LinkRow, MediaGrid, SharedEmpty } from "./SharedItems";

const PREVIEW_LIMIT = { media: 6, file: 3, link: 3 };
const ALL_LIMIT = 100;

const SHARED_TITLES = {
  media: "Photos/Videos",
  file: "Files",
  link: "Links",
};

function QuickAction({ icon, label, active = false, onClick }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-col items-center gap-1.5 w-[72px] group/action"
    >
      <span
        className={cn(
          "h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-foreground group-hover/action:bg-secondary/70",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[11px] leading-tight text-center text-muted-foreground">{label}</span>
    </button>
  );
}

function SharedPreview({ groupId, type, onOpenImage, onViewAll }) {
  const { items, isLoading, error } = useGroupShared(groupId, type, {
    limit: PREVIEW_LIMIT[type] + 1,
  });
  const visible = items.slice(0, PREVIEW_LIMIT[type]);

  if (isLoading) {
    return (
      <div className="px-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) return <p className="px-4 text-xs text-destructive">{error}</p>;
  if (visible.length === 0) {
    return <SharedEmpty label={`No ${SHARED_TITLES[type].toLowerCase()} shared yet.`} />;
  }

  return (
    <>
      {type === "media" && <MediaGrid items={visible} onOpenImage={onOpenImage} />}
      {type === "file" && visible.map((item) => <FileRow key={item.id} item={item} />)}
      {type === "link" && visible.map((item) => <LinkRow key={item.id} item={item} />)}
      {items.length > visible.length && <ViewAllButton onClick={onViewAll} />}
    </>
  );
}

function SharedAllView({ groupId, type, onOpenImage }) {
  const { items, isLoading, error } = useGroupShared(groupId, type, { limit: ALL_LIMIT });

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) return <p className="p-4 text-xs text-destructive">{error}</p>;
  if (items.length === 0) {
    return (
      <div className="pt-4">
        <SharedEmpty label={`No ${SHARED_TITLES[type].toLowerCase()} shared yet.`} />
      </div>
    );
  }

  return (
    <div className="py-3">
      {type === "media" && <MediaGrid items={items} onOpenImage={onOpenImage} />}
      {type === "file" && items.map((item) => <FileRow key={item.id} item={item} />)}
      {type === "link" && items.map((item) => <LinkRow key={item.id} item={item} />)}
    </div>
  );
}

export default function ConversationInfoPanel({
  group,
  onClose,
  onEdit,
  onInvite,
  onLeave,
  onOpenView,
}) {
  const isOwner = group.myRole === "owner";
  const [sharedView, setSharedView] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const settings = useUpdateMyGroupSettings(group.id);
  const clearHistory = useClearGroupHistory(group.id);
  const { resources } = useGroupResources(group.id);
  const noteCount = resources.filter((resource) => resource.type === "note").length;
  const { overdueTaskCount, blockedTaskCount } = group.progress;

  const toggleSetting = (key, value, message) => {
    settings.mutate(
      { [key]: value },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      toast.success("Invite code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy invite code");
    }
  };

  const confirmClear = async () => {
    if (clearHistory.isPending) return;
    try {
      await clearHistory.mutateAsync();
      toast.success("Chat history cleared for you");
      setClearOpen(false);
    } catch {
      // error is rendered by the dialog from mutation state
    }
  };

  const reminderHint = [
    overdueTaskCount > 0 && `${overdueTaskCount} overdue`,
    blockedTaskCount > 0 && `${blockedTaskCount} blocked`,
  ]
    .filter(Boolean)
    .join(" · ");

  const resourcesHint =
    resources.length === 0
      ? "Nothing shared yet"
      : [
          `${resources.length} resource${resources.length === 1 ? "" : "s"}`,
          noteCount > 0 && `${noteCount} note${noteCount === 1 ? "" : "s"}`,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <aside className="h-full w-full flex flex-col bg-card">
      <div className="h-16 shrink-0 border-b border-border flex items-center gap-2 px-3">
        {sharedView ? (
          <button
            type="button"
            onClick={() => setSharedView(null)}
            aria-label="Back to conversation info"
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <h2 className="flex-1 text-center text-sm font-semibold text-foreground">
          {sharedView ? SHARED_TITLES[sharedView] : "Conversation info"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation info"
          className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {sharedView ? (
          <SharedAllView groupId={group.id} type={sharedView} onOpenImage={setLightboxImage} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 px-4 pt-5 pb-4 border-b-8 border-secondary/60">
              <GroupAvatar group={group} size="lg" />
              <div className="flex items-center gap-1.5 max-w-full">
                <p className="text-base font-semibold text-foreground truncate">{group.name}</p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={onEdit}
                    aria-label="Edit group"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {group.description && (
                <p className="text-xs text-muted-foreground text-center line-clamp-3">
                  {group.description}
                </p>
              )}

              <div className="flex justify-center gap-1 pt-2">
                <QuickAction
                  icon={group.isMuted ? BellOff : Bell}
                  label={group.isMuted ? "Unmute" : "Mute"}
                  active={group.isMuted}
                  onClick={() =>
                    toggleSetting(
                      "muted",
                      !group.isMuted,
                      group.isMuted ? "Notifications turned on" : "Notifications muted",
                    )
                  }
                />
                <QuickAction
                  icon={group.isPinned ? PinOff : Pin}
                  label={group.isPinned ? "Unpin" : "Pin chat"}
                  active={group.isPinned}
                  onClick={() =>
                    toggleSetting(
                      "pinned",
                      !group.isPinned,
                      group.isPinned ? "Conversation unpinned" : "Conversation pinned",
                    )
                  }
                />
                <QuickAction icon={UserPlus} label="Add members" onClick={onInvite} />
                {isOwner && <QuickAction icon={Settings} label="Manage group" onClick={onEdit} />}
              </div>
            </div>

            <InfoSection title={`Members (${group.memberCount})`}>
              <MembersList group={group} />
              <InfoRow icon={UserPlus} label="Add members" onClick={onInvite} />
            </InfoSection>

            <InfoSection title="Group board">
              <InfoRow
                icon={CalendarClock}
                label="Reminders & deadlines"
                hint={reminderHint || "Group tasks and due dates"}
                onClick={() => onOpenView("tasks")}
                trailing={
                  overdueTaskCount + blockedTaskCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold inline-flex items-center justify-center">
                      {overdueTaskCount + blockedTaskCount}
                    </span>
                  )
                }
              />
              <InfoRow
                icon={StickyNote}
                label="Notes & shared resources"
                hint={resourcesHint}
                onClick={() => onOpenView("resources")}
              />
            </InfoSection>

            {["media", "file", "link"].map((type) => (
              <InfoSection key={type} title={SHARED_TITLES[type]}>
                <SharedPreview
                  groupId={group.id}
                  type={type}
                  onOpenImage={setLightboxImage}
                  onViewAll={() => setSharedView(type)}
                />
              </InfoSection>
            ))}

            <InfoSection title="Privacy & security" defaultOpen={false}>
              <InfoRow
                icon={KeyRound}
                label={`Invite code: ${group.inviteCode}`}
                hint="Anyone with this code can join"
                onClick={copyInviteCode}
                trailing={
                  copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )
                }
              />
              {isOwner && (
                <InfoRow
                  icon={Users}
                  label="Manage invite code"
                  hint="Generate a new code to stop old invites"
                  onClick={onInvite}
                />
              )}
            </InfoSection>

            <div className="py-2">
              <InfoRow
                icon={Eraser}
                label="Clear chat history"
                hint="Only removes messages for you"
                tone="danger"
                onClick={() => setClearOpen(true)}
              />
              <InfoRow
                icon={isOwner ? Trash2 : LogOut}
                label={isOwner ? "Delete group" : "Leave group"}
                tone="danger"
                onClick={onLeave}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmActionDialog
        open={clearOpen}
        onOpenChange={(next) => {
          if (!next) clearHistory.reset();
          setClearOpen(next);
        }}
        title="Clear chat history?"
        description="All current messages, photos, files and links in this group will be hidden for you. Other members still see them."
        confirmLabel="Clear history"
        destructive
        busy={clearHistory.isPending}
        error={clearHistory.error?.message ?? null}
        onConfirm={confirmClear}
      />
      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </aside>
  );
}
