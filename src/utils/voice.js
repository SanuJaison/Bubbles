// Shared by the voice-note bubble, the call timer and the composer's
// recording indicator.
export const formatVoiceDuration = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default formatVoiceDuration;

/**
 * Decodes a recorded blob and reduces it to `buckets` normalised peaks
 * (0..1) — the same shape every client can draw without decoding the audio.
 * Returns [] if the browser can't decode it, and the bubble then falls back
 * to its synthetic waveform.
 */
export const extractWaveform = async (blob, buckets = 32) => {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass || !blob) {
      return [];
    }

    const audioContext = new AudioContextClass();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    audioContext.close().catch(() => {});

    const samples = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(samples.length / buckets));
    const peaks = [];

    for (let bucket = 0; bucket < buckets; bucket += 1) {
      const start = bucket * blockSize;
      const end = Math.min(samples.length, start + blockSize);
      let peak = 0;

      for (let index = start; index < end; index += 1) {
        const value = Math.abs(samples[index]);

        if (value > peak) {
          peak = value;
        }
      }

      peaks.push(peak);
    }

    const loudest = Math.max(...peaks, 0.01);

    return peaks.map((peak) => Number((peak / loudest).toFixed(3)));
  } catch {
    return [];
  }
};
