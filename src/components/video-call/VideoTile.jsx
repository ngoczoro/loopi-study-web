import { useEffect, useRef, useState } from "react";
import { MicOff, MonitorUp } from "lucide-react";
import { cn } from "@/lib/utils";
import MemberAvatar from "@/components/groups/MemberAvatar";

function useSpeaking(stream, enabled) {
  const [speaking, setSpeaking] = useState(false);
  const generation = `${stream?.id ?? ""}:${enabled ? "1" : "0"}`;
  const [generationSeen, setGenerationSeen] = useState(generation);
  if (generation !== generationSeen) {
    setGenerationSeen(generation);
    setSpeaking(false);
  }

  useEffect(() => {
    if (!enabled || !stream) return undefined;

    const audioTracks = stream.getAudioTracks().filter((track) => track.readyState === "live");
    if (audioTracks.length === 0) return undefined;

    let context;
    let frame = 0;
    let last = false;
    try {
      context = new AudioContext();
      const source = context.createMediaStreamSource(new MediaStream(audioTracks));
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
  }, [stream, enabled]);

  return speaking;
}

function useRemoteMedia(stream, active) {
  const [media, setMedia] = useState({ videoOn: false, audioOn: false });
  const generation = active && stream ? stream.id : "";
  const [generationSeen, setGenerationSeen] = useState(generation);
  if (generation !== generationSeen) {
    setGenerationSeen(generation);
    setMedia({ videoOn: false, audioOn: false });
  }

  useEffect(() => {
    if (!active || !stream) return undefined;

    let trackCleanups = [];
    const publish = () => {
      const live = (kind) =>
        stream
          .getTracks()
          .some((track) => track.kind === kind && track.readyState === "live" && !track.muted);
      setMedia({ videoOn: live("video"), audioOn: live("audio") });
    };
    const bind = () => {
      trackCleanups.forEach((cleanup) => cleanup());
      trackCleanups = [];
      stream.getTracks().forEach((track) => {
        track.addEventListener("mute", publish);
        track.addEventListener("unmute", publish);
        track.addEventListener("ended", publish);
        trackCleanups.push(() => {
          track.removeEventListener("mute", publish);
          track.removeEventListener("unmute", publish);
          track.removeEventListener("ended", publish);
        });
      });
      publish();
    };

    bind();
    stream.addEventListener("addtrack", bind);
    stream.addEventListener("removetrack", bind);
    return () => {
      stream.removeEventListener("addtrack", bind);
      stream.removeEventListener("removetrack", bind);
      trackCleanups.forEach((cleanup) => cleanup());
    };
  }, [stream, active]);

  if (!active || !stream) return { videoOn: false, audioOn: false };
  return media;
}

export default function VideoTile({
  stream,
  user,
  label,
  micOn = false,
  videoOn = false,
  watchRemote = false,
  silent = false,
  sharing = false,
  mirror = false,
  fit = "cover",
  status,
  className,
}) {
  const videoRef = useRef(null);
  const remote = useRemoteMedia(stream, watchRemote);
  const showVideo = watchRemote ? remote.videoOn : videoOn;
  const hearMic = watchRemote ? remote.audioOn : micOn;
  const speaking = useSpeaking(stream, hearMic);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.srcObject = stream ?? null;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-2xl bg-[hsl(340,24%,14%)]",
        speaking && "ring-2 ring-emerald-400",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={silent}
        className={cn(
          "absolute inset-0 h-full w-full",
          fit === "contain" ? "object-contain" : "object-cover",
          mirror && "-scale-x-100",
          showVideo ? "opacity-100" : "opacity-0",
        )}
      />

      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <MemberAvatar user={user} className="h-20 w-20 text-2xl" />
        </div>
      )}

      {status && (
        <p className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white">
          {status}
        </p>
      )}

      <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
        {!hearMic && <MicOff className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
        {sharing && (
          <span className="inline-flex shrink-0 items-center gap-1 text-white/80">
            <MonitorUp className="h-3.5 w-3.5" />
            Presenting
          </span>
        )}
      </div>
    </div>
  );
}
