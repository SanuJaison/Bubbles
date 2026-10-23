const DEVICE_ID_KEY = "bubbles_device_id";

const createDeviceId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `device_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

export const getDeviceId = () => {
  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);

    if (saved && /^[a-zA-Z0-9_-]{8,80}$/.test(saved)) {
      return saved;
    }

    const next = createDeviceId().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);

    localStorage.setItem(DEVICE_ID_KEY, next);

    return next;
  } catch {
    return "";
  }
};

export default getDeviceId;
