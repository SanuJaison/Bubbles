import { useState } from "react";
import { LuFlag, LuCheck, LuX } from "react-icons/lu";

const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "impersonation", label: "Impersonation" },
  { id: "other", label: "Something else" },
];

// A small, themed replacement for the browser prompt. Rendered only while
// open, so the chosen reason resets every time it's reopened.
const ReportDialog = ({ targetName, busy = false, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleClose = () => {
    if (busy) {
      return;
    }

    onClose?.();
  };

  const handleSubmit = () => {
    if (!reason || busy) {
      return;
    }

    onSubmit?.({
      reason: REASONS.find((item) => item.id === reason)?.label || reason,
      details: details.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Report ${targetName || "user"}`}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-brand brand-modal border border-brand-100 rounded-2xl shadow-soft p-5"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-10 h-10 rounded-full brand-gradient-soft text-brand-600 flex items-center justify-center text-lg">
            <LuFlag />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink break-words">
              Report {targetName || "this user"}
            </h3>

            <p className="text-sm text-muted mt-1 leading-6">
              Tell us what's wrong. Reports are private — they won't know you
              sent one.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            title="Close"
            className="shrink-0 w-8 h-8 rounded-full hover:bg-brand-50 text-muted hover:text-ink transition flex items-center justify-center disabled:opacity-50"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Reason
          </p>

          {REASONS.map((item) => {
            const isActive = reason === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setReason(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition ${
                  isActive
                    ? "border-brand-400 bg-brand-50 text-ink"
                    : "border-brand-100 text-ink hover:border-brand-200 hover:bg-brand-50/60"
                }`}
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                    isActive
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-brand-200 text-transparent"
                  }`}
                >
                  <LuCheck className="text-xs" />
                </span>

                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label
            htmlFor="report-details"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Details (optional)
          </label>

          <textarea
            id="report-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add anything that helps us review this..."
            className="w-full mt-2 px-3 py-2.5 border border-brand-100 rounded-xl text-sm text-ink bg-transparent outline-none focus:border-brand-400 resize-none placeholder:text-muted"
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="w-1/2 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-ink font-medium hover:bg-black/10 dark:hover:bg-white/15 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || busy}
            className="w-1/2 py-2.5 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? "Sending..." : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDialog;
