import { useEffect, useRef, useState } from "react";
import { getAuthUser } from "@/lib/authSession";
import { emitWithAck, onSocketEvent } from "@/lib/socket";
import { useSocketConnected } from "@/hooks/useSocket";

/**
 * Mesh call for one study group.
 *
 * The new participant offers to people already in the room. Everyone else
 * answers. `call:join` is safe to send again after a reconnect.
 *
 * Client → server, ack `{ ok, message?, peers? }`:
 *   call:join            { groupId }
 *   call:leave           { groupId }
 *   call:offer           { groupId, to, sdp }
 *   call:answer          { groupId, to, sdp }
 *   call:ice-candidate   { groupId, to, candidate }
 * Server → client:
 *   call:peer-joined     { groupId, user }
 *   call:peer-left       { groupId, userId }
 *   call:offer           { groupId, from, user?, sdp }
 *   call:answer          { groupId, from, sdp }
 *   call:ice-candidate   { groupId, from, candidate }
 */

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function currentCallUser() {
  const user = getAuthUser();
  return {
    userId: user?.id ?? user?.userId ?? null,
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
  return "Could not open the camera or microphone.";
}

function describeSignalingFailure(message) {
  if (
    !message ||
    message === "Socket is not connected" ||
    message === "Socket request timed out"
  ) {
    return "The call server is offline, so other members cannot join yet.";
  }
  return message;
}

function videoSender(pc) {
  return pc.getSenders().find((sender) => sender.track?.kind === "video");
}

export function useGroupCall(groupId, { visible = true } = {}) {
  const socketConnected = useSocketConnected();
  const [phase, setPhase] = useState("lobby");
  const [joining, setJoining] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [mediaMessage, setMediaMessage] = useState(null);
  const [signalingNote, setSignalingNote] = useState(null);
  const [remotes, setRemotes] = useState([]);
  const [startedAt, setStartedAt] = useState(null);

  const mountedRef = useRef(true);
  const joinedRef = useRef(false);
  const joinLockRef = useRef(false);
  const openingRef = useRef(null);
  const groupIdRef = useRef(groupId);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const micRef = useRef(true);
  const cameraRef = useRef(true);
  const peersRef = useRef(new Map());
  const earlyCandidatesRef = useRef(new Map());
  const handlersRef = useRef({});
  const prevSocketRef = useRef(socketConnected);

  groupIdRef.current = groupId;

  const syncRemotes = () => {
    if (!mountedRef.current) return;
    setRemotes(
      [...peersRef.current.values()].map((entry) => ({
        userId: entry.user.userId,
        user: entry.user,
        stream: entry.stream,
        connectionState: entry.connectionState,
      })),
    );
  };

  const closeAllPeers = () => {
    peersRef.current.forEach((entry) => entry.pc.close());
    peersRef.current.clear();
    earlyCandidatesRef.current.clear();
    syncRemotes();
  };

  const publishTrack = (track) => {
    const stream = localStreamRef.current ?? new MediaStream();
    const existing = stream.getTracks().find((item) => item.kind === track.kind);
    if (existing && existing !== track) {
      stream.removeTrack(existing);
      existing.stop();
    }
    if (!stream.getTracks().includes(track)) stream.addTrack(track);
    localStreamRef.current = stream;
    if (mountedRef.current) setLocalStream(new MediaStream(stream.getTracks()));

    peersRef.current.forEach((entry) => {
      const sender = entry.pc.getSenders().find((item) => item.track?.kind === track.kind);
      if (sender && sender.track !== screenTrackRef.current) {
        sender.replaceTrack(track);
        return;
      }
      if (sender) return;
      entry.pc.addTrack(track, stream);
      renegotiate(entry);
    });
  };

  const ensurePeer = (user) => {
    const userId = user.userId;
    const existing = peersRef.current.get(userId);
    if (existing) {
      existing.user = {
        ...existing.user,
        ...user,
        userId,
        fullName: user.fullName || existing.user.fullName,
      };
      return existing;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const entry = {
      user: {
        userId,
        fullName: user.fullName || "Member",
        avatarUrl: user.avatarUrl ?? null,
      },
      pc,
      stream: new MediaStream(),
      pendingCandidates: [],
      connectionState: "new",
    };
    peersRef.current.set(userId, entry);

    localStreamRef.current?.getTracks().forEach((track) => {
      if (track.kind === "video" && screenTrackRef.current) return;
      pc.addTrack(track, localStreamRef.current);
    });
    if (screenTrackRef.current) {
      const sender = videoSender(pc);
      if (sender) sender.replaceTrack(screenTrackRef.current);
      else pc.addTrack(screenTrackRef.current);
    }

    const early = earlyCandidatesRef.current.get(userId) ?? [];
    earlyCandidatesRef.current.delete(userId);
    entry.pendingCandidates.push(...early);

    pc.onicecandidate = (event) => {
      if (!event.candidate || !joinedRef.current) return;
      emitWithAck("call:ice-candidate", {
        groupId: groupIdRef.current,
        to: userId,
        candidate: event.candidate.toJSON(),
      });
    };
    pc.ontrack = (event) => {
      const current = peersRef.current.get(userId);
      if (!current) return;
      current.stream
        .getTracks()
        .filter((track) => track.kind === event.track.kind && track.id !== event.track.id)
        .forEach((track) => current.stream.removeTrack(track));
      if (!current.stream.getTrackById(event.track.id)) current.stream.addTrack(event.track);
      syncRemotes();
    };
    pc.onconnectionstatechange = () => {
      const current = peersRef.current.get(userId);
      if (!current) return;
      current.connectionState = pc.connectionState;
      syncRemotes();
    };

    syncRemotes();
    return entry;
  };

  const flushCandidates = async (entry) => {
    const queued = entry.pendingCandidates.splice(0);
    await Promise.all(
      queued.map((candidate) => entry.pc.addIceCandidate(candidate).catch(() => {})),
    );
  };

  async function renegotiate(entry) {
    if (!joinedRef.current || entry.pc.signalingState !== "stable") return;
    const offer = await entry.pc.createOffer();
    if (!joinedRef.current || entry.pc.signalingState !== "stable") return;
    await entry.pc.setLocalDescription(offer);
    emitWithAck("call:offer", {
      groupId: groupIdRef.current,
      to: entry.user.userId,
      sdp: entry.pc.localDescription,
    });
  }

  const offerToPeers = async (peers) => {
    const me = currentCallUser().userId;
    for (const peer of peers) {
      if (!peer?.userId || peer.userId === me || !joinedRef.current) continue;
      const entry = ensurePeer(peer);
      if (entry.pc.signalingState !== "stable") continue;
      const offer = await entry.pc.createOffer();
      if (!joinedRef.current) return;
      await entry.pc.setLocalDescription(offer);
      emitWithAck("call:offer", {
        groupId: groupIdRef.current,
        to: peer.userId,
        sdp: entry.pc.localDescription,
      });
    }
  };

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (openingRef.current) return openingRef.current;

    const request = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const error = new Error("unsupported");
        error.name = "NotSupportedError";
        throw error;
      }

      let stream;
      let partial = false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user" },
        });
      } catch (error) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          partial = true;
        } catch {
          throw error;
        }
      }

      stream.getAudioTracks().forEach((track) => {
        track.enabled = micRef.current;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = cameraRef.current;
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }

      if (!stream.getVideoTracks().length) {
        cameraRef.current = false;
        setCameraEnabled(false);
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaMessage(
        partial ? "Camera is unavailable. You can still join with your microphone." : null,
      );
      return stream;
    })().finally(() => {
      openingRef.current = null;
    });

    openingRef.current = request;
    return request;
  };

  const stopScreenShare = () => {
    const track = screenTrackRef.current;
    screenTrackRef.current = null;
    track?.stop();
    if (mountedRef.current) {
      setScreenStream(null);
      setSharing(false);
    }
    const camera = localStreamRef.current?.getVideoTracks()[0] ?? null;
    peersRef.current.forEach((entry) => {
      if (entry.pc.connectionState === "closed") return;
      const sender = videoSender(entry.pc);
      if (sender) sender.replaceTrack(camera);
    });
  };

  const leave = () => {
    if (joinedRef.current) {
      joinedRef.current = false;
      emitWithAck("call:leave", { groupId: groupIdRef.current });
    }
    const track = screenTrackRef.current;
    screenTrackRef.current = null;
    track?.stop();
    closeAllPeers();
    if (!mountedRef.current) return;
    setScreenStream(null);
    setSharing(false);
    setPhase("lobby");
    setSignalingNote(null);
    setStartedAt(null);
  };

  handlersRef.current = {
    onPeerJoined: ({ groupId: eventGroupId, user }) => {
      if (eventGroupId !== groupIdRef.current || !joinedRef.current) return;
      if (!user?.userId || user.userId === currentCallUser().userId) return;
      ensurePeer(user);
    },
    onPeerLeft: ({ groupId: eventGroupId, userId }) => {
      if (eventGroupId !== groupIdRef.current || !userId) return;
      peersRef.current.get(userId)?.pc.close();
      peersRef.current.delete(userId);
      syncRemotes();
    },
    onOffer: async ({ groupId: eventGroupId, from, user, sdp }) => {
      if (eventGroupId !== groupIdRef.current || !joinedRef.current || !from || !sdp) return;
      if (from === currentCallUser().userId) return;
      const entry = ensurePeer(user?.userId ? user : { userId: from, fullName: user?.fullName });
      const polite = (currentCallUser().userId ?? "") < from;
      if (entry.pc.signalingState === "have-local-offer") {
        if (!polite) return;
        await entry.pc.setLocalDescription({ type: "rollback" });
      }
      await entry.pc.setRemoteDescription(sdp);
      await flushCandidates(entry);
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
      emitWithAck("call:answer", {
        groupId: eventGroupId,
        to: from,
        sdp: entry.pc.localDescription,
      });
    },
    onAnswer: async ({ groupId: eventGroupId, from, sdp }) => {
      if (eventGroupId !== groupIdRef.current || !from || !sdp) return;
      const entry = peersRef.current.get(from);
      if (!entry || entry.pc.signalingState !== "have-local-offer") return;
      await entry.pc.setRemoteDescription(sdp);
      await flushCandidates(entry);
    },
    onIce: ({ groupId: eventGroupId, from, candidate }) => {
      if (eventGroupId !== groupIdRef.current || !from || !candidate) return;
      const entry = peersRef.current.get(from);
      if (!entry) {
        const queued = earlyCandidatesRef.current.get(from) ?? [];
        queued.push(candidate);
        earlyCandidatesRef.current.set(from, queued);
        return;
      }
      if (!entry.pc.remoteDescription) {
        entry.pendingCandidates.push(candidate);
        return;
      }
      entry.pc.addIceCandidate(candidate).catch(() => {});
    },
  };

  useEffect(() => {
    const forward = (name) => async (payload) => {
      try {
        await handlersRef.current[name]?.(payload);
      } catch {
        // A bad signaling payload should not take down the call screen.
      }
    };
    const unsubscribe = [
      onSocketEvent("call:peer-joined", forward("onPeerJoined")),
      onSocketEvent("call:peer-left", forward("onPeerLeft")),
      onSocketEvent("call:offer", forward("onOffer")),
      onSocketEvent("call:answer", forward("onAnswer")),
      onSocketEvent("call:ice-candidate", forward("onIce")),
    ];
    return () => unsubscribe.forEach((stop) => stop());
  }, []);

  useEffect(() => {
    if (!visible || phase !== "lobby") return undefined;
    let cancelled = false;
    ensureLocalMedia().catch((error) => {
      if (cancelled || !mountedRef.current) return;
      setMediaMessage(describeMediaError(error));
    });
    return () => {
      cancelled = true;
    };
  }, [visible, phase]);

  useEffect(() => {
    const wasConnected = prevSocketRef.current;
    prevSocketRef.current = socketConnected;
    if (!joinedRef.current || !socketConnected || wasConnected) return undefined;
    let cancelled = false;
    closeAllPeers();
    emitWithAck("call:join", { groupId: groupIdRef.current }).then((ack) => {
      if (cancelled || !joinedRef.current) return;
      if (!ack?.ok) {
        setSignalingNote(describeSignalingFailure(ack?.message));
        return;
      }
      setSignalingNote(null);
      const peers = ack.peers ?? ack.data?.peers ?? [];
      offerToPeers(peers);
    });
    return () => {
      cancelled = true;
    };
    // Rejoin only when the socket comes back during an active call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnected]);

  useEffect(() => {
    const peers = peersRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (joinedRef.current) {
        joinedRef.current = false;
        emitWithAck("call:leave", { groupId: groupIdRef.current });
      }
      peers.forEach((entry) => entry.pc.close());
      peers.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
    };
  }, []);

  const join = async () => {
    if (joinLockRef.current || joinedRef.current) return;
    joinLockRef.current = true;
    setJoining(true);
    try {
      try {
        await ensureLocalMedia();
      } catch (error) {
        if (mountedRef.current) setMediaMessage(describeMediaError(error));
      }
      joinedRef.current = true;
      if (mountedRef.current) {
        setPhase("in-call");
        setStartedAt(Date.now());
      }
      const ack = await emitWithAck("call:join", { groupId: groupIdRef.current });
      if (!joinedRef.current || !mountedRef.current) return;
      if (!ack?.ok) {
        setSignalingNote(describeSignalingFailure(ack?.message));
        return;
      }
      setSignalingNote(null);
      await offerToPeers(ack.peers ?? ack.data?.peers ?? []);
    } finally {
      joinLockRef.current = false;
      if (mountedRef.current) setJoining(false);
    }
  };

  const retryDevices = async () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setMediaMessage(null);
    micRef.current = true;
    cameraRef.current = true;
    setMicEnabled(true);
    setCameraEnabled(true);
    try {
      await ensureLocalMedia();
    } catch (error) {
      setMediaMessage(describeMediaError(error));
    }
  };

  const toggleMic = async () => {
    const next = !micRef.current;
    micRef.current = next;
    setMicEnabled(next);
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = next;
      return;
    }
    if (!next) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const [audio] = stream.getAudioTracks();
      if (!audio) return;
      audio.enabled = true;
      publishTrack(audio);
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
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = next;
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      return;
    }
    if (!next) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      const [video] = stream.getVideoTracks();
      if (!video) return;
      video.enabled = true;
      publishTrack(video);
    } catch (error) {
      cameraRef.current = false;
      setCameraEnabled(false);
      setMediaMessage(describeMediaError(error));
    }
  };

  const toggleScreenShare = async () => {
    if (screenTrackRef.current) {
      stopScreenShare();
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const [track] = display.getVideoTracks();
      if (!track) return;
      screenTrackRef.current = track;
      setScreenStream(display);
      setSharing(true);
      track.onended = () => {
        if (screenTrackRef.current !== track) return;
        stopScreenShare();
      };
      peersRef.current.forEach((entry) => {
        const sender = videoSender(entry.pc);
        if (sender) {
          sender.replaceTrack(track);
          return;
        }
        entry.pc.addTrack(track, display);
        renegotiate(entry);
      });
    } catch (error) {
      if (error?.name === "NotAllowedError" || error?.name === "AbortError") return;
      setMediaMessage("Could not share the screen.");
    }
  };

  const linkStatus =
    phase !== "in-call"
      ? "idle"
      : signalingNote
        ? "offline"
        : socketConnected
          ? "live"
          : "reconnecting";

  return {
    phase,
    joining,
    localStream,
    screenStream,
    micEnabled,
    cameraEnabled,
    sharing,
    mediaMessage,
    signalingNote,
    remotes,
    startedAt,
    socketConnected,
    linkStatus,
    me: currentCallUser(),
    join,
    leave,
    retryDevices,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
