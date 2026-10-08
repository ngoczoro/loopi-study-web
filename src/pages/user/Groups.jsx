import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BellOff,
  ChevronRight,
  Crown,
  LogIn,
  Pin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { getAuthUser } from "@/lib/authSession";
import { useGroups } from "@/hooks/queries/groups";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupAvatar from "@/components/groups/GroupAvatar";
import JoinGroupModal from "@/components/groups/JoinGroupModal";
import { formatMessageTime, formatSharedDate } from "@/components/groups/chat/chatFormat";

function describeLastMessage(group) {
  const last = group.lastMessage;
  if (!last) return null;
  const isMine = last.sender?.userId === getAuthUser()?.id;
  const senderName = isMine ? "You" : last.sender?.fullName?.split(" ").pop() ?? "Someone";
  const body =
    last.content?.trim() ||
    (last.attachmentCount > 0
      ? `sent ${last.attachmentCount} attachment${last.attachmentCount === 1 ? "" : "s"}`
      : "");
  return `${senderName}: ${body}`;
}

const ROLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "owner", label: "Owned" },
  { value: "member", label: "Joined" },
];

export default function Groups() {
  const navigate = useNavigate();
  const { groups, isLoading, error, refetch } = useGroups();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const visibleGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (roleFilter === "unread") {
        if (!(group.unreadCount > 0)) return false;
      } else if (roleFilter !== "all" && group.myRole !== roleFilter) {
        return false;
      }
      if (!keyword) return true;
      return (
        group.name.toLowerCase().includes(keyword) ||
        (group.description ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [groups, search, roleFilter]);

  const openGroup = (group) => navigate(`/groups/${group.id}`);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Study Groups
          </h1>
          <p className="text-sm text-muted-foreground">
            Learn together, share materials and keep each other on track
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors inline-flex items-center gap-1.5"
          >
            <LogIn className="h-4 w-4" />
            Join with code
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New group
          </button>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups"
              className="w-full h-9 rounded-full bg-card pl-9 pr-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex rounded-full bg-secondary p-1">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRoleFilter(filter.value)}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                  roleFilter === filter.value
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1].map((key) => (
            <div key={key} className="bg-card rounded-2xl p-4 shadow-soft h-[92px] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl p-4 shadow-soft flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center space-y-3">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              You haven&apos;t joined any study group yet
            </p>
            <p className="text-xs text-muted-foreground">
              Create a group or join one with an invite code.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="h-9 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Join with code
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create group
            </button>
          </div>
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
          <p className="text-sm text-muted-foreground">No groups match your filter.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {visibleGroups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="bg-card rounded-2xl p-4 shadow-soft hover:shadow-soft-md transition-shadow flex items-start gap-3"
            >
              <GroupAvatar group={group} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-sm text-foreground truncate ${
                      group.unreadCount > 0 ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {group.name}
                  </p>
                  {group.myRole === "owner" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  {group.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  {group.isMuted && (
                    <BellOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  {group.lastMessage && (
                    <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                      {formatSharedDate(group.lastMessage.createdAt) === "Today"
                        ? formatMessageTime(group.lastMessage.createdAt)
                        : formatSharedDate(group.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs line-clamp-1 flex-1 ${
                      group.unreadCount > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {describeLastMessage(group) ?? group.description ?? "No messages yet"}
                  </p>
                  {group.unreadCount > 0 && (
                    <span
                      className={`h-5 min-w-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center shrink-0 ${
                        group.isMuted
                          ? "bg-muted-foreground/60 text-background"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {group.unreadCount > 5 ? "5+" : group.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                  {group.progress.goalPercent !== null &&
                    ` · ${group.progress.goalPercent}% of goals`}
                </p>
                {group.progress.isBehind && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Behind schedule
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      )}

      <CreateGroupModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={openGroup}
      />
      <JoinGroupModal open={joinOpen} onOpenChange={setJoinOpen} onJoined={openGroup} />
    </div>
  );
}
