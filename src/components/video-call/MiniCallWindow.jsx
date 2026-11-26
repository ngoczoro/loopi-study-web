import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoTile from "./VideoTile";

const CORNER_KEY = "loopi.miniCall.corner";
const CORNERS = ["bottom-right", "bottom-left", "top-right", "top-left"];
const DRAG_THRESHOLD_PX = 6;

// Right corners sit above the floating assistant button; top corners below the TopBar.
const CORNER_CLASSES = {
  "bottom-right": "bottom-24 right-4 md:right-6",
  "bottom-left": "bottom-4 left-4 md:left-6",
  "top-right": "top-[4.5rem] right-4 md:right-6",
  "top-left": "top-[4.5rem] left-4 md:left-6",
};

function readCorner() {
  try {
    const saved = window.localStorage.getItem(CORNER_KEY);
    return CORNERS.includes(saved) ? saved : "bottom-right";
  } catch {
    return "bottom-right";
  }
}

function saveCorner(corner) {
  try {
    window.localStorage.setItem(CORNER_KEY, corner);
  } catch {
    // Private mode: the window just starts in the default corner next time.
  }
}

/** Someone presenting, else the latest speaker with a camera, else the latest speaker, else you. */
function pickFeatured(call) {
  const presenter = call.remotes.find((remote) => remote.screenTrack);
  if (presenter) {
    return {
      videoTrack: presenter.screenTrack,
      videoOn: true,
      user: presenter.user,
      label: presenter.user.fullName,
      micOn: presenter.micOn,
      speaking: presenter.speaking,
      sharing: true,
      fit: "contain",
    };
  }
  const bySpeech = [...call.remotes].sort((a, b) => b.lastSpokeAt - a.lastSpokeAt);
  const remote = bySpeech.find((item) => item.cameraTrack) ?? bySpeech[0];
  if (remote) {
    return {
      videoTrack: remote.cameraTrack,
      videoOn: Boolean(remote.cameraTrack),
      user: remote.user,
      label: remote.user.fullName,
      micOn: remote.micOn,
      speaking: remote.speaking,
      quality: remote.quality,
    };
  }
  const localVideoOn = call.cameraEnabled && Boolean(call.localVideoTrack);
  return {
    videoTrack: call.localVideoTrack,
    videoOn: localVideoOn,
    user: call.me,
    label: "You",
    micOn: call.micEnabled && Boolean(call.localAudioTrack),
    speaking: call.localSpeaking,
    mirror: localVideoOn,
  };
}

function MiniButton({ label, tone = "default", onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors",
        tone === "danger" && "bg-destructive hover:bg-destructive/90",
        tone === "muted" && "bg-destructive/80 hover:bg-destructive",
        tone === "default" && "bg-white/15 hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The call while the user is on another page: who is talking (or what is being
 * presented), mic, camera, back to the call, and leave. Drag it to another corner.
 */
export default function MiniCallWindow({ groupId, groupName, call }) {
  const navigate = useNavigate();
  const [corner, setCorner] = useState(readCorner);
  const [offset, setOffset] = useState(null);
  const dragRef = useRef(null);
  const featured = pickFeatured(call);
  const backToCall = () => navigate(`/groups/${groupId}?view=call`);

  const onPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    dragRef.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    setOffset({ dx, dy });
  };

  const onPointerUp = (event) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setOffset(null);
    if (!drag) return;
    if (!drag.moved) {
      backToCall();
      return;
    }
    // Snap to the corner nearest to where the window was dropped.
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const vertical = centerY < window.innerHeight / 2 ? "top" : "bottom";
    const horizontal = centerX < window.innerWidth / 2 ? "left" : "right";
    const next = `${vertical}-${horizontal}`;
    setCorner(next);
    saveCorner(next);
  };

  return (
    <div
      role="dialog"
      aria-label={`Call in ${groupName ?? "your group"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setOffset(null);
      }}
      style={offset ? { transform: `translate(${offset.dx}px, ${offset.dy}px)` } : undefined}
      className={cn(
        "fixed z-50 w-56 touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--brand-h),30%,8%)] text-white shadow-2xl sm:w-72",
        CORNER_CLASSES[corner],
        offset ? "cursor-grabbing" : "cursor-pointer transition-[top,bottom,left,right]",
      )}
    >
      <VideoTile {...featured} compact className="rounded-none" />
      <div className="flex items-center gap-2 px-2.5 py-2">
        <p className="min-w-0 flex-1 truncate text-xs font-medium" title={groupName}>
          {groupName ?? "Group call"}
        </p>
        <MiniButton
          label={call.micEnabled ? "Mute microphone" : "Unmute microphone"}
          tone={call.micEnabled ? "default" : "muted"}
          onClick={call.toggleMic}
        >
          {call.micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </MiniButton>
        <MiniButton
          label={call.cameraEnabled ? "Turn camera off" : "Turn camera on"}
          tone={call.cameraEnabled ? "default" : "muted"}
          onClick={call.toggleCamera}
        >
          {call.cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </MiniButton>
        <MiniButton label="Back to the call" onClick={backToCall}>
          <Maximize2 className="h-4 w-4" />
        </MiniButton>
        <MiniButton label="Leave call" tone="danger" onClick={call.leave}>
          <PhoneOff className="h-4 w-4" />
        </MiniButton>
      </div>
    </div>
  );
}
