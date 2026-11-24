import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroupMembers } from "@/hooks/queries/groups";
import { useGroupCallStatus } from "@/hooks/queries/groupCall";
import MemberAvatar from "@/components/groups/MemberAvatar";
import RemoteAudio from "./RemoteAudio";
import VideoTile from "./VideoTile";
import { GRID_PAGE_SIZE, STAGE_PAGE_SIZE, useGroupCall } from "./useGroupCall";

const STATUS_REFRESH_DELAY_MS = 1500;

function formatElapsed(startedAt, now) {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function ControlButton({ label, pressed, tone = "default", disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      className={cn(
        "h-12 w-12 rounded-full inline-flex items-center justify-center text-white transition-colors disabled:opacity-50",
        tone === "danger" && "bg-destructive hover:bg-destructive/90",
        tone === "primary" && "bg-primary hover:bg-primary/90",
        tone === "default" && "bg-white/15 hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

function MicButton({ call }) {
  return (
    <ControlButton
      label={call.micEnabled ? "Mute microphone" : "Unmute microphone"}
      pressed={call.micEnabled}
      tone={call.micEnabled ? "default" : "danger"}
      onClick={call.toggleMic}
    >
      {call.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
    </ControlButton>
  );
}

function CameraButton({ call }) {
  return (
    <ControlButton
      label={call.cameraEnabled ? "Turn camera off" : "Turn camera on"}
      pressed={call.cameraEnabled}
      tone={call.cameraEnabled ? "default" : "danger"}
      onClick={call.toggleCamera}
    >
      {call.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
    </ControlButton>
  );
}

function CallControls({ call, onLeave, onTogglePeople, peopleOpen, count }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 pb-5 pt-2">
      <MicButton call={call} />
      <CameraButton call={call} />
      <ControlButton
        label={call.sharing ? "Stop sharing" : "Share screen"}
        pressed={call.sharing}
        tone={call.sharing ? "primary" : "default"}
        onClick={call.toggleScreenShare}
      >
        <MonitorUp className="h-5 w-5" />
      </ControlButton>
      <ControlButton
        label="People"
        pressed={peopleOpen}
        tone={peopleOpen ? "primary" : "default"}
        onClick={onTogglePeople}
      >
        <span className="relative">
          <Users className="h-5 w-5" />
          <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-white px-1 text-[10px] font-semibold leading-4 text-[hsl(var(--brand-h),30%,12%)]">
            {count}
          </span>
        </span>
      </ControlButton>
      <button
        type="button"
        onClick={onLeave}
        className="h-12 rounded-full bg-destructive px-5 text-sm font-semibold text-white hover:bg-destructive/90 inline-flex items-center gap-2"
      >
        <PhoneOff className="h-4 w-4" />
        Leave
      </button>
    </div>
  );
}

function PersonRow({ user, detail, micOn }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <MemberAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.fullName}</p>
        <p className="truncate text-xs text-white/50">{detail}</p>
      </div>
      {!micOn && <MicOff className="h-4 w-4 shrink-0 text-white/50" />}
    </div>
  );
}

function PeoplePanel({ group, call, onClose }) {
  const { members, isLoading } = useGroupMembers(group.id);
  const inCallIds = new Set([call.me.userId, ...call.remotes.map((remote) => remote.userId)]);
  const waiting = members.filter((member) => !inCallIds.has(String(member.userId)));

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-white/10 bg-[hsl(var(--brand-h),28%,10%)] text-white sm:w-[320px]">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <h3 className="text-sm font-semibold">People</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close people"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <section className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">
            In this call · {inCallIds.size}
          </p>
          <PersonRow user={call.me} detail="You" micOn={call.micEnabled} />
          {call.remotes.map((remote) => (
            <PersonRow
              key={remote.userId}
              user={remote.user}
              detail={remote.connectionState === "connected" ? "Connected" : "Reconnecting"}
              micOn={remote.micOn}
            />
          ))}
        </section>
        <section className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">
            Not in the call
          </p>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          ) : waiting.length === 0 ? (
            <p className="text-xs text-white/50">Everyone in the group is here.</p>
          ) : (
            waiting.map((member) => (
              <PersonRow key={member.userId} user={member} detail="Not joined" micOn />
            ))
          )}
        </section>
      </div>
    </aside>
  );
}

function InCallNow({ status }) {
  if (!status.active) {
    return <p className="text-sm text-muted-foreground">No one is in the call yet.</p>;
  }
  const shown = status.participants.slice(0, 5);
  const extra = status.count - shown.length;
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map((person) => (
          <MemberAvatar
            key={person.userId}
            user={person}
            size="sm"
            className="ring-2 ring-background"
          />
        ))}
      </div>
      <p className="text-sm text-foreground">
        {status.count === 1 ? "1 person is" : `${status.count} people are`} in this call
        {extra > 0 && <span className="text-muted-foreground"> (+{extra} more)</span>}
      </p>
    </div>
  );
}

function statusLabel(status) {
  if (status === "reconnecting") return "Reconnecting";
  return "Connected";
}

