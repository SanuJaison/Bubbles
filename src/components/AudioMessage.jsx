import { useEffect, useMemo, useRef, useState } from "react";

import { LuPause, LuPlay } from "react-icons/lu";

import { formatVoiceDuration } from "../utils/voice";

// Only one voice note should ever play at a time, and the registry survives
// re-renders of the message list.
let activeAudio = null;

const SPEEDS = [1, 1.5, 2];

const BAR_COUNT = 32;

// A deterministic pseudo-waveform so each note looks distinct but never
// changes between renders.
const buildBars = (seedSource) => {
  const seed =
    (seedSource || "voice")
      .split("")
      .reduce((total, char) => (total + char.charCodeAt(0)) % 997, 17) || 17;

  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const wave = Math.abs(Math.sin(seed * 0.11 + index * 1.7));
    return 0.25 + wave * 0.75;
  });
};

const AudioMessage = ({ file, mine = false, pending = false }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number(file?.duration) || 0);
  const [speed, setSpeed] = useState(1);

  const bars = useMemo(() => {
    const stored = file?.waveform;

    // Voice notes carry their real peaks; older ones fall back to the
    // synthetic shape so they still look like voice notes.
    if (Array.isArray(stored) && stored.length > 1) {
      return stored.map((value) =>
        Math.min(1, Math.max(0.12, Number(value) || 0.12)),
      );
    }

    return buildBars(file?.url);
  }, [file?.waveform, file?.url]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    audio.playbackRate = speed;
  }, [speed]);

  useEffect(
    () => () => {
      if (activeAudio === audioRef.current) {
        activeAudio = null;
      }

      audioRef.current?.pause();
    },
    [],
  );

  const handleToggle = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      if (activeAudio && activeAudio !== audio) {
        activeAudio.pause();
      }

      activeAudio = audio;

      try {
        await audio.play();
      } catch {
        // Autoplay/buffering hiccups are not worth surfacing here.
      }
    } else {
      audio.pause();
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;

    if (!audio || !duration) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width) {
      return;
    }

    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );

    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const displayTime = currentTime > 0 ? currentTime : duration;

  return (
    <div
      className={`flex w-full min-w-0 max-w-[15rem] sm:max-w-[17rem] items-center gap-2 sm:gap-2.5 ${
        mine ? "text-white" : "text-ink"
      }`}
    >
      <audio
        ref={audioRef}
        src={file?.url}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const loaded = event.currentTarget.duration;

          if (Number.isFinite(loaded) && loaded > 0) {
            setDuration(loaded);
          }
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);

          if (activeAudio === audioRef.current) {
            activeAudio = null;
          }
        }}
      />

      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        title={playing ? "Pause" : "Play"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${
          mine
            ? "bg-white/25 hover:bg-white/35"
            : "bg-black/8 hover:bg-black/15 dark:bg-white/12 dark:hover:bg-white/20"
        }`}
      >
        {playing ? (
          <LuPause className="text-base" />
        ) : (
          <LuPlay className="text-base" />
        )}
      </button>

      <button
        type="button"
        onClick={handleSeek}
        title="Seek"
        className="flex h-8 min-w-0 flex-1 items-center gap-[2px]"
      >
        {bars.map((height, index) => {
          const barRatio = (index + 0.5) / BAR_COUNT;

          return (
            <span
              key={index}
              style={{ height: `${Math.round(height * 100)}%` }}
              className={`w-full rounded-full bg-current transition-opacity duration-150 ${
                barRatio <= progress ? "opacity-90" : "opacity-30"
              }`}
            />
          );
        })}
      </button>

      <span className="shrink-0 text-[11px] tabular-nums opacity-75">
        {formatVoiceDuration(displayTime)}
      </span>

      <button
        type="button"
        onClick={() =>
          setSpeed((prev) => SPEEDS[(SPEEDS.indexOf(prev) + 1) % SPEEDS.length])
        }
        title="Playback speed"
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition ${
          mine
            ? "bg-white/25 hover:bg-white/35"
            : "bg-black/8 hover:bg-black/15 dark:bg-white/12 dark:hover:bg-white/20"
        }`}
      >
        {speed}x
      </button>
    </div>
  );
};

export default AudioMessage;
