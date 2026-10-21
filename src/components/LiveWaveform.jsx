import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 30;

// Roughly 14 samples a second reads like WhatsApp's live meter without
// flooding React with renders.
const SAMPLE_INTERVAL_MS = 70;

const SILENT_HEIGHT = 8;

/**
 * Live microphone level meter for the composer.
 *
 * The analyser is sampled on its own animation frame and the bars live in
 * local state, so the chat behind it never re-renders while recording.
 */
const LiveWaveform = ({ analyser, className = "" }) => {
  const [bars, setBars] = useState(() => Array(BAR_COUNT).fill(0));
  const frameRef = useRef(null);

  useEffect(() => {
    if (!analyser) {
      return undefined;
    }

    const samples = new Uint8Array(analyser.fftSize);
    let lastSampleAt = 0;

    const tick = (time) => {
      frameRef.current = requestAnimationFrame(tick);

      if (time - lastSampleAt < SAMPLE_INTERVAL_MS) {
        return;
      }

      lastSampleAt = time;

      analyser.getByteTimeDomainData(samples);

      // RMS of the waveform is the "loudness" of this slice; the curve just
      // lifts quiet speech so the bars react visibly.
      let sum = 0;

      for (let index = 0; index < samples.length; index += 1) {
        const value = (samples[index] - 128) / 128;
        sum += value * value;
      }

      const rms = Math.sqrt(sum / samples.length);
      const level = Math.min(1, Math.pow(rms * 3.4, 0.75));

      setBars((prev) => [...prev.slice(1), level]);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [analyser]);

  return (
    <span
      className={`flex flex-1 items-center gap-[2px] h-6 overflow-hidden ${className}`}
    >
      {bars.map((level, index) => (
        <span
          key={index}
          style={{ height: `${Math.max(SILENT_HEIGHT, level * 100)}%` }}
          className="flex-1 min-w-[2px] rounded-full bg-brand-400"
        />
      ))}
    </span>
  );
};

export default LiveWaveform;