function Pager({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-xs text-white/70">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        Page {page + 1} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function gridClassFor(count) {
  if (count <= 1) return "grid-cols-1 max-w-4xl";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-2 xl:grid-cols-3";
}

export default function GroupCallPanel({ group, visible = true, onLiveChange, onLeft }) {
  const call = useGroupCall(group.id, { visible });
  const { status: callStatus, refresh: refreshCallStatus } = useGroupCallStatus(group.id);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const inCall = call.phase === "in-call";

  useEffect(() => {
    onLiveChange?.(inCall);
  }, [inCall, onLiveChange]);

  // The webhook normally updates this; refetch as well in case it is not set up (local dev).
  useEffect(() => {
    const timer = setTimeout(refreshCallStatus, STATUS_REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [inCall, refreshCallStatus]);

  useEffect(() => {
    if (!inCall || !call.startedAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [inCall, call.startedAt]);

  const localVideoOn = call.cameraEnabled && Boolean(call.localVideoTrack);
  const shares = [
    ...(call.localScreenTrack
      ? [{ id: "local-screen", track: call.localScreenTrack, user: call.me, label: "You" }]
      : []),
    ...call.remotes
      .filter((remote) => remote.screenTrack)
      .map((remote) => ({
        id: `${remote.userId}-screen`,
        track: remote.screenTrack,
        user: remote.user,
        label: remote.user.fullName,
      })),
  ];
  const stageVisible = inCall && shares.length > 0;
  const pageSize = stageVisible ? STAGE_PAGE_SIZE : GRID_PAGE_SIZE;

  if (!inCall) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Join group call</h2>
            <p className="mt-1 text-sm text-muted-foreground">{group.name}</p>
          </div>

          <div className="relative w-full">
            <VideoTile
              videoTrack={call.localVideoTrack}
              videoOn={localVideoOn}
              user={call.me}
              label={call.me.fullName}
              micOn={call.micEnabled && Boolean(call.localAudioTrack)}
              levelTrack={call.localAudioTrack?.mediaStreamTrack ?? null}
              mirror={localVideoOn}
            />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 rounded-full bg-black/45 p-2">
              <MicButton call={call} />
              <CameraButton call={call} />
            </div>
          </div>

          <InCallNow status={callStatus} />

          {call.mediaMessage && (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-destructive">{call.mediaMessage}</p>
              {!call.localAudioTrack && !call.localVideoTrack && (
                <button
                  type="button"
                  onClick={call.retryDevices}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {call.callError && (
            <p role="alert" className="max-w-md text-center text-sm text-destructive">
              {call.callError}
            </p>
          )}

          <button
            type="button"
            onClick={call.join}
            disabled={call.joining}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {call.joining && <Loader2 className="h-4 w-4 animate-spin" />}
            {call.joining ? "Joining…" : "Join call"}
          </button>
        </div>
      </div>
    );
  }

  const tiles = [
    {
      id: "local",
      videoTrack: call.localVideoTrack,
      videoOn: localVideoOn,
      user: call.me,
      label: "You",
      micOn: call.micEnabled && Boolean(call.localAudioTrack),
      speaking: call.localSpeaking,
      mirror: localVideoOn,
      quality: call.localQuality,
    },
    ...call.remotes.map((remote) => ({
      id: remote.userId,
      videoTrack: remote.cameraTrack,
      videoOn: Boolean(remote.cameraTrack),
      user: remote.user,
      label: remote.user.fullName,
      micOn: remote.micOn,
      speaking: remote.speaking,
      quality: remote.quality,
      status: remote.connectionState === "connected" ? null : "Reconnecting",
    })),
  ];

  const pageCount = Math.max(1, Math.ceil(tiles.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageTiles = tiles.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const count = tiles.length;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[hsl(var(--brand-h),30%,8%)] text-white">
      <RemoteAudio remotes={call.remotes} />

      <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-4">
        <p className="truncate text-sm font-medium">{group.name}</p>
        <p className="flex shrink-0 items-center gap-2 text-xs text-white/75">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              call.linkStatus === "live" ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
          {call.startedAt ? formatElapsed(call.startedAt, now) : "00:00"}
          <span>· {statusLabel(call.linkStatus)}</span>
          <span>
            · {count}
            {call.maxParticipants ? `/${call.maxParticipants}` : ""}
          </span>
        </p>
      </div>

      {call.audioBlocked && (
        <button
          type="button"
          onClick={call.startAudio}
          className="mx-4 mb-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary/90 px-3 py-2 text-xs font-medium text-white hover:bg-primary"
        >
          <Volume2 className="h-4 w-4" />
          Your browser blocked call audio. Click to turn it on.
        </button>
      )}

      {call.mediaMessage && (
        <p className="mx-4 mb-2 rounded-xl bg-amber-400/15 px-3 py-2 text-center text-xs text-amber-100">
          {call.mediaMessage}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 sm:px-4">
        {stageVisible && (
          <div
            className={cn(
              "mb-3 grid w-full gap-3",
              shares.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            {shares.map((share) => (
              <VideoTile
                key={share.id}
                videoTrack={share.track}
                videoOn
                user={share.user}
                label={share.label}
                micOn
                speaking={false}
                sharing
                fit="contain"
                className="aspect-auto min-h-[240px] max-h-[60vh] bg-black"
              />
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex flex-1 flex-col",
            !stageVisible && pageTiles.length === 1 && "items-center justify-center",
          )}
        >
          <div
            className={cn(
              "mx-auto grid w-full gap-3",
              stageVisible ? "grid-cols-2 sm:grid-cols-4" : gridClassFor(pageTiles.length),
            )}
          >
            {pageTiles.map(({ id, ...tile }) => (
              <VideoTile key={id} {...tile} />
            ))}
          </div>
          {call.remotes.length === 0 && (
            <p className="py-4 text-center text-sm text-white/60">Waiting for other members to join</p>
          )}
        </div>
      </div>

      <Pager page={currentPage} pageCount={pageCount} onChange={setPage} />

      <CallControls
        call={call}
        peopleOpen={peopleOpen}
        onTogglePeople={() => setPeopleOpen((open) => !open)}
        onLeave={() => {
          call.leave();
          onLeft?.();
        }}
        count={count}
      />

      {peopleOpen && <PeoplePanel group={group} call={call} onClose={() => setPeopleOpen(false)} />}
    </div>
  );
}
