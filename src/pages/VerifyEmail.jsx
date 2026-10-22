import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCircleAlert,
  LuCircleCheck,
  LuMail,
  LuMailCheck,
} from "react-icons/lu";
import toast from "react-hot-toast";
import bubbles from "../assets/bubbles.png";
import { resendVerificationAPI, verifyEmailAPI } from "../service/api";

const VerifyEmail = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);

  const verifiedToken = useRef("");

  useEffect(() => {
    if (!token || verifiedToken.current === token) {
      return undefined;
    }

    verifiedToken.current = token;
    setStatus("verifying");

    verifyEmailAPI({ token })
      .then((response) => {
        if (response.status === 200) {
          setStatus("success");
        }
      })
      .catch((error) => {
        setStatus("error");
        setErrorMessage(
          error.response?.data?.message ||
            "This verification link is invalid or has expired",
        );
      });
  }, [token]);

  const handleResend = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Enter the email address you signed up with");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    try {
      setSending(true);

      const response = await resendVerificationAPI({ email: cleanEmail });

      if (response.status === 200) {
        toast.success(
          response.data?.message || "A fresh verification link is on its way",
        );
        setStatus("idle");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "We couldn't send the verification email right now",
      );
    } finally {
      setSending(false);
    }
  };

  const currentStatus = token ? status : "idle";

  const title =
    currentStatus === "verifying"
      ? "Verifying your email"
      : currentStatus === "success"
        ? "Email verified"
        : currentStatus === "error"
          ? "That link didn't work"
          : "Check your inbox";

  const subtitle =
    currentStatus === "verifying"
      ? "Give us a second while we confirm your link."
      : currentStatus === "success"
        ? "Your account is ready. Sign in and jump back into your conversations."
        : currentStatus === "error"
          ? errorMessage
          : email
            ? `We sent a verification link to ${email}. Open it to finish setting up your account.`
            : "Enter the email you signed up with and we'll send a fresh verification link.";

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
        <div className="flex flex-col items-center justify-center p-5">
          <img width={140} src={bubbles} alt="" />

          <p className="text-3xl font-bold pt-4 text-ink">{title}</p>

          <p className="text-muted mt-2 max-w-sm break-words">{subtitle}</p>
        </div>

        {currentStatus === "verifying" ? (
          <div className="px-2 sm:px-20 py-8">
            <div className="w-16 h-16 mx-auto rounded-full brand-gradient-soft flex items-center justify-center text-brand-600 mb-5">
              <span className="w-7 h-7 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
            </div>

            <p className="text-sm text-muted">Checking your verification link...</p>
          </div>
        ) : currentStatus === "success" ? (
          <div className="px-2 sm:px-20 py-5">
            <div className="w-16 h-16 mx-auto rounded-full brand-gradient-soft flex items-center justify-center text-brand-600 mb-5">
              <LuCircleCheck className="text-3xl" />
            </div>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition"
            >
              Go to login <LuArrowRight className="text-lg" />
            </button>
          </div>
        ) : (
          <div className="px-2 sm:px-20 py-5">
            <div className="w-16 h-16 mx-auto rounded-full brand-gradient-soft flex items-center justify-center text-brand-600 mb-5">
              {currentStatus === "error" ? (
                <LuCircleAlert className="text-3xl" />
              ) : (
                <LuMailCheck className="text-3xl" />
              )}
            </div>

            <form onSubmit={handleResend} className="flex flex-col gap-4">
              <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
                <LuMail className="text-lg shrink-0" />

                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="outline-none flex-1 bg-transparent text-ink min-w-0"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition disabled:opacity-60"
              >
                {sending ? "Sending link..." : "Resend verification email"}
                <LuArrowRight className="text-lg" />
              </button>
            </form>

            <p className="text-xs text-muted mt-4">
              Check your spam folder too. The link can only be used once.
            </p>

            <Link
              to="/login"
              replace
              className="mt-5 flex items-center justify-center gap-2 text-sm text-muted hover:text-brand-600 transition"
            >
              <LuArrowLeft className="text-base" /> Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
