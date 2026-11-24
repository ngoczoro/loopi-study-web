import { useEffect, useRef, useState } from "react";
import {
  ConnectionQuality,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  createLocalAudioTrack,
  createLocalTracks,
  createLocalVideoTrack,
} from "livekit-client";
import { getAuthUser } from "@/lib/authSession";
import { requestCallToken } from "@/services/groupCallService";

/**
 * Group video call on LiveKit (SFU).
 *
 * 1. Lobby: camera and microphone preview tracks.
 * 2. Join: `POST /groups/:id/call/token`, connect to LiveKit, publish the preview tracks.
 * 3. In call: LiveKit forwards one stream per person and picks a quality for each viewer
 *    (simulcast + adaptive stream + dynacast), so cost per person stays flat as the room grows.
 *
 * Remote video must be shown with `track.attach(element)` (see VideoTile): adaptive stream
 * watches the element's size and visibility, and pauses video nobody is looking at.
 */

const CAMERA_CAPTURE = { resolution: VideoPresets.h720.resolution, facingMode: "user" };

/** People tiles per page: a 3×3 grid, or one row under a shared screen. */
export const GRID_PAGE_SIZE = 9;
export const STAGE_PAGE_SIZE = 4;

export function currentCallUser() {
  const user = getAuthUser();
  const userId = user?.id ?? user?.userId ?? null;
  return {
    userId: userId == null ? null : String(userId),
    fullName: user?.fullName || "You",
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function describeMediaError(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Camera and microphone access is blocked. Allow them in the browser, then try again.";
  }
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
    return "No camera or microphone was found on this device.";
  }
  if (error?.name === "NotSupportedError") {
    return "This browser does not support video calls.";
  }
  if (error?.name === "NotReadableError") {
    return "The camera or microphone is being used by another app.";
  }
  return "Could not open the camera or microphone.";
}

function describeDisconnect(reason) {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
      return null;
    case DisconnectReason.DUPLICATE_IDENTITY:
      return "You joined this call from another tab or device, so it ended here.";
    case DisconnectReason.PARTICIPANT_REMOVED:
      return "You were removed from the call.";
    case DisconnectReason.ROOM_DELETED:
      return "The call was closed.";
    default:
      return "You were disconnected from the call. Join again to reconnect.";
  }
}

