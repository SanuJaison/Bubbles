export const CATEGORY_LABELS = {
  suggestion: "Suggestion",
  bug: "Bug report",
  feature: "Feature idea",
  other: "Something else",
};

export const STATUS_LABELS = {
  new: "New",
  reviewed: "Reviewed",
  archived: "Archived",
};

export const DEVICE_LABELS = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  unknown: "Unknown",
};

export const SOURCE_LABELS = {
  web: "Web",
  android: "Android",
  windows: "Windows",
};

const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

export const formatDate = (value, { withTime = false } = {}) => {
  if (!isValidDate(value)) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(new Date(value));
};

export const formatRelativeTime = (value) => {
  if (!isValidDate(value)) {
    return "Never";
  }

  const diff = Date.now() - new Date(value).getTime();

  if (diff < 45 * 1000) {
    return "Just now";
  }

  const minutes = Math.floor(diff / (60 * 1000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(value);
};

export const formatShortDay = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const getInitials = (name, email = "") => {
  const source = String(name || "").trim() || String(email || "").trim();

  if (!source) {
    return "?";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getDisplayName = (user) =>
  user?.name || user?.username || user?.email || "Bubbles user";

export const getPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((Number(value) / Number(total)) * 100);
};
