import { useCallback, useEffect, useRef, useState } from "react";

// Different browsers record to different containers; pick the first one this
// browser can actually produce (Chrome/Edge -> webm, Safari -> mp4).
const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  return (
    candidates.find(
      (type) =>
        typeof MediaRecorder.isTypeSupported !== "function" ||
        MediaRecorder.isTypeSupported(type),
    ) || ""
  );
};

const MAX_SECONDS = 300;

/**
 * Records a voice note with MediaRecorder.
 *
 * `onComplete({ blob, duration })` fires once recording stops normally —
 * cancelling never calls it, so the caller doesn't need to guard the send.
 *
 * The live level meter is exposed as `analyser` (an AnalyserNode fed by the
 * microphone) so the waveform can update itself without re-rendering the
 * whole chat.
 */
const useVoiceRecorder = ({ onComplete } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [analyser, setAnalyser] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep the latest callback without re-creating start/stop on every render.
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const teardown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAnalyser(null);
    setIsRecording(false);
    setSeconds(0);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    // Idle: only tear down if a (possibly aborted) session is still around.
    if (recorder || streamRef.current) {
      teardown();
    }
  }, [teardown]);

  const cancel = useCallback(() => {
    if (!recorderRef.current && !streamRef.current) {
      return;
    }

    cancelledRef.current = true;
    stop();
  }, [stop]);

  const clearError = useCallback(() => setError(""), []);

  const start = useCallback(async () => {
    setError("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Voice messages aren't supported in this browser");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      startedAtRef.current = Date.now();

      // Feed the live waveform. Deliberately not connected to the output —
      // routing the mic back to the speakers would cause feedback.
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          const node = audioContext.createAnalyser();

          node.fftSize = 1024;
          node.smoothingTimeConstant = 0.65;
          source.connect(node);

          // Safari starts the context suspended; a suspended graph would
          // report silence and the meter would sit flat.
          audioContext.resume?.().catch(() => {});

          audioContextRef.current = audioContext;
          setAnalyser(node);
        }
      } catch {
        // Metering is a nicety — recording still works without it.
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsed = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );

        const wasCancelled = cancelledRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });

        teardown();

        if (!wasCancelled && blob.size > 0) {
          onCompleteRef.current?.({ blob, duration: elapsed });
        }
      };

      recorder.start();

      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startedAtRef.current) / 1000,
        );

        setSeconds(elapsed);

        // Long enough — wrap up automatically.
        if (elapsed >= MAX_SECONDS) {
          stop();
        }
      }, 250);

      return true;
    } catch {
      setError("Microphone permission denied");
      teardown();
      return false;
    }
  }, [stop, teardown]);

  // Releasing the mic on unmount matters — otherwise the browser keeps
  // showing the "recording" indicator after navigating away.
  useEffect(() => () => teardown(), [teardown]);

  return {
    isRecording,
    seconds,
    error,
    analyser,
    start,
    stop,
    cancel,
    clearError,
  };
};

export default useVoiceRecorder;
