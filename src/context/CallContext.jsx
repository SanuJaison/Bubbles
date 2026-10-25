import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import toast from "react-hot-toast";

import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { logCallAPI } from "../service/api";

const CallContext = createContext(null);

// Public STUN is enough for most home networks. Calls across strict/carrier
// NATs would additionally need a TURN server.
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
      ],
    },
  ],
};

const RING_TIMEOUT_MS = 60000;

// getUserMedia throws several very different errors behind the same generic
// "permission denied" toast. Name the real cause so the next attempt is clear.
const describeMediaError = (error, type) => {
  const isVideo = type === "video";

  switch (error?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return isVideo
        ? "Camera and microphone permission was denied. Allow both in your browser or system settings."
        : "Microphone permission was denied. Allow it in your browser or system settings.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return isVideo
        ? "No camera or microphone was found. Connect a device and try again."
        : "No microphone was found. Connect a microphone and try again.";
    case "NotReadableError":
    case "TrackStartError":
      return isVideo
        ? "The camera or microphone is already in use by another app. Close it and try again."
        : "The microphone is already in use by another app. Close it and try again.";
    case "OverconstrainedError":
      return "The camera doesn't support the requested video settings. Try an audio call.";
    case "SecurityError":
      return "Calls require a secure HTTPS connection.";
    case "AbortError":
      return "The camera or microphone could not start. Try again.";
    default:
      return isVideo
        ? "Could not start the camera or microphone. Check your device and permissions."
        : "Could not start the microphone. Check your device and permissions.";
  }
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [call, setCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // Group calls: one stream per remote participant, plus the "a call is
  // running in this group" banner data keyed by chatId.
  const [remoteStreams, setRemoteStreams] = useState({});
  const [groupCallStates, setGroupCallStates] = useState({});
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [mutedUserIds, setMutedUserIds] = useState([]);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState("new");

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const callIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const ringTimeoutRef = useRef(null);

  // Mesh peers for a group call: userId -> RTCPeerConnection.
  const groupPcRef = useRef(new Map());
  const groupPendingCandidatesRef = useRef(new Map());

  // A call is logged once, by the caller, however it finishes.
  const loggedCallIdRef = useRef(null);

  // Mirror of `call` for the socket handlers, which are registered once.
  const callRef = useRef(null);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const cleanup = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    const pc = pcRef.current;

    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;

      try {
        pc.close();
      } catch {
        // Already closed — nothing to do.
      }
    }

    pcRef.current = null;

    groupPcRef.current.forEach((peer) => {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;

      try {
        peer.close();
      } catch {
        // Already closed.
      }
    });

    groupPcRef.current.clear();
    groupPendingCandidatesRef.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    pendingCandidatesRef.current = [];
    callIdRef.current = null;
    remoteUserIdRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteStreams({});
    setRemoteMuted(false);
    setMutedUserIds([]);
    setMicMuted(false);
    setCameraOff(false);
    setConnectionState("new");
    setCall(null);
  }, []);

  // Writes the call history bubble. Only the caller does this, so a call
  // never produces two log messages.
  const reportCall = useCallback((status) => {
    const activeCall = callRef.current;

    if (!activeCall || activeCall.direction !== "outgoing") {
      return;
    }

    // Somebody who joined a running group call isn't its author, so they
    // shouldn't write the history bubble.
    if (activeCall.isGroup && !activeCall.isInitiator) {
      return;
    }

    if (!activeCall.chatId) {
      return;
    }

    if (loggedCallIdRef.current === activeCall.id) {
      return;
    }

    loggedCallIdRef.current = activeCall.id;

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const duration = activeCall.startedAt
      ? Math.max(0, Math.round((Date.now() - activeCall.startedAt) / 1000))
      : 0;

    logCallAPI(
      {
        chatId: activeCall.chatId,
        callType: activeCall.type,
        status,
        duration,
      },
      {
        Authorization: `Bearer ${token}`,
      },
    ).catch(() => {
      // Call history is best-effort; the call itself already ended.
    });
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId, callId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("call:ice", {
            callId,
            toUserId: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;

        if (stream) {
          setRemoteStream(stream);
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);

        if (pc.connectionState === "failed") {
          toast.error("Call connection lost");
          reportCall(callRef.current?.startedAt ? "completed" : "missed");
          cleanup();
        }
      };

      pcRef.current = pc;

      return pc;
    },
    [socket, cleanup, reportCall],
  );

  const getLocalMedia = useCallback(async (type) => {
    const wantsVideo = type === "video";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: wantsVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraOff(wantsVideo && stream.getVideoTracks().length === 0);

      return stream;
    } catch (error) {
      if (!wantsVideo) {
        throw error;
      }

      // A missing, busy, or blocked camera shouldn't kill the call. Fall back
      // to audio so the other side still connects and the conversation works.
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = audioStream;
      setLocalStream(audioStream);
      setCameraOff(true);

      const cameraBlocked =
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError";

      toast.error(
        cameraBlocked
          ? "Camera permission denied — continuing with audio only."
          : "Camera unavailable — continuing with audio only.",
        { duration: 6000 },
      );

      return audioStream;
    }
  }, []);

  // One peer connection per other participant. Whoever joins an ongoing call
  // sends the offers; everyone already there just answers.
  const ensureGroupPeer = useCallback(
    (peerId, callId) => {
      const id = String(peerId);
      const existing = groupPcRef.current.get(id);

      if (existing) {
        return existing;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("groupCall:ice", {
            callId,
            toUserId: id,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;

        if (stream) {
          setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
        }
      };

      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      groupPcRef.current.set(id, pc);

      return pc;
    },
    [socket],
  );

  const endCall = useCallback(
    ({ notifyRemote = true, status } = {}) => {
      const activeCall = callRef.current;
      const callId = callIdRef.current || activeCall?.id;

      if (activeCall?.isGroup) {
        const finalStatus =
          status ||
          (activeCall.startedAt
            ? (activeCall.participants || []).length > 1
              ? "completed"
              : "cancelled"
            : activeCall.isInitiator
              ? "cancelled"
              : null);

        if (finalStatus) {
          reportCall(finalStatus);
        }

        // Leaving never hangs up on the rest of the group — the call keeps
        // going until the last participant leaves.
        if (notifyRemote && socket && callId) {
          socket.emit("groupCall:leave", { callId });
        }

        cleanup();
        return;
      }

      const remoteId = remoteUserIdRef.current || activeCall?.remoteUser?.id;

      if (activeCall) {
        const finalStatus =
          status ||
          (activeCall.startedAt
            ? "completed"
            : activeCall.direction === "outgoing"
              ? "cancelled"
              : null);

        if (finalStatus) {
          reportCall(finalStatus);
        }
      }

      if (notifyRemote && socket && callId && remoteId) {
        socket.emit("call:end", { callId, toUserId: String(remoteId) });
      }

      cleanup();
    },
    [socket, cleanup, reportCall],
  );

  const startCall = useCallback(
    async ({
      userId,
      name,
      username,
      profilePicture,
      chatId,
      type = "audio",
    }) => {
      if (!socket?.connected) {
        toast.error("Still connecting — try again in a second");
        return;
      }

      if (!userId) {
        toast.error("This contact can't be called");
        return;
      }

      if (callRef.current) {
        toast.error("You're already in a call");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Calling isn't supported in this browser");
        return;
      }

      const callId = `${user?._id || "me"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      callIdRef.current = callId;
      remoteUserIdRef.current = String(userId);
      loggedCallIdRef.current = null;

      setCall({
        id: callId,
        type: type === "video" ? "video" : "audio",
        direction: "outgoing",
        status: "ringing",
        remoteUser: {
          id: String(userId),
          name: name || "Unknown",
          username: username || "",
          profilePicture: profilePicture || "",
        },
        chatId: chatId || null,
        startedAt: null,
      });

      try {
        const stream = await getLocalMedia(type);
        const pc = createPeerConnection(String(userId), callId);

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch (error) {
        toast.error(describeMediaError(error, type));
        cleanup();
        return;
      }

      socket.emit("call:start", {
        toUserId: String(userId),
        chatId: chatId || null,
        callType: type === "video" ? "video" : "audio",
        callId,
      });

      ringTimeoutRef.current = setTimeout(() => {
        toast("No answer", { icon: "📴" });
        endCall({ status: "missed" });
      }, RING_TIMEOUT_MS);
    },
    [socket, user, getLocalMedia, createPeerConnection, cleanup, endCall],
  );

  const startGroupCall = useCallback(
    async ({ chatId, name, type = "audio" }) => {
      if (!socket?.connected) {
        toast.error("Still connecting — try again in a second");
        return;
      }

      if (!chatId) {
        toast.error("Can't start a call here");
        return;
      }

      if (callRef.current) {
        toast.error("You're already in a call");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Calling isn't supported in this browser");
        return;
      }

      const callId = `group-${user?._id || "me"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      callIdRef.current = callId;
      remoteUserIdRef.current = null;
      loggedCallIdRef.current = null;

      setCall({
        id: callId,
        type: type === "video" ? "video" : "audio",
        direction: "outgoing",
        status: "connecting",
        isGroup: true,
        isInitiator: true,
        groupName: name || "Group call",
        chatId,
        remoteUser: null,
        participants: [],
        startedAt: null,
      });

      try {
        await getLocalMedia(type);
      } catch (error) {
        toast.error(describeMediaError(error, type));
        cleanup();
        return;
      }

      socket.emit("groupCall:start", {
        chatId,
        callType: type === "video" ? "video" : "audio",
        callId,
      });
    },
    [socket, user, getLocalMedia, cleanup],
  );

  const joinGroupCall = useCallback(
    async ({ callId, chatId, name, type = "audio" }) => {
      if (!socket?.connected) {
        toast.error("Still connecting — try again in a second");
        return;
      }

      if (!callId) {
        toast.error("That call has ended");
        return;
      }

      const activeCall = callRef.current;
      const isAnsweringRing =
        activeCall?.isGroup &&
        activeCall.id === callId &&
        activeCall.status === "ringing";

      if (activeCall && !isAnsweringRing) {
        toast.error("You're already in a call");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Calling isn't supported in this browser");
        return;
      }

      const mediaType = isAnsweringRing ? activeCall.type : type;

      callIdRef.current = callId;
      remoteUserIdRef.current = null;
      loggedCallIdRef.current = null;

      setCall({
        id: callId,
        type: mediaType === "video" ? "video" : "audio",
        direction: "incoming",
        status: "connecting",
        isGroup: true,
        isInitiator: false,
        groupName: name || activeCall?.groupName || "Group call",
        chatId: chatId || activeCall?.chatId || null,
        remoteUser: activeCall?.remoteUser || null,
        participants: [],
        startedAt: null,
      });

      try {
        await getLocalMedia(mediaType);
      } catch (error) {
        toast.error(describeMediaError(error, mediaType));
        cleanup();
        return;
      }

      socket.emit("groupCall:join", { callId });
    },
    [socket, getLocalMedia, cleanup],
  );

  const acceptCall = useCallback(async () => {
    const activeCall = callRef.current;

    if (!activeCall || activeCall.direction !== "incoming") {
      return;
    }

    if (!socket?.connected) {
      toast.error("Still connecting — try again in a second");
      return;
    }

    if (activeCall.isGroup) {
      await joinGroupCall({
        callId: activeCall.id,
        chatId: activeCall.chatId,
        name: activeCall.groupName,
        type: activeCall.type,
      });

      return;
    }

    const remoteId = String(activeCall.remoteUser.id);
    const callId = activeCall.id;

    // Show progress while the browser asks for camera/microphone permission.
    setCall((prev) => (prev ? { ...prev, status: "connecting" } : prev));

    try {
      const stream = await getLocalMedia(activeCall.type);
      const pc = createPeerConnection(remoteId, callId);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (error) {
      toast.error(describeMediaError(error, activeCall.type));
      socket?.emit("call:reject", { callId, toUserId: remoteId });
      cleanup();
      return;
    }

    socket?.emit("call:accept", { callId, toUserId: remoteId });
  }, [socket, getLocalMedia, createPeerConnection, cleanup, joinGroupCall]);

  const rejectCall = useCallback(() => {
    const activeCall = callRef.current;

    if (!activeCall) {
      return;
    }

    if (activeCall.isGroup) {
      if (activeCall.status === "ringing") {
        socket?.emit("groupCall:decline", { callId: activeCall.id });
      } else if (callIdRef.current) {
        socket?.emit("groupCall:leave", { callId: callIdRef.current });
      }

      cleanup();
      return;
    }

    socket?.emit("call:reject", {
      callId: activeCall.id,
      toUserId: String(activeCall.remoteUser.id),
    });

    cleanup();
  }, [socket, cleanup]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks?.()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;

    const mutedNow = !track.enabled;
    setMicMuted(mutedNow);

    // Tell the other side so they can show the muted badge.
    const activeCall = callRef.current;
    const callId = callIdRef.current;

    if (!socket || !activeCall || !callId) {
      return;
    }

    if (activeCall.isGroup) {
      socket.emit("groupCall:mute", { callId, muted: mutedNow });
    } else if (remoteUserIdRef.current) {
      socket.emit("call:mute", {
        callId,
        toUserId: String(remoteUserIdRef.current),
        muted: mutedNow,
      });
    }
  }, [socket]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks?.()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const flushCandidates = async (pc) => {
      for (const candidate of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // A candidate can fail if the connection already moved on.
        }
      }

      pendingCandidatesRef.current = [];
    };

    const handleIncoming = ({
      callId,
      fromUserId,
      fromName,
      fromUsername,
      fromProfilePicture,
      callType,
      chatId,
    }) => {
      if (!callId || !fromUserId) {
        return;
      }

      // Already busy — decline so the caller isn't left ringing.
      if (callRef.current) {
        socket.emit("call:reject", {
          callId,
          toUserId: String(fromUserId),
        });

        return;
      }

      callIdRef.current = callId;
      remoteUserIdRef.current = String(fromUserId);

      setCall({
        id: callId,
        type: callType === "video" ? "video" : "audio",
        direction: "incoming",
        status: "ringing",
        remoteUser: {
          id: String(fromUserId),
          name: fromName || "Unknown",
          username: fromUsername || "",
          profilePicture: fromProfilePicture || "",
        },
        chatId: chatId || null,
        startedAt: null,
      });
    };

    const handleAccepted = async ({ callId }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        return;
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId,
          toUserId: remoteUserIdRef.current,
          sdp: pc.localDescription,
        });
      } catch {
        toast.error("Could not start the call");
        endCall();
      }
    };

    const handleOffer = async ({ callId, sdp }) => {
      if (callId !== callIdRef.current || !sdp) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("call:answer", {
          callId,
          toUserId: remoteUserIdRef.current,
          sdp: pc.localDescription,
        });

        setCall((prev) =>
          prev ? { ...prev, status: "active", startedAt: Date.now() } : prev,
        );
      } catch {
        toast.error("Could not connect the call");
        endCall();
      }
    };

    const handleAnswer = async ({ callId, sdp }) => {
      if (callId !== callIdRef.current || !sdp) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(pc);

        setCall((prev) =>
          prev ? { ...prev, status: "active", startedAt: Date.now() } : prev,
        );
      } catch {
        toast.error("Could not connect the call");
        endCall();
      }
    };

    const handleIce = async ({ callId, candidate }) => {
      if (callId !== callIdRef.current || !candidate) {
        return;
      }

      const pc = pcRef.current;

      if (!pc) {
        return;
      }

      if (!pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore late/duplicate candidates.
      }
    };

    const handleRemoteMuted = ({ callId, muted }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      setRemoteMuted(Boolean(muted));
    };

    const handleRejected = ({ callId }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      toast("Call declined", { icon: "📵" });
      reportCall("declined");
      cleanup();
    };

    const handleEnded = ({ callId }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      const activeCall = callRef.current;

      if (activeCall && !activeCall.startedAt) {
        toast("Call ended before it connected", { icon: "📴" });
      }

      if (activeCall?.direction === "outgoing") {
        reportCall(activeCall.startedAt ? "completed" : "missed");
      }

      cleanup();
    };

    const handleFailed = ({ callId, reason }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      const messages = {
        offline: "They're offline right now",
        busy: "They're on another call",
        blocked: "This contact can't be called",
        error: "Call failed",
      };

      toast.error(messages[reason] || "Call failed");
      cleanup();
    };

    // ---- Group calls ----------------------------------------------------

    const flushGroupCandidates = async (peerId, pc) => {
      const queued = groupPendingCandidatesRef.current.get(peerId) || [];

      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // A candidate can fail once the connection moved on.
        }
      }

      groupPendingCandidatesRef.current.delete(peerId);
    };

    const handleGroupIncoming = ({
      callId,
      chatId,
      callType,
      groupName,
      fromUserId,
      fromName,
      fromUsername,
      fromProfilePicture,
      participantCount,
    }) => {
      if (!callId || !fromUserId) {
        return;
      }

      // Already busy — politely decline so the caller's roster stays honest.
      if (callRef.current) {
        socket.emit("groupCall:decline", { callId });
        return;
      }

      callIdRef.current = callId;
      remoteUserIdRef.current = null;

      setCall({
        id: callId,
        type: callType === "video" ? "video" : "audio",
        direction: "incoming",
        status: "ringing",
        isGroup: true,
        isInitiator: false,
        groupName: groupName || "Group call",
        chatId: chatId || null,
        remoteUser: {
          id: String(fromUserId),
          name: fromName || "Unknown",
          username: fromUsername || "",
          profilePicture: fromProfilePicture || "",
        },
        participants: [],
        participantCount: participantCount || 0,
        startedAt: null,
      });
    };

    const handleGroupParticipants = async ({
      callId,
      chatId,
      callType,
      initiatorId,
      mutedUserIds = [],
      participants = [],
    }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup) {
        return;
      }

      callIdRef.current = callId;

      const roster = participants.map((participant) => ({
        ...participant,
        id: String(participant.id),
      }));

      const myId = String(user?._id || "");
      const iAmInitiator = initiatorId
        ? String(initiatorId) === myId
        : Boolean(activeCall.isInitiator);

      setMutedUserIds(mutedUserIds.map(String));

      setCall((prev) =>
        prev && prev.isGroup
          ? {
              ...prev,
              id: callId,
              chatId: chatId || prev.chatId,
              type: callType === "video" ? "video" : "audio",
              isInitiator: iAmInitiator,
              direction: iAmInitiator ? "outgoing" : prev.direction,
              participants: roster,
              status: "active",
              startedAt: prev.startedAt || Date.now(),
            }
          : prev,
      );

      const others = roster.filter(
        (participant) => participant.id !== myId,
      );

      // Whoever arrives offers to everyone who is already connected; those
      // users only answer, so the two sides never offer at the same time.
      for (const participant of others) {
        if (groupPcRef.current.has(participant.id)) {
          continue;
        }

        try {
          const pc = ensureGroupPeer(participant.id, callId);
          const offer = await pc.createOffer();

          await pc.setLocalDescription(offer);

          socket.emit("groupCall:offer", {
            callId,
            toUserId: participant.id,
            sdp: pc.localDescription,
          });
        } catch {
          // The next roster update retries.
        }
      }
    };

    const handleGroupParticipantJoined = ({ callId, user: participant }) => {
      const activeCall = callRef.current;

      if (
        !activeCall?.isGroup ||
        callId !== callIdRef.current ||
        !participant?.id
      ) {
        return;
      }

      const id = String(participant.id);

      setCall((prev) => {
        if (!prev?.isGroup) {
          return prev;
        }

        if (
          (prev.participants || []).some(
            (existing) => String(existing.id) === id,
          )
        ) {
          return prev;
        }

        return {
          ...prev,
          participants: [
            ...(prev.participants || []),
            { ...participant, id },
          ],
        };
      });
    };

    const handleGroupParticipantLeft = ({ callId, userId: leftId }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup || callId !== callIdRef.current || !leftId) {
        return;
      }

      const id = String(leftId);
      const pc = groupPcRef.current.get(id);

      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;

        try {
          pc.close();
        } catch {
          // Already closed.
        }

        groupPcRef.current.delete(id);
      }

      groupPendingCandidatesRef.current.delete(id);

      setMutedUserIds((prev) => prev.filter((mutedId) => mutedId !== id));

      setRemoteStreams((prev) => {
        if (!(id in prev)) {
          return prev;
        }

        const next = { ...prev };
        delete next[id];
        return next;
      });

      setCall((prev) =>
        prev?.isGroup
          ? {
              ...prev,
              participants: (prev.participants || []).filter(
                (participant) => String(participant.id) !== id,
              ),
            }
          : prev,
      );
    };

    const handleGroupOffer = async ({ callId, fromUserId, sdp }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup || !sdp || !fromUserId) {
        return;
      }

      const peerId = String(fromUserId);

      try {
        const pc = ensureGroupPeer(peerId, callId);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushGroupCandidates(peerId, pc);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socket.emit("groupCall:answer", {
          callId,
          toUserId: peerId,
          sdp: pc.localDescription,
        });
      } catch {
        // Ignore a duplicate or stale offer.
      }
    };

    const handleGroupAnswer = async ({ fromUserId, sdp }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup || !sdp || !fromUserId) {
        return;
      }

      const peerId = String(fromUserId);
      const pc = groupPcRef.current.get(peerId);

      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushGroupCandidates(peerId, pc);

        setCall((prev) =>
          prev?.isGroup
            ? {
                ...prev,
                status: "active",
                startedAt: prev.startedAt || Date.now(),
              }
            : prev,
        );
      } catch {
        // Ignore a duplicate answer.
      }
    };

    const handleGroupIce = async ({ fromUserId, candidate }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup || !candidate || !fromUserId) {
        return;
      }

      const peerId = String(fromUserId);
      const pc = groupPcRef.current.get(peerId);

      if (!pc || !pc.remoteDescription) {
        const queued =
          groupPendingCandidatesRef.current.get(peerId) || [];

        queued.push(candidate);
        groupPendingCandidatesRef.current.set(peerId, queued);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Late candidate.
      }
    };

    const handleGroupMuted = ({ callId, userId: mutedId, muted }) => {
      if (callId !== callIdRef.current || !mutedId) {
        return;
      }

      const id = String(mutedId);

      setMutedUserIds((prev) => {
        const without = prev.filter((mutedUserId) => mutedUserId !== id);

        return muted ? [...without, id] : without;
      });
    };

    const handleGroupEnded = ({ callId }) => {
      const activeCall = callRef.current;

      if (!activeCall?.isGroup || callId !== callIdRef.current) {
        return;
      }

      if (activeCall.isInitiator && activeCall.startedAt) {
        reportCall("completed");
      }

      toast("Group call ended", { icon: "📴" });
      cleanup();
    };

    const handleGroupFailed = ({ callId, reason }) => {
      if (callId !== callIdRef.current) {
        return;
      }

      const messages = {
        busy: "You're already in a call",
        "not-member": "You're not a member of this group",
        "not-found": "That group is no longer available",
        ended: "That call has ended",
        error: "Could not start the call",
      };

      toast.error(messages[reason] || "Call failed");
      cleanup();
    };

    const handleGroupState = ({
      chatId,
      callId,
      callType,
      active,
      participantCount,
    }) => {
      if (!chatId) {
        return;
      }

      const key = String(chatId);

      setGroupCallStates((prev) => {
        const next = { ...prev };

        if (active && participantCount > 0) {
          next[key] = { callId, callType, participantCount };
        } else {
          delete next[key];
        }

        return next;
      });

      const activeCall = callRef.current;

      // The server ended our call (everyone else left).
      if (
        !active &&
        activeCall?.isGroup &&
        String(activeCall.chatId) === key
      ) {
        cleanup();
      }
    };

    const handleDisconnect = () => {
      cleanup();
      setGroupCallStates({});
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:muted", handleRemoteMuted);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("call:handled", handleEnded);
    socket.on("call:failed", handleFailed);
    socket.on("groupCall:incoming", handleGroupIncoming);
    socket.on("groupCall:participants", handleGroupParticipants);
    socket.on("groupCall:participantJoined", handleGroupParticipantJoined);
    socket.on("groupCall:participantLeft", handleGroupParticipantLeft);
    socket.on("groupCall:offer", handleGroupOffer);
    socket.on("groupCall:answer", handleGroupAnswer);
    socket.on("groupCall:ice", handleGroupIce);
    socket.on("groupCall:muted", handleGroupMuted);
    socket.on("groupCall:ended", handleGroupEnded);
    socket.on("groupCall:failed", handleGroupFailed);
    socket.on("groupCall:state", handleGroupState);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:muted", handleRemoteMuted);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("call:handled", handleEnded);
      socket.off("call:failed", handleFailed);
      socket.off("groupCall:incoming", handleGroupIncoming);
      socket.off("groupCall:participants", handleGroupParticipants);
      socket.off(
        "groupCall:participantJoined",
        handleGroupParticipantJoined,
      );
      socket.off("groupCall:participantLeft", handleGroupParticipantLeft);
      socket.off("groupCall:offer", handleGroupOffer);
      socket.off("groupCall:answer", handleGroupAnswer);
      socket.off("groupCall:ice", handleGroupIce);
      socket.off("groupCall:muted", handleGroupMuted);
      socket.off("groupCall:ended", handleGroupEnded);
      socket.off("groupCall:failed", handleGroupFailed);
      socket.off("groupCall:state", handleGroupState);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, cleanup, endCall, reportCall, ensureGroupPeer, user?._id]);

  // Never leave the mic/camera on if the page is closed mid-call.
  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <CallContext.Provider
      value={{
        call,
        localStream,
        remoteStream,
        remoteStreams,
        groupCallStates,
        remoteMuted,
        mutedUserIds,
        micMuted,
        cameraOff,
        connectionState,
        startCall,
        startGroupCall,
        joinGroupCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);

export default CallContext;
