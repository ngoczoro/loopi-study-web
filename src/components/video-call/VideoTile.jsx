import { useEffect, useRef, useState } from "react";
import { ConnectionQuality } from "livekit-client";
import { Maximize2, MicOff, Minimize2, MonitorUp, SignalLow, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import MemberAvatar from "@/components/groups/MemberAvatar";

/**
 * Voice activity from a raw microphone track. Only used for the lobby preview;
 * in a call LiveKit reports who is speaking.
 */
function useLevelSpeaking(mediaStreamTrack, enabled) {
  const [speaking, setSpeaking] = useState(false);
  const generation = `${mediaStreamTrack?.id ?? ""}:${enabled ? "1" : "0"}`;
  const [generationSeen, setGenerationSeen] = useState(generation);
  if (generation !== generationSeen) {
    setGenerationSeen(generation);
    setSpeaking(false);
  }

  useEffect(() => {
    if (!enabled || !mediaStreamTrack || mediaStreamTrack.readyState !== "live") return undefined;

    let context;
    let frame = 0;
    let last = false;
    try {
      context = new AudioContext();
      const source = context.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(samples);
        let sum = 0;
        for (let index = 0; index < samples.length; index += 1) sum += samples[index];
        const next = sum / samples.length > 22;
        if (next !== last) {
          last = next;
          setSpeaking(next);
        }
        frame = requestAnimationFrame(tick);
      };
      context.resume?.();
      tick();
      return () => {
        cancelAnimationFrame(frame);
        source.disconnect();
        context.close();
      };
    } catch {
      return undefined;
    }
  }, [mediaStreamTrack, enabled]);

  return speaking;
}

function QualityBadge({ quality }) {
  if (quality === ConnectionQuality.Poor) {
    return (
      <span
        title="Weak connection"
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-amber-300"
      >
        <SignalLow className="h-3.5 w-3.5" />
        Weak
      </span>
    );
  }
  if (quality === ConnectionQuality.Lost) {
    return (
      <span
        title="Connection lost"
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-red-300"
      >
        <WifiOff className="h-3.5 w-3.5" />
        Lost
      </span>
    );
  }
  return null;
}

/**
 * One person (or one shared screen) in the call.
 *
 * `videoTrack` is a LiveKit track and is shown with `track.attach()`, which lets adaptive
 * stream size the incoming video to this tile and pause it when the tile is not visible.
 * Audio is not played here; RemoteAudio plays every remote microphone.
 *
 * `onToggleExpand` adds a corner button that puts this tile on the main stage (or back
 * into the grid when `expanded`). It shows on hover, and always on touch screens.
 * `compact` is for the small tiles beside the stage and the mini call window.
 */
export default function VideoTile({
  videoTrack = null,
  videoOn = false,
  user,
  label,
  micOn = false,
  speaking,
  levelTrack = null,
  sharing = false,
  mirror = false,
  fit = "cover",
  status,
  quality,
  expanded = false,
  onToggleExpand,
  compact = false,
  className,
}) {
  const videoRef = useRef(null);
  const levelSpeaking = useLevelSpeaking(levelTrack, speaking === undefined && micOn);
  const isSpeaking = micOn && (speaking ?? levelSpeaking);
  const showVideo = Boolean(videoTrack) && videoOn;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack) return undefined;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  return (
    <div
      className={cn(
        "group/tile relative aspect-video overflow-hidden bg-[hsl(var(--brand-h),24%,14%)]",
        compact ? "rounded-xl" : "rounded-2xl",
        isSpeaking && "ring-2 ring-emerald-400",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 h-full w-full",
          fit === "contain" ? "object-contain" : "object-cover",
          mirror && "-scale-x-100",
          showVideo ? "opacity-100" : "opacity-0",
        )}
      />

      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <MemberAvatar
            user={user}
            className={compact ? "h-10 w-10 text-sm" : "h-20 w-20 text-2xl"}
          />
        </div>
      )}

      {status && (
        <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white">
          {status}
        </p>
      )}

      <QualityBadge quality={quality} />

      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? `Shrink ${label}` : `Enlarge ${label}`}
          title={expanded ? "Shrink" : "Enlarge"}
          className={cn(
            "absolute left-2 top-2 flex items-center justify-center rounded-full bg-black/55 text-white transition-opacity hover:bg-black/75 focus-visible:opacity-100",
            compact ? "h-7 w-7" : "h-8 w-8",
            "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100",
          )}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}

      <div
        className={cn(
          "absolute flex items-center gap-1.5 rounded-full bg-black/55 text-white",
          compact
            ? "bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] px-2 py-0.5 text-[11px]"
            : "bottom-3 left-3 max-w-[calc(100%-1.5rem)] px-2.5 py-1 text-xs",
        )}
      >
        {!micOn && !sharing && <MicOff className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
        {sharing && (
          <span className="inline-flex shrink-0 items-center gap-1 text-white/80">
            <MonitorUp className="h-3.5 w-3.5" />
            {!compact && "Presenting"}
          </span>
        )}
      </div>
    </div>
  );
}