function parseMetadata(metadata) {
  if (!metadata) return {};
  try {
    const value = JSON.parse(metadata);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/** A published, unmuted, subscribed track, or null. */
function liveTrack(participant, source) {
  const publication = participant.getTrackPublication(source);
  if (!publication || publication.isMuted || !publication.track) return null;
  return publication.track;
}

function snapshotRemote(participant, lastSpokeAt) {
  const meta = parseMetadata(participant.metadata);
  return {
    userId: participant.identity,
    user: {
      userId: participant.identity,
      fullName: participant.name || "Member",
      avatarUrl: meta.avatarUrl ?? null,
    },
    cameraTrack: liveTrack(participant, Track.Source.Camera),
    screenTrack: liveTrack(participant, Track.Source.ScreenShare),
    audioTrack: liveTrack(participant, Track.Source.Microphone),
    micOn: participant.isMicrophoneEnabled,
    speaking: participant.isSpeaking,
    lastSpokeAt: lastSpokeAt.get(participant.identity) ?? 0,
    quality: participant.connectionQuality,
    connectionState:
      participant.connectionQuality === ConnectionQuality.Lost ? "reconnecting" : "connected",
  };
}

/**
 * Keeps tiles in a stable order, except that someone who starts speaking outside the
 * first `slots` positions moves to the front so they are on the first page.
 */
function nextOrder(previous, remotes, slots) {
  const ids = new Set(remotes.map((remote) => remote.userId));
  const order = previous.filter((id) => ids.has(id));
  remotes.forEach((remote) => {
    if (!order.includes(remote.userId)) order.push(remote.userId);
  });

  const visible = new Set(order.slice(0, slots));
  const promoted = remotes
    .filter((remote) => remote.speaking && !visible.has(remote.userId))
    .sort((a, b) => b.lastSpokeAt - a.lastSpokeAt)
    .map((remote) => remote.userId);
  if (promoted.length === 0) return order;
  return [...promoted, ...order.filter((id) => !promoted.includes(id))];
}

export function useGroupCall(groupId, { visible = true } = {}) {
  const [phase, setPhase] = useState("lobby");
  const [joining, setJoining] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localScreenTrack, setLocalScreenTrack] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mediaMessage, setMediaMessage] = useState(null);
  const [callError, setCallError] = useState(null);
  const [remotes, setRemotes] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [localQuality, setLocalQuality] = useState(ConnectionQuality.Unknown);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(null);

  const mountedRef = useRef(true);
  const roomRef = useRef(null);
  const joinLockRef = useRef(false);
  const openingRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const micRef = useRef(true);
  const cameraRef = useRef(true);
  const groupIdRef = useRef(groupId);
  const lastSpokeAtRef = useRef(new Map());
  const orderRef = useRef([]);
  const screenRef = useRef(null);

  useEffect(() => {
    groupIdRef.current = groupId;
  }, [groupId]);

  const setScreen = (track) => {
    screenRef.current = track;
    if (mountedRef.current) setLocalScreenTrack(track);
  };

  const setAudio = (track) => {
    audioRef.current = track;
    if (mountedRef.current) setLocalAudioTrack(track);
  };

  const setVideo = (track) => {
    videoRef.current = track;
    if (mountedRef.current) setLocalVideoTrack(track);
  };

  const stopLocalTracks = () => {
    audioRef.current?.stop();
    videoRef.current?.stop();
    setAudio(null);
    setVideo(null);
  };

  const syncRemotes = (room) => {
    if (!mountedRef.current || roomRef.current !== room) return;
    const snapshots = [...room.remoteParticipants.values()].map((participant) =>
      snapshotRemote(participant, lastSpokeAtRef.current),
    );
    const stage = Boolean(screenRef.current) || snapshots.some((snapshot) => snapshot.screenTrack);
    // The first page also holds the local tile.
    const slots = (stage ? STAGE_PAGE_SIZE : GRID_PAGE_SIZE) - 1;
    orderRef.current = nextOrder(orderRef.current, snapshots, slots);
    const byId = new Map(snapshots.map((snapshot) => [snapshot.userId, snapshot]));
    setRemotes(orderRef.current.map((id) => byId.get(id)).filter(Boolean));
  };

  const resetToLobby = (message = null) => {
    setScreen(null);
    setRemotes([]);
    setPhase("lobby");
    setStartedAt(null);
    setReconnecting(false);
    setLocalSpeaking(false);
    setAudioBlocked(false);
    setCallError(message);
    lastSpokeAtRef.current.clear();
    orderRef.current = [];
  };

  /** Opens camera + microphone for the lobby preview. Falls back to microphone only. */
  const ensurePreview = async () => {
    if (audioRef.current || videoRef.current) return;
    if (openingRef.current) return openingRef.current;

    const request = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const error = new Error("unsupported");
        error.name = "NotSupportedError";
        throw error;
      }

      let tracks;
      let partial = false;
      try {
        tracks = await createLocalTracks({ audio: true, video: CAMERA_CAPTURE });
      } catch (error) {
        try {
          tracks = await createLocalTracks({ audio: true, video: false });
          partial = true;
        } catch {
          throw error;
        }
      }

      if (!mountedRef.current) {
        tracks.forEach((track) => track.stop());
        return;
      }

      const audio = tracks.find((track) => track.kind === Track.Kind.Audio) ?? null;
      const video = tracks.find((track) => track.kind === Track.Kind.Video) ?? null;
      if (audio && !micRef.current) await audio.mute();
      if (video && !cameraRef.current) await video.mute();
      if (!video) {
        cameraRef.current = false;
        setCameraEnabled(false);
      }
      setAudio(audio);
      setVideo(video);
      setMediaMessage(
        partial ? "Camera is unavailable. You can still join with your microphone." : null,
      );
    })().finally(() => {
      openingRef.current = null;
    });

    openingRef.current = request;
    return request;
  };

  const createRoom = () => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: CAMERA_CAPTURE,
      publishDefaults: {
        simulcast: true,
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
      },
    });
    const sync = () => syncRemotes(room);

    room
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        lastSpokeAtRef.current.delete(participant.identity);
        sync();
      })
      .on(RoomEvent.TrackPublished, sync)
      .on(RoomEvent.TrackUnpublished, sync)
      .on(RoomEvent.TrackSubscribed, sync)
      .on(RoomEvent.TrackUnsubscribed, sync)
      .on(RoomEvent.TrackMuted, sync)
      .on(RoomEvent.TrackUnmuted, sync)
      .on(RoomEvent.ParticipantMetadataChanged, sync)
      .on(RoomEvent.ParticipantNameChanged, sync)
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const now = Date.now();
        speakers.forEach((speaker) => lastSpokeAtRef.current.set(speaker.identity, now));
        if (mountedRef.current && roomRef.current === room) {
          setLocalSpeaking(speakers.some((speaker) => speaker === room.localParticipant));
        }
        sync();
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (participant === room.localParticipant) {
          if (mountedRef.current) setLocalQuality(quality);
          return;
        }
        sync();
      })
      .on(RoomEvent.Reconnecting, () => {
        if (mountedRef.current) setReconnecting(true);
      })
      .on(RoomEvent.Reconnected, () => {
        if (mountedRef.current) setReconnecting(false);
        sync();
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (mountedRef.current) setAudioBlocked(!room.canPlaybackAudio);
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        // Also fires when the browser's own "Stop sharing" button is used.
        if (publication.source !== Track.Source.ScreenShare) return;
        setScreen(null);
        sync();
      })
      .on(RoomEvent.Disconnected, (reason) => {
        if (roomRef.current !== room) return;
        roomRef.current = null;
        stopLocalTracks();
        if (mountedRef.current) resetToLobby(describeDisconnect(reason));
      });

    return room;
  };

  const join = async () => {
    if (joinLockRef.current || roomRef.current) return;
    joinLockRef.current = true;
    setJoining(true);
    setCallError(null);
    let room = null;

    try {
      try {
        await ensurePreview();
      } catch (error) {
        if (mountedRef.current) setMediaMessage(describeMediaError(error));
      }

      const result = await requestCallToken(groupIdRef.current);
      if (!mountedRef.current) return;
      if (!result.success) {
        setCallError(result.message || "Could not start the call.");
        return;
      }

      const { token, url, maxParticipants: limit } = result.data ?? {};
      room = createRoom();
      roomRef.current = room;
      await room.connect(url, token);
      if (!mountedRef.current || roomRef.current !== room) {
        room.disconnect();
        return;
      }

      if (audioRef.current) {
        await room.localParticipant.publishTrack(audioRef.current, {
          source: Track.Source.Microphone,
        });
      }
      // A camera muted in the lobby is stopped (light off); it is published when turned on.
      if (videoRef.current && cameraRef.current) {
        await room.localParticipant.publishTrack(videoRef.current, {
          source: Track.Source.Camera,
        });
      }

      setMaxParticipants(limit ?? null);
      setAudioBlocked(!room.canPlaybackAudio);
      setPhase("in-call");
      setStartedAt(Date.now());
      syncRemotes(room);
    } catch {
      if (room && roomRef.current === room) {
        roomRef.current = null;
        // Keep the preview tracks so the user can try again.
        room.disconnect(false);
      }
      if (mountedRef.current) {
        setCallError("Could not connect to the call server. Check your connection and try again.");
      }
    } finally {
      joinLockRef.current = false;
      if (mountedRef.current) setJoining(false);
    }
  };

  const leave = () => {
    const room = roomRef.current;
    roomRef.current = null;
    room?.disconnect();
    stopLocalTracks();
    resetToLobby(null);
  };

  const retryDevices = async () => {
    stopLocalTracks();
    setMediaMessage(null);
    micRef.current = true;
    cameraRef.current = true;
    setMicEnabled(true);
    setCameraEnabled(true);
    try {
      await ensurePreview();
    } catch (error) {
      setMediaMessage(describeMediaError(error));
    }
  };

  const publishIfInCall = async (track, source) => {
    const room = roomRef.current;
    if (room) await room.localParticipant.publishTrack(track, { source });
  };

  const toggleMic = async () => {
    const next = !micRef.current;
    micRef.current = next;
    setMicEnabled(next);
    const track = audioRef.current;
    if (track) {
      await (next ? track.unmute() : track.mute()).catch(() => {});
      return;
    }
    if (!next) return;
    try {
      const created = await createLocalAudioTrack();
      if (!mountedRef.current) {
        created.stop();
        return;
      }
      setAudio(created);
      await publishIfInCall(created, Track.Source.Microphone);
    } catch (error) {
      micRef.current = false;
      setMicEnabled(false);
      setMediaMessage(describeMediaError(error));
    }
  };

  const toggleCamera = async () => {
    const next = !cameraRef.current;
    cameraRef.current = next;
    setCameraEnabled(next);
    const track = videoRef.current;
    if (track) {
      // Muting a camera track also turns the camera light off; unmuting reopens it.
      await (next ? track.unmute() : track.mute()).catch(() => {});
      const room = roomRef.current;
      if (next && room && !room.localParticipant.getTrackPublication(Track.Source.Camera)) {
        await room.localParticipant
          .publishTrack(track, { source: Track.Source.Camera })
          .catch(() => setMediaMessage("Could not turn the camera on."));
      }
      return;
    }
    if (!next) return;
    try {
      const created = await createLocalVideoTrack(CAMERA_CAPTURE);
      if (!mountedRef.current) {
        created.stop();
        return;
      }
      setVideo(created);
      setMediaMessage(null);
      await publishIfInCall(created, Track.Source.Camera);
    } catch (error) {
      cameraRef.current = false;
      setCameraEnabled(false);
      setMediaMessage(describeMediaError(error));
    }
  };

  const toggleScreenShare = async () => {
    const room = roomRef.current;
    if (!room) return;
    const sharing = room.localParticipant.isScreenShareEnabled;
    try {
      const publication = await room.localParticipant.setScreenShareEnabled(!sharing, {
        audio: false,
      });
      setScreen(!sharing ? (publication?.track ?? null) : null);
      syncRemotes(room);
    } catch (error) {
      if (error?.name === "NotAllowedError" || error?.name === "AbortError") return;
      setMediaMessage("Could not share the screen.");
    }
  };

  const startAudio = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.startAudio().catch(() => {});
    if (mountedRef.current) setAudioBlocked(!room.canPlaybackAudio);
  };

  useEffect(() => {
    if (!visible || phase !== "lobby") return undefined;
    let cancelled = false;
    ensurePreview().catch((error) => {
      if (cancelled || !mountedRef.current) return;
      setMediaMessage(describeMediaError(error));
    });
    return () => {
      cancelled = true;
    };
    // ensurePreview only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const room = roomRef.current;
      roomRef.current = null;
      room?.disconnect();
      audioRef.current?.stop();
      videoRef.current?.stop();
      audioRef.current = null;
      videoRef.current = null;
    };
  }, []);

  const linkStatus = phase !== "in-call" ? "idle" : reconnecting ? "reconnecting" : "live";

  return {
    phase,
    joining,
    localVideoTrack,
    localAudioTrack,
    localScreenTrack,
    micEnabled,
    cameraEnabled,
    sharing: Boolean(localScreenTrack),
    mediaMessage,
    callError,
    remotes,
    startedAt,
    linkStatus,
    localSpeaking,
    localQuality,
    audioBlocked,
    maxParticipants,
    me: currentCallUser(),
    join,
    leave,
    retryDevices,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    startAudio,
  };
}
