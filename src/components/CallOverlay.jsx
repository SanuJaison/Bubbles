import { useEffect, useRef, useState } from "react";

import {
  LuMic,
  LuMicOff,
  LuPhone,
  LuPhoneOff,
  LuUsers,
  LuVideo,
  LuVideoOff,
} from "react-icons/lu";

import defaultProfile from "../assets/profileImage.png";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext";
import { formatVoiceDuration } from "../utils/voice";

// One grid tile. The <video> stays mounted for voice calls too — it is what
// actually plays the other person's audio.
const ParticipantTile = ({
  participant,
  stream,
  isVideo,
  isSelf,
  cameraOff,
  muted,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  const showVideo = isVideo && Boolean(stream) && !(isSelf && cameraOff);

  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className={
          showVideo
            ? "h-full w-full bg-black object-cover"
            : "pointer-events-none absolute h-px w-px opacity-0"
        }
      />

      {!showVideo && (
        <img
          src={participant.profilePicture || defaultProfile}
          alt={participant.name || "Participant"}
          className="h-16 w-16 rounded-full border border-white/25 object-cover"
        />
      )}

      <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
        {isSelf ? `${participant.name || "You"} (you)` : participant.name}
      </span>

      {muted && (
        <span
          title="Muted"
          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"
        >
          <LuMicOff className="text-xs" />
        </span>
      )}
    </div>
  );
};

