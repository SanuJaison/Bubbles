import { LuArrowLeft, LuCheck } from "react-icons/lu";
import { MESSAGE_THEMES } from "../constants/messageThemes";
import { useTheme } from "../context/ThemeContext";

const MessageThemePicker = ({ onBack }) => {
  const { chatTheme, setChatTheme } = useTheme();

  const activeTheme =
    MESSAGE_THEMES.find((theme) => theme.id === chatTheme) || MESSAGE_THEMES[0];

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
          <h2 className="text-lg font-semibold text-ink">Message Theme</h2>

          <p className="text-xs text-muted">
            Pick the colours for your chat bubbles
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 p-4 space-y-3 bg-brand-50/40">
        <div className="flex justify-end">
          <span
            className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md text-white text-sm shadow-glow"
            style={{ background: activeTheme.sent }}
          >
            Hey! How are you?
          </span>
        </div>

        <div className="flex justify-start">
          <span className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-md text-ink text-sm border border-brand-100 bg-white">
            Doing great, thanks!
          </span>
        </div>
      </div>

      <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-7 mb-3">
        Default colours
      </p>

      <div className="grid grid-cols-2 gap-3">
        {MESSAGE_THEMES.map((theme) => {
          const isSelected = chatTheme === theme.id;

          return (
            <button
              type="button"
              key={theme.id}
              onClick={() => setChatTheme(theme.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                isSelected
                  ? "border-brand-400 ring-2 ring-brand-300"
                  : "border-brand-100 hover:border-brand-200"
              }`}
            >
              <span className="flex flex-col gap-1 shrink-0">
                <span
                  className="w-9 h-4 rounded-full shadow-sm"
                  style={{ background: theme.sent }}
                />

                <span
                  className="w-9 h-4 rounded-full border border-black/5 shadow-sm"
                  style={{ background: theme.received }}
                />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink truncate">
                  {theme.name}
                </span>

                <span className="block text-xs text-muted truncate">
                  Sent &amp; received colours
                </span>
              </span>

              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full brand-gradient text-white flex items-center justify-center">
                  <LuCheck className="text-xs" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted mt-4">
        Your theme is saved automatically on this device.
      </p>
    </div>
  );
};

export default MessageThemePicker;
