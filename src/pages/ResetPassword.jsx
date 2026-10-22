import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCircleCheck,
  LuEye,
  LuEyeOff,
  LuLock,
  LuShieldCheck,
} from "react-icons/lu";
import toast from "react-hot-toast";
import bubbles from "../assets/bubbles.png";
import { resetPasswordAPI } from "../service/api";

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  autoComplete,
}) => (
  <div>
    <label className="block text-sm text-ink mb-1">{label}</label>

    <div className="flex items-center px-4 py-3 border border-brand-200 rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition">
      <LuLock className="text-lg shrink-0" />

      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="outline-none flex-1 bg-transparent text-ink min-w-0"
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        className="shrink-0 cursor-pointer hover:text-brand-600 transition"
      >
        {visible ? (
          <LuEyeOff className="text-lg" />
        ) : (
          <LuEye className="text-lg" />
        )}
      </button>
    </div>
  </div>
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      toast.error("Enter and confirm your new password");
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!/[a-z]/i.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      toast.error("Password must include at least one letter and one number");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSaving(true);

      const response = await resetPasswordAPI({
        token,
        newPassword: form.newPassword,
      });

      if (response.status === 200) {
        setSuccess(true);
        setForm({ newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "This reset link is invalid or has expired",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
        <div className="flex flex-col items-center justify-center p-5">
          <img width={140} src={bubbles} alt="" />

          <p className="text-3xl font-bold pt-4 text-ink">
            {success ? "You're all set" : "Choose a new password"}
          </p>

          <p className="text-muted mt-2 max-w-sm">
            {success
              ? "Your password has been reset. Sign in with your new password to get back to your chats."
              : "Pick something you'll remember. At least 8 characters with a letter and a number."}
          </p>
        </div>

        {success ? (
          <div className="px-2 sm:px-20 py-5">
            <div className="w-16 h-16 mx-auto rounded-full brand-gradient-soft flex items-center justify-center text-brand-600 mb-5">
              <LuCircleCheck className="text-3xl" />
            </div>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow hover:opacity-95 transition"
            >
              Go to login <LuArrowRight className="text-lg" />
            </button>
          </div>
        ) : !token ? (
          <div className="px-2 sm:px-20 py-5">
            <p className="text-sm text-muted mb-5">
              This reset link is missing its secure token. Request a fresh link
              to continue.
            </p>

            <Link
              to="/forgot-password"
              replace
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow hover:opacity-95 transition"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full px-2 sm:px-20 py-5 text-left"
          >
            <PasswordField
              label="New password"
              value={form.newPassword}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  newPassword: event.target.value,
                }))
              }
              placeholder="At least 8 characters"
              autoComplete="new-password"
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((visible) => !visible)}
            />

            <PasswordField
              label="Confirm new password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  confirmPassword: event.target.value,
                }))
              }
              placeholder="Repeat new password"
              autoComplete="new-password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((visible) => !visible)}
            />

            <p className="flex items-center gap-1.5 text-xs text-muted">
              <LuShieldCheck className="text-base text-brand-600 shrink-0" />
              Your current password can't be reused.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition disabled:opacity-60"
            >
              {saving ? "Updating password..." : "Reset password"}
              <LuArrowRight className="text-lg" />
            </button>

            <Link
              to="/login"
              replace
              className="flex items-center justify-center gap-2 text-sm text-muted hover:text-brand-600 transition"
            >
              <LuArrowLeft className="text-base" /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
