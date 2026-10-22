import { useState } from "react";
import { Link } from "react-router-dom";
import { LuMail, LuArrowLeft, LuArrowRight, LuMailCheck } from "react-icons/lu";
import toast from "react-hot-toast";
import bubbles from "../assets/bubbles.png";
import { forgotPasswordAPI } from "../service/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Enter the email address on your account");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    try {
      setSending(true);

      const response = await forgotPasswordAPI({ email: cleanEmail });

      if (response.status === 200) {
        setSent(true);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "We could not send the reset email right now",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
        <div className="flex flex-col items-center justify-center p-5">
          <img width={140} src={bubbles} alt="" />

          <p className="text-3xl font-bold pt-4 text-ink">
            {sent ? "Check your inbox" : "Forgot your password?"}
          </p>

          <p className="text-muted mt-2 max-w-sm">
            {sent
              ? "If an account exists for that email, a reset link is on its way. Check your spam folder too."
              : "No worries. Enter your account email and we'll send you a secure link to choose a new password."}
          </p>
        </div>

        {sent ? (
          <div className="px-2 sm:px-20 py-5">
            <div className="w-16 h-16 mx-auto rounded-full brand-gradient-soft flex items-center justify-center text-brand-600 mb-5">
              <LuMailCheck className="text-3xl" />
            </div>

            <p className="text-sm text-muted mb-1">Reset link sent to</p>

            <p className="font-medium text-ink break-all mb-6">{email}</p>

            <Link
              to="/login"
              replace
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow hover:opacity-95 transition"
            >
              <LuArrowLeft className="text-lg" /> Back to login
            </Link>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-4 text-sm text-brand-600 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 w-full px-2 sm:px-20 py-5"
          >
            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuMail className="text-lg shrink-0" />

              <input
                type="email"
                placeholder="Email address"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="outline-none flex-1 bg-transparent text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition disabled:opacity-60"
            >
              {sending ? "Sending link..." : "Send reset link"}
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

export default ForgotPassword;