const CallOverlay = () => {
  const {
    call,
    localStream,
    remoteStream,
    remoteStreams,
    remoteMuted,
    mutedUserIds,
    micMuted,
    cameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  } = useCall();

  const { user } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());

  // The local <video> only exists once a video call is live, so the effect
  // that attaches the stream has to re-run when it mounts — otherwise the
  // self-view stays black.
  const isVideoActive = call?.type === "video" && call?.status === "active";
  const showLocalVideo =
    call?.type === "video" && (isVideoActive || Boolean(localStream));

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream, call?.id, showLocalVideo]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream, call?.id, call?.status]);

  useEffect(() => {
    if (!call?.startedAt) {
      return undefined;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [call?.startedAt]);

  // Derived (not stored) so the effect above never has to setState directly.
  const elapsed = call?.startedAt
    ? Math.max(0, Math.floor((now - call.startedAt) / 1000))
    : 0;

  if (!call) {
    return null;
  }

  const isVideo = call.type === "video";
  const isActive = call.status === "active";
  const isIncoming = call.direction === "incoming" && call.status === "ringing";
  const remoteUser = call.remoteUser || {};
  const avatar = remoteUser.profilePicture || defaultProfile;

  const statusLabel = isActive
    ? formatVoiceDuration(elapsed)
    : isIncoming
      ? `Incoming ${isVideo ? "video" : "voice"} call`
      : call.status === "connecting"
        ? "Connecting…"
        : "Ringing…";

  const controlButton =
    "w-14 h-14 rounded-full flex items-center justify-center text-xl transition disabled:opacity-50";

  // ---- Group call --------------------------------------------------------

  if (call.isGroup) {
    const roster = call.participants || [];
    const myId = String(user?._id || "");
    const selfEntry = roster.find(
      (participant) => String(participant.id) === myId,
    ) || {
      id: myId,
      name: user?.name || "You",
      profilePicture: user?.profilePicture || "",
    };

    const displayRoster = roster.length > 0 ? roster : [selfEntry];

    const columnClass =
      displayRoster.length === 1
        ? "grid-cols-1 max-w-md"
        : displayRoster.length <= 4
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-2 lg:grid-cols-3";

    return (
      <div className="fixed inset-0 z-[300] flex flex-col bg-[#120c22]/95 backdrop-blur-xl text-white">
        <header className="relative z-10 flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {call.groupName || "Group call"}
            </h2>

            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/65">
              <LuUsers className="shrink-0" />

              {isIncoming
                ? `${remoteUser.name || "Someone"} started a ${
                    isVideo ? "video" : "voice"
                  } call`
                : `${displayRoster.length} in call${
                    isActive ? ` · ${formatVoiceDuration(elapsed)}` : ""
                  }`}
            </p>
          </div>

          {call.status === "connecting" && (
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/75">
              Connecting…
            </span>
          )}
        </header>

        {isIncoming ? (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-40 w-40 animate-ping rounded-full bg-white/10" />
              <span className="absolute h-52 w-52 animate-pulse rounded-full bg-white/5" />

              <img
                src={avatar}
                alt={remoteUser.name || "Contact"}
                className="relative h-28 w-28 rounded-full border-2 border-white/30 object-cover shadow-2xl"
              />
            </div>

            <h3 className="mt-6 text-2xl font-semibold">
              {remoteUser.name || "Someone"}
            </h3>

            <p className="mt-2 text-sm text-white/75">
              {call.groupName || "Group call"} ·{" "}
              {call.participantCount || 0} people
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div
              className={`mx-auto grid w-full max-w-5xl gap-3 ${columnClass}`}
            >
              {displayRoster.map((participant) => {
                const isSelf = String(participant.id) === myId;
                const participantMuted = isSelf
                  ? micMuted
                  : mutedUserIds.includes(String(participant.id));

                return (
                  <ParticipantTile
                    key={participant.id}
                    participant={participant}
                    stream={
                      isSelf
                        ? localStream
                        : remoteStreams[String(participant.id)]
                    }
                    isVideo={isVideo}
                    isSelf={isSelf}
                    cameraOff={cameraOff}
                    muted={participantMuted}
                  />
                );
              })}
            </div>

            {displayRoster.length <= 1 && (
              <p className="mt-4 text-center text-sm text-white/60">
                Waiting for others to join…
              </p>
            )}
          </div>
        )}

        <div className="relative z-10 flex items-center justify-center gap-4 pb-10 pt-4 sm:gap-6">
          {isIncoming ? (
            <>
              <button
                type="button"
                onClick={rejectCall}
                title="Decline"
                className={`${controlButton} bg-red-500 hover:bg-red-600 shadow-lg`}
              >
                <LuPhoneOff />
              </button>

              <button
                type="button"
                onClick={acceptCall}
                title="Join call"
                className={`${controlButton} bg-green-500 hover:bg-green-600 shadow-lg`}
              >
                {isVideo ? <LuVideo /> : <LuPhone />}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMic}
                title={micMuted ? "Unmute microphone" : "Mute microphone"}
                className={`${controlButton} ${
                  micMuted
                    ? "bg-[#f4f0ff] text-[#2b2440] ring-2 ring-white/40"
                    : "bg-white/15 hover:bg-white/25"
                }`}
              >
                {micMuted ? <LuMicOff /> : <LuMic />}
              </button>

              {isVideo && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  title={cameraOff ? "Turn camera on" : "Turn camera off"}
                  className={`${controlButton} ${
                    cameraOff
                      ? "bg-[#f4f0ff] text-[#2b2440] ring-2 ring-white/40"
                      : "bg-white/15 hover:bg-white/25"
                  }`}
                >
                  {cameraOff ? <LuVideoOff /> : <LuVideo />}
                </button>
              )}

              <button
                type="button"
                onClick={() => endCall()}
                title="Leave call"
                className={`${controlButton} bg-red-500 hover:bg-red-600 shadow-lg`}
              >
                <LuPhoneOff />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- One-to-one call ----------------------------------------------------

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#120c22]/95 backdrop-blur-xl text-white">
      {/* Remote media. Kept mounted for audio calls too, since that element is
          what actually plays the other person's voice. */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={
          isVideo && isActive
            ? "absolute inset-0 h-full w-full bg-black object-cover"
            : "pointer-events-none absolute h-px w-px opacity-0"
        }
      />

      {showLocalVideo && (
        <div className="absolute bottom-28 right-4 z-20 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-xl sm:bottom-32 sm:right-6 sm:h-48 sm:w-36">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {micMuted && (
            <span
              title="You're muted"
              className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white"
            >
              <LuMicOff className="text-sm" />
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {!(isVideo && isActive) && (
          <div className="relative flex items-center justify-center">
            {!isActive && (
              <>
                <span className="absolute h-40 w-40 animate-ping rounded-full bg-white/10" />
                <span className="absolute h-52 w-52 animate-pulse rounded-full bg-white/5" />
              </>
            )}

            <img
              src={avatar}
              alt={remoteUser.name || "Contact"}
              className="relative h-28 w-28 rounded-full border-2 border-white/30 object-cover shadow-2xl"
            />
          </div>
        )}

        <h2 className="mt-6 text-2xl font-semibold">
          {remoteUser.name || "Unknown"}
        </h2>

        {remoteUser.username && (
          <p className="text-sm text-white/60">@{remoteUser.username}</p>
        )}

        <p className="mt-2 text-sm text-white/80">
          {statusLabel}
          {isVideo && isActive && (
            <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {formatVoiceDuration(elapsed)}
            </span>
          )}
        </p>

        {isActive && remoteMuted && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/90">
            <LuMicOff />
            {isVideo ? "Muted" : `${remoteUser.name || "They"}'s mic is off`}
          </span>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-center gap-4 pb-12 sm:gap-6">
        {isIncoming ? (
          <>
            <button
              type="button"
              onClick={rejectCall}
              title="Decline"
              className={`${controlButton} bg-red-500 hover:bg-red-600 shadow-lg`}
            >
              <LuPhoneOff />
            </button>

            <button
              type="button"
              onClick={acceptCall}
              title="Accept"
              className={`${controlButton} bg-green-500 hover:bg-green-600 shadow-lg`}
            >
              {isVideo ? <LuVideo /> : <LuPhone />}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMic}
              title={micMuted ? "Unmute microphone" : "Mute microphone"}
              className={`${controlButton} ${
                micMuted ? "bg-[#f4f0ff] text-[#2b2440] ring-2 ring-white/40" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              {micMuted ? <LuMicOff /> : <LuMic />}
            </button>

            {call.type === "video" && (
              <button
                type="button"
                onClick={toggleCamera}
                title={cameraOff ? "Turn camera on" : "Turn camera off"}
                className={`${controlButton} ${
                  cameraOff
                    ? "bg-[#f4f0ff] text-[#2b2440] ring-2 ring-white/40"
                    : "bg-white/15 hover:bg-white/25"
                }`}
              >
                {cameraOff ? <LuVideoOff /> : <LuVideo />}
              </button>
            )}

            <button
              type="button"
              onClick={() => endCall()}
              title="End call"
              className={`${controlButton} bg-red-500 hover:bg-red-600 shadow-lg`}
            >
              <LuPhoneOff />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
