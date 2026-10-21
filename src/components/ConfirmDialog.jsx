import { useEffect } from "react";
import { LuInfo, LuTriangleAlert } from "react-icons/lu";

// In-app replacement for window.confirm — same idea, but themed, keyboard
// friendly and able to show a busy state while the action runs.
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) {
    return null;
  }

  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm brand-modal border border-brand-100 rounded-2xl shadow-soft p-5"
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              isDanger
                ? "bg-red-50 text-red-500 dark:bg-red-500/15"
                : "brand-gradient-soft text-brand-600"
            }`}
          >
            {isDanger ? <LuTriangleAlert /> : <LuInfo />}
          </span>

          <div className="min-w-0">
            <h3 className="font-semibold text-ink break-words">{title}</h3>

            {message && (
              <p className="text-sm text-muted mt-1 leading-6 break-words">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-1/2 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-ink font-medium hover:bg-black/10 dark:hover:bg-white/15 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`w-1/2 py-2.5 rounded-xl text-white font-medium transition disabled:opacity-60 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "brand-gradient hover:opacity-90"
            }`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
