import { useRef, useState } from "react";
import { LuArrowLeft, LuCheck, LuImagePlus } from "react-icons/lu";
import {
  WALLPAPERS,
  DEFAULT_WALLPAPER_ID,
  getWallpaperValue,
  resolveWallpaper,
} from "../constants/wallpapers";
import { updateChatWallpaperAPI } from "../service/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const WallpaperPicker = ({ onBack }) => {
  const { user, updateUser } = useAuth();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [selected, setSelected] = useState(
    user?.chatWallpaper || getWallpaperValue(DEFAULT_WALLPAPER_ID),
  );

  const [customFile, setCustomFile] = useState(null);
  const [customPreview, setCustomPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const isCustomSelected = selected === "custom" && customPreview;

  const previewBackground = isCustomSelected
    ? `linear-gradient(${
        isDark ? "rgba(8, 8, 10, 0.6)" : "rgba(255, 255, 255, 0.55)"
      }, ${
        isDark ? "rgba(8, 8, 10, 0.6)" : "rgba(255, 255, 255, 0.55)"
      }), url("${customPreview}") center / cover no-repeat`
    : resolveWallpaper(selected, isDark).background;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setCustomFile(file);
    setCustomPreview(URL.createObjectURL(file));
    setSelected("custom");

    e.target.value = "";
  };

  const handleSave = async () => {
    if (selected === "custom" && !customFile) {
      toast.error("Please upload a wallpaper first");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      let response;

      if (selected === "custom") {
        const formData = new FormData();

        formData.append("wallpaper", customFile);

        response = await updateChatWallpaperAPI(formData, reqHeader);
      } else {
        response = await updateChatWallpaperAPI(
          { chatWallpaper: selected },
          reqHeader,
        );
      }

      if (response.status === 200) {
        updateUser(response.data.user);

        toast.success("Chat wallpaper updated");

        onBack();
      }
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message || "Failed to update wallpaper";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-brand-50 flex items-center justify-center text-muted transition"
        >
          <LuArrowLeft className="text-lg" />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-ink">Chat Wallpaper</h2>

          <p className="text-xs text-muted">
            Choose a background for your conversations
          </p>
        </div>
      </div>

      <div
        className="h-36 rounded-2xl border border-brand-100 shadow-soft"
        style={{ background: previewBackground }}
      ></div>

      <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-7 mb-3">
        Default wallpapers
      </p>

      <div className="grid grid-cols-3 gap-3">
        {WALLPAPERS.map((wallpaper) => {
          const wallpaperValue = getWallpaperValue(wallpaper.id);

          const isSelected = selected === wallpaperValue;

          return (
            <button
              type="button"
              key={wallpaper.id}
              onClick={() => setSelected(wallpaperValue)}
              className={`relative h-20 rounded-xl border overflow-hidden transition ${
                isSelected
                  ? "border-brand-400 ring-2 ring-brand-300"
                  : "border-brand-100 hover:border-brand-200"
              }`}
              style={{
                background:
                  isDark && wallpaper.darkBackground
                    ? wallpaper.darkBackground
                    : wallpaper.background,
              }}
              title={wallpaper.name}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full brand-gradient text-white flex items-center justify-center shadow">
                  <LuCheck className="text-sm" />
                </span>
              )}

              <span className="absolute bottom-1 left-2 text-[11px] font-medium text-ink/70">
                {wallpaper.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-7 mb-3">
        Your own wallpaper
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 hover:bg-brand-50 transition text-left"
      >
        <span className="w-10 h-10 rounded-full brand-gradient-soft text-brand-600 flex items-center justify-center text-lg">
          <LuImagePlus />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">
            Upload an image
          </span>

          <span className="block text-xs text-muted truncate">
            {customFile?.name || "PNG, JPG or WEBP (max 50MB)"}
          </span>
        </span>
      </button>

      {customFile && (
        <button
          type="button"
          onClick={() => setSelected("custom")}
          className={`mt-3 w-full h-20 rounded-xl border overflow-hidden transition ${
            isCustomSelected
              ? "border-brand-400 ring-2 ring-brand-300"
              : "border-brand-100"
          }`}
          style={{ background: previewBackground }}
        ></button>
      )}

      <div className="mt-8 pb-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl brand-gradient text-white font-medium shadow-glow hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Wallpaper"}
        </button>
      </div>
    </div>
  );
};

export default WallpaperPicker;
