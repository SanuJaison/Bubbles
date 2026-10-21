export const DEFAULT_WALLPAPER_ID = "aurora";

const presetWallpaperValue = (id) => `preset:${id}`;

/**
 * Each preset paints the whole chat column with a full-bleed colour wash
 * (not just corner glows), so every option reads as its own scene:
 *   aurora   - violet > blue > teal > pink diagonal sweep
 *   bubbles  - sky/lilac base with scattered translucent bubbles
 *   blush    - warm rose & apricot wash
 *   lavender - cool lilac & periwinkle wash
 *   dusk     - deep violet > magenta > coral
 *   midnight - deep navy > indigo > teal
 * `darkBackground` is used when the app is in dark mode.
 */
export const WALLPAPERS = [
  {
    id: "aurora",
    name: "Aurora",
    // The default: a continuous brand-tinted sweep with the glows reaching
    // across the middle, so there is no flat white/black plateau at centre.
    background:
      "radial-gradient(130% 130% at 0% 0%, rgba(168, 85, 247, 0.3), transparent 62%), radial-gradient(130% 130% at 100% 100%, rgba(232, 101, 155, 0.26), transparent 62%), linear-gradient(135deg, #e9dcff 0%, #f3ecff 24%, #fbe9f6 46%, #ffedf7 58%, #f1e6ff 80%, #e7dcff 100%)",
    darkBackground:
      "radial-gradient(130% 130% at 0% 0%, rgba(124, 92, 246, 0.3), transparent 62%), radial-gradient(130% 130% at 100% 100%, rgba(232, 101, 155, 0.24), transparent 62%), linear-gradient(135deg, #0d0a1c 0%, #0c0a17 24%, #130b18 46%, #140b19 58%, #0f0b1a 80%, #0a0915 100%)",
  },
  {
    id: "bubbles",
    name: "Bubbles",
    background:
      "radial-gradient(circle at 8% 12%, rgba(139, 92, 246, 0.5) 0 26px, transparent 27px), radial-gradient(circle at 30% 42%, rgba(56, 189, 248, 0.45) 0 18px, transparent 19px), radial-gradient(circle at 62% 16%, rgba(236, 72, 153, 0.42) 0 30px, transparent 31px), radial-gradient(circle at 88% 44%, rgba(139, 92, 246, 0.45) 0 20px, transparent 21px), radial-gradient(circle at 16% 72%, rgba(45, 212, 191, 0.45) 0 24px, transparent 25px), radial-gradient(circle at 50% 90%, rgba(251, 146, 60, 0.4) 0 16px, transparent 17px), radial-gradient(circle at 84% 80%, rgba(236, 72, 153, 0.42) 0 28px, transparent 29px), radial-gradient(circle at 44% 62%, rgba(168, 85, 247, 0.35) 0 12px, transparent 13px), linear-gradient(150deg, #dbeafe 0%, #e9d5ff 34%, #cffafe 68%, #ffe4e6 100%)",
    darkBackground:
      "radial-gradient(circle at 8% 12%, rgba(139, 92, 246, 0.5) 0 26px, transparent 27px), radial-gradient(circle at 30% 42%, rgba(56, 189, 248, 0.45) 0 18px, transparent 19px), radial-gradient(circle at 62% 16%, rgba(236, 72, 153, 0.42) 0 30px, transparent 31px), radial-gradient(circle at 88% 44%, rgba(139, 92, 246, 0.45) 0 20px, transparent 21px), radial-gradient(circle at 16% 72%, rgba(45, 212, 191, 0.45) 0 24px, transparent 25px), radial-gradient(circle at 50% 90%, rgba(251, 146, 60, 0.4) 0 16px, transparent 17px), radial-gradient(circle at 84% 80%, rgba(236, 72, 153, 0.42) 0 28px, transparent 29px), radial-gradient(circle at 44% 62%, rgba(168, 85, 247, 0.35) 0 12px, transparent 13px), linear-gradient(150deg, #080a14 0%, #0c0b1e 34%, #061418 68%, #140a14 100%)",
  },
  {
    id: "blush",
    name: "Blush",
    background:
      "radial-gradient(780px 580px at 90% 4%, rgba(244, 114, 182, 0.55), transparent 60%), radial-gradient(740px 580px at 4% 94%, rgba(251, 146, 60, 0.45), transparent 60%), linear-gradient(140deg, #ffe0e9 0%, #ffd0e0 34%, #ffdac6 68%, #ffc9dd 100%)",
    darkBackground:
      "radial-gradient(780px 580px at 90% 4%, rgba(244, 114, 182, 0.45), transparent 60%), radial-gradient(740px 580px at 4% 94%, rgba(251, 146, 60, 0.34), transparent 60%), linear-gradient(140deg, #240f1a 0%, #2c1120 34%, #2a150e 68%, #32121f 100%)",
  },
  {
    id: "lavender",
    name: "Lavender",
    background:
      "radial-gradient(840px 620px at 8% 0%, rgba(147, 51, 234, 0.48), transparent 60%), radial-gradient(780px 620px at 96% 96%, rgba(99, 102, 241, 0.48), transparent 60%), linear-gradient(130deg, #ece4ff 0%, #dcd6ff 34%, #d7e0ff 68%, #efe0ff 100%)",
    darkBackground:
      "radial-gradient(840px 620px at 8% 0%, rgba(147, 51, 234, 0.42), transparent 60%), radial-gradient(780px 620px at 96% 96%, rgba(99, 102, 241, 0.42), transparent 60%), linear-gradient(130deg, #150f2b 0%, #141235 34%, #0f1430 68%, #180f2b 100%)",
  },
  {
    id: "dusk",
    name: "Dusk",
    background:
      "radial-gradient(780px 580px at 12% 8%, rgba(167, 139, 250, 0.55), transparent 60%), radial-gradient(740px 580px at 90% 94%, rgba(244, 114, 182, 0.5), transparent 60%), linear-gradient(150deg, #4c1d95 0%, #6d28d9 34%, #a21caf 68%, #db2777 100%)",
    darkBackground:
      "radial-gradient(780px 580px at 12% 8%, rgba(167, 139, 250, 0.42), transparent 60%), radial-gradient(740px 580px at 90% 94%, rgba(244, 114, 182, 0.4), transparent 60%), linear-gradient(150deg, #170c2e 0%, #22103f 34%, #331347 68%, #45123a 100%)",
  },
  {
    id: "midnight",
    name: "Midnight",
    background:
      "radial-gradient(720px 540px at 92% 6%, rgba(59, 130, 246, 0.5), transparent 60%), radial-gradient(720px 540px at 6% 94%, rgba(20, 184, 166, 0.35), transparent 60%), linear-gradient(150deg, #0b1224 0%, #131a3a 34%, #1e1b4b 68%, #2a1a4d 100%)",
    darkBackground:
      "radial-gradient(720px 540px at 92% 6%, rgba(59, 130, 246, 0.38), transparent 60%), radial-gradient(720px 540px at 6% 94%, rgba(20, 184, 166, 0.24), transparent 60%), linear-gradient(150deg, #04060d 0%, #0a0f24 34%, #100f2e 68%, #150f33 100%)",
  },
];

export const getWallpaperValue = (id) => presetWallpaperValue(id);

export const resolveWallpaper = (value, isDark = false) => {
  if (value && value.startsWith("http")) {
    const scrim = isDark
      ? "linear-gradient(rgba(8, 8, 10, 0.6), rgba(8, 8, 10, 0.6))"
      : "linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55))";

    return {
      id: "custom",
      name: "Custom",
      background: `${scrim}, url("${value}") center / cover no-repeat`,
      url: value,
      isCustom: true,
      value,
    };
  }

  const id = value && value.startsWith("preset:") ? value.split(":")[1] : value;

  const preset =
    WALLPAPERS.find((wallpaper) => wallpaper.id === id) ||
    WALLPAPERS.find((wallpaper) => wallpaper.id === DEFAULT_WALLPAPER_ID);

  return {
    ...preset,
    background:
      isDark && preset.darkBackground
        ? preset.darkBackground
        : preset.background,
    isCustom: false,
    value: presetWallpaperValue(preset.id),
  };
};
