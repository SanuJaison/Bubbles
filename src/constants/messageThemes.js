export const DEFAULT_MESSAGE_THEME_ID = "brand";

export const MESSAGE_THEMES = [
  {
    id: "brand",
    name: "Bubbles",
    sent: "linear-gradient(135deg, #6d4ae0, #e8659b)",
    received: "#ffffff",
  },
  {
    id: "violet",
    name: "Violet",
    sent: "linear-gradient(135deg, #6d4ae0, #8b5cf6)",
    received: "#f1e9ff",
  },
  {
    id: "ocean",
    name: "Ocean",
    sent: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    received: "#e0f2fe",
  },
  {
    id: "mint",
    name: "Mint",
    sent: "linear-gradient(135deg, #10b981, #059669)",
    received: "#dcfce7",
  },
  {
    id: "sunset",
    name: "Sunset",
    sent: "linear-gradient(135deg, #f5917a, #e8659b)",
    received: "#ffe9e2",
  },
  {
    id: "graphite",
    name: "Graphite",
    sent: "linear-gradient(135deg, #3f3d56, #6d6a8f)",
    received: "#f1f0f6",
  },
];

export const getMessageThemeClass = (id) => {
  const isValid = MESSAGE_THEMES.some((theme) => theme.id === id);

  return `theme-${isValid ? id : DEFAULT_MESSAGE_THEME_ID}`;
};
