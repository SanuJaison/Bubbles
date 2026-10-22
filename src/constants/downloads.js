export const APP_VERSION = "1.0.0";
export const RELEASE_DATE = "October 2026";

// Set these in Vercel (or a local .env) after the builds exist.
// Windows: direct GitHub Releases asset URL for the .msi / .exe
// Android: direct GitHub Releases asset URL for the .apk
export const DOWNLOAD_LINKS = {
  windows: (import.meta.env.VITE_WINDOWS_DOWNLOAD_URL || "").trim(),
  android: (import.meta.env.VITE_ANDROID_DOWNLOAD_URL || "").trim(),
};
