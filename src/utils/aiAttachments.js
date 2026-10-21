export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(blob);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image"));
    image.src = src;
  });

/**
 * Creates a small, persistent thumbnail for an image attachment. The full
 * image still goes to the AI provider; this is only for the chat bubble and
 * localStorage.
 */
export const makeImagePreview = async (file, maxSize = 720) => {
  if (!file?.type?.startsWith("image/")) {
    return "";
  }

  try {
    const source = await blobToDataUrl(file);
    const image = await loadImage(source);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      return "";
    }

    const scale = Math.min(1, maxSize / Math.max(width, height));
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      return "";
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return "";
  }
};

const waitForEvent = (target, eventName, timeoutMs = 6000) =>
  new Promise((resolve, reject) => {
    let timer;

    const cleanup = () => {
      target.removeEventListener(eventName, handleEvent);
      target.removeEventListener("error", handleError);
      clearTimeout(timer);
    };

    const handleEvent = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("The video could not be loaded"));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("The video took too long to load"));
    }, timeoutMs);

    target.addEventListener(eventName, handleEvent, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Samples a few frames from a video in the browser. No ffmpeg or server-side
 * video processing is required, and the frames travel to the vision model as
 * normal JPEG images.
 */
export const extractVideoFrames = async (file, count = 3) => {
  if (!file?.type?.startsWith("video/")) {
    return [];
  }

  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  const baseName = (file.name || "video").replace(/\.[^.]+$/, "");

  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  };

  try {
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    await waitForEvent(video, "loadedmetadata");

    const duration = Number(video.duration);

    if (
      (!Number.isFinite(duration) || duration <= 0) &&
      video.readyState < 2
    ) {
      await waitForEvent(video, "loadeddata");
    }

    const ratios = [0.12, 0.5, 0.88].slice(0, count);
    const times = Number.isFinite(duration) && duration > 0
      ? ratios.map((ratio) =>
          Math.min(
            Math.max(0.03, duration * ratio),
            Math.max(0.03, duration - 0.08),
          ),
        )
      : [0];

    const frames = [];

    for (let index = 0; index < times.length; index += 1) {
      if (times[index] > 0) {
        video.currentTime = times[index];
        await waitForEvent(video, "seeked");
      } else if (video.readyState < 2) {
        await waitForEvent(video, "loadeddata");
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        continue;
      }

      const scale = Math.min(1, 960 / Math.max(width, height));
      const canvas = document.createElement("canvas");

      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        continue;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const blob = await dataUrlToBlob(dataUrl);

      frames.push({
        blob,
        dataUrl,
        name: `${baseName}-frame-${index + 1}.jpg`,
        type: "image/jpeg",
      });
    }

    return frames;
  } catch {
    return [];
  } finally {
    cleanup();
  }
};

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
