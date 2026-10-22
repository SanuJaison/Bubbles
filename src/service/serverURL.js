const configuredURL = (import.meta.env.VITE_API_URL || "").trim();

// VITE_API_URL must include the /api suffix, e.g.
// https://bubbles-api.example.com/api
export const serverURL = (configuredURL || "http://localhost:3000/api").replace(
  /\/+$/,
  "",
);