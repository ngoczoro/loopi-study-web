import { useEffect, useState } from "react";
import {
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroupMembers } from "@/hooks/queries/groups";
import MemberAvatar from "@/components/groups/MemberAvatar";
import VideoTile from "./VideoTile";
import { useGroupCall } from "./useGroupCall";

function formatElapsed(startedAt, now) {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function trackLive(stream, kind) {
  return Boolean(
    stream
      ?.getTracks()
      .some(
        (track) =>
          track.kind === kind && track.readyState === "live" && track.enabled && !track.muted,
      ),
  );
}

function ControlButton({ label, pressed, tone = "default", onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "h-12 w-12 rounded-full inline-flex items-center justify-center text-white transition-colors",
        tone === "danger" && "bg-destructive hover:bg-destructive/90",
        tone === "primary" && "bg-primary hover:bg-primary/90",
        tone === "default" && "bg-white/15 hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

function CallControls({ call, onLeave, onTogglePeople, peopleOpen, count }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 pb-5 pt-2">
      <ControlButton
        label={call.micEnabled ? "Mute microphone" : "Unmute microphone"}
        pressed={call.micEnabled}
        tone={call.micEnabled ? "default" : "danger"}
        onClick={call.toggleMic}
      >
        {call.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>
      <ControlButton
        label={call.cameraEnabled ? "Turn camera off" : "Turn camera on"}
        pressed={call.cameraEnabled}
        tone={call.cameraEnabled ? "default" : "danger"}
        onClick={call.toggleCamera}
      >
        {call.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>
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
          <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-white px-1 text-[10px] font-semibold leading-4 text-[hsl(340,30%,12%)]">
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

function PeoplePanel({ group, call, onClose }) {
  const { members, isLoading } = useGroupMembers(group.id);
  const inCallIds = new Set([call.me.userId, ...call.remotes.map((remote) => remote.userId)]);
  const waiting = members.filter((member) => !inCallIds.has(member.userId));

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-white/10 bg-[hsl(340,28%,10%)] text-white sm:w-[320px]">
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
              detail={remote.connectionState === "connected" ? "Connected" : "Connecting"}
              micOn={trackLive(remote.stream, "audio")}
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

function statusLabel(status) {
  if (status === "live") return "Connected";
  if (status === "reconnecting") return "Reconnecting";
  return "Only you";
}

export default function GroupCallPanel({ group, visible = true, onLiveChange, onLeft }) {
  const call = useGroupCall(group.id, { visible });
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inCall = call.phase === "in-call";

  useEffect(() => {
    onLiveChange?.(inCall);
  }, [inCall, onLiveChange]);

  useEffect(() => {
    if (!inCall || !call.startedAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [inCall, call.startedAt]);

  const previewStream = call.sharing && call.screenStream ? call.screenStream : call.localStream;
  const localVideoOn = call.sharing || (call.cameraEnabled && trackLive(call.localStream, "video"));

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
              stream={previewStream}
              user={call.me}
              label={call.me.fullName}
              micOn={call.micEnabled && trackLive(call.localStream, "audio")}
              videoOn={localVideoOn}
              silent
              sharing={call.sharing}
              mirror={!call.sharing && localVideoOn}
              fit={call.sharing ? "contain" : "cover"}
            />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 rounded-full bg-black/45 p-2">
              <ControlButton
                label={call.micEnabled ? "Mute microphone" : "Unmute microphone"}
                pressed={call.micEnabled}
                tone={call.micEnabled ? "default" : "danger"}
                onClick={call.toggleMic}
              >
                {call.micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </ControlButton>
              <ControlButton
                label={call.cameraEnabled ? "Turn camera off" : "Turn camera on"}
                pressed={call.cameraEnabled}
                tone={call.cameraEnabled ? "default" : "danger"}
                onClick={call.toggleCamera}
              >
                {call.cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </ControlButton>
            </div>
          </div>

          {call.mediaMessage && (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-destructive">{call.mediaMessage}</p>
              {!call.localStream && (
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

          <button
            type="button"
            onClick={call.join}
            disabled={call.joining}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {call.joining && <Loader2 className="h-4 w-4 animate-spin" />}
            Join call
          </button>
          <p className="max-w-md text-center text-xs text-muted-foreground">
            {call.socketConnected
              ? "Members of this group can join from the video button."
              : "The call server is offline, so other members will not see you yet. You can still check your camera and microphone."}
          </p>
        </div>
      </div>
    );
  }

  const tiles = [
    {
      id: "local",
      stream: previewStream,
      user: call.me,
      label: "You",
      micOn: call.micEnabled && trackLive(call.localStream, "audio"),
      videoOn: localVideoOn,
      silent: true,
      sharing: call.sharing,
      mirror: !call.sharing && localVideoOn,
      fit: call.sharing ? "contain" : "cover",
    },
    ...call.remotes.map((remote) => ({
      id: remote.userId,
      stream: remote.stream,
      user: remote.user,
      label: remote.user.fullName,
      watchRemote: true,
      silent: false,
      sharing: false,
      mirror: false,
      fit: "cover",
      status:
        remote.connectionState === "connected" || remote.connectionState === "new"
          ? null
          : "Reconnecting",
    })),
  ];

  const gridClass =
    tiles.length <= 1
      ? "grid-cols-1 max-w-4xl"
      : tiles.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : tiles.length <= 4
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[hsl(340,30%,8%)] text-white">
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
        </p>
      </div>

      {call.signalingNote && (
        <p className="mx-4 mb-2 rounded-xl bg-amber-400/15 px-3 py-2 text-center text-xs text-amber-100">
          {call.signalingNote}
        </p>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto px-3 sm:px-4",
          tiles.length === 1 && "items-center justify-center",
        )}
      >
        <div className={cn("grid w-full gap-3", gridClass)}>
          {tiles.map((tile) => (
            <VideoTile key={tile.id} {...tile} />
          ))}
        </div>
        {call.remotes.length === 0 && (
          <p className="py-4 text-center text-sm text-white/60">Waiting for other members to join</p>
        )}
      </div>

      <CallControls
        call={call}
        peopleOpen={peopleOpen}
        onTogglePeople={() => setPeopleOpen((open) => !open)}
        onLeave={() => {
          call.leave();
          onLeft?.();
        }}
        count={1 + call.remotes.length}
      />

      {peopleOpen && <PeoplePanel group={group} call={call} onClose={() => setPeopleOpen(false)} />}
    </div>
  );
}
