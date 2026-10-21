import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useGroup } from "@/hooks/queries/groups";
import ChatHeader from "@/components/groups/chat/ChatHeader";
import GroupChat from "@/components/groups/chat/GroupChat";
import ConversationInfoPanel from "@/components/groups/info/ConversationInfoPanel";
import GroupCallTab from "@/components/groups/detail/GroupCallTab";
import ResourcesView from "@/components/groups/resources/ResourcesView";
import ProgressView from "@/components/groups/progress/ProgressView";
import EditGroupModal from "@/components/groups/EditGroupModal";
import InviteMembersModal from "@/components/groups/InviteMembersModal";
import LeaveGroupDialog from "@/components/groups/LeaveGroupDialog";

const VIEWS = ["chat", "tasks", "resources", "call"];
const WIDE_SCREEN_QUERY = "(min-width: 1280px)";

// Fills the area under the 3.5rem TopBar, cancelling Layout's <main> padding.
const PAGE_FRAME_CLASS =
  "-m-4 md:-m-6 lg:-m-8 h-[calc(100dvh-3.5rem)] flex overflow-hidden";

function CenterView({ view, group }) {
  if (view === "resources") return <ResourcesView group={group} />;
  if (view === "tasks") return <ProgressView group={group} />;
  return <GroupChat key={group.id} group={group} />;
}

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { group, isLoading, error } = useGroup(groupId);
  const [infoOpen, setInfoOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).get("view") === "call") return false;
    return window.matchMedia(WIDE_SCREEN_QUERY).matches;
  });
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [callLive, setCallLive] = useState(false);

  const requestedView = searchParams.get("view");
  const view = VIEWS.includes(requestedView) ? requestedView : "chat";

  const changeView = (next) => {
    setSearchParams(next === "chat" ? {} : { view: next }, { replace: true });
    if (next === "call" || !window.matchMedia(WIDE_SCREEN_QUERY).matches) setInfoOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`${PAGE_FRAME_CLASS} items-center justify-center`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={`${PAGE_FRAME_CLASS} flex-col items-center justify-center gap-2 p-6 text-center`}>
        <p className="text-sm text-destructive">{error || "Group not found"}</p>
        <Link to="/groups" className="text-sm font-medium text-primary hover:underline">
          Back to your groups
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_FRAME_CLASS} relative`}>
      <section className="relative flex-1 min-h-0 min-w-0 flex flex-col">
        <ChatHeader
          group={group}
          view={view}
          infoOpen={infoOpen}
          onToggleInfo={() => setInfoOpen((open) => !open)}
          onOpenMembers={() => setInfoOpen(true)}
          onChangeView={changeView}
        />
        {callLive && view !== "call" && (
          <button
            type="button"
            onClick={() => changeView("call")}
            className="shrink-0 flex items-center justify-between gap-3 border-b border-border bg-primary/10 px-4 py-2 text-sm"
          >
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              You&apos;re in a group call
            </span>
            <span className="font-medium text-primary">Return</span>
          </button>
        )}
        {(view === "call" || callLive) && (
          <div
            className={view === "call" ? "flex-1 min-h-0 flex flex-col" : "sr-only"}
            inert={view === "call" ? undefined : true}
            aria-hidden={view !== "call"}
          >
            <GroupCallTab
              key={group.id}
              group={group}
              visible={view === "call"}
              onLiveChange={setCallLive}
              onLeft={() => {
                setCallLive(false);
                changeView("chat");
              }}
            />
          </div>
        )}
        {view !== "call" && <CenterView view={view} group={group} />}
      </section>

      {infoOpen && (
        <>
          <div
            className="xl:hidden absolute inset-0 z-20 bg-foreground/20"
            onClick={() => setInfoOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-[360px] border-l border-border shadow-soft-lg xl:static xl:z-auto xl:w-[340px] xl:shadow-none shrink-0">
            <ConversationInfoPanel
              group={group}
              onClose={() => setInfoOpen(false)}
              onEdit={() => setEditOpen(true)}
              onInvite={() => setInviteOpen(true)}
              onLeave={() => setLeaveOpen(true)}
              onOpenView={changeView}
            />
          </div>
        </>
      )}

      <EditGroupModal group={group} open={editOpen} onOpenChange={setEditOpen} />
      <InviteMembersModal group={group} open={inviteOpen} onOpenChange={setInviteOpen} />
      <LeaveGroupDialog
        group={group}
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onDone={() => navigate("/groups", { replace: true })}
      />
    </div>
  );
}
