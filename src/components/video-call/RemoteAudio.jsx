import { useEffect, useRef } from "react";

function AudioTrackPlayer({ track }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const element = audioRef.current;
    if (!element || !track) return undefined;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay />;
}

/**
 * Plays every remote microphone, including people whose tiles are on another page.
 */
export default function RemoteAudio({ remotes }) {
  return (
    <div className="hidden" aria-hidden="true">
      {remotes
        .filter((remote) => remote.audioTrack)
        .map((remote) => (
          <AudioTrackPlayer
            key={`${remote.userId}:${remote.audioTrack.sid ?? "mic"}`}
            track={remote.audioTrack}
          />
        ))}
    </div>
  );
}
