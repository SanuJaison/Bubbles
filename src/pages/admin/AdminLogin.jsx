import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuAtSign,
  LuCircleAlert,
  LuEye,
  LuEyeOff,
  LuInbox,
  LuLock,
  LuMonitor,
  LuShieldCheck,
  LuWifi,
} from "react-icons/lu";
import { useAdminAuth } from "../../context/AdminAuthContext";
import usePageMeta from "../../hooks/usePageMeta";
import { googleAuthAPI, loginAPI } from "../../service/api";
import { getAdminMeAPI } from "../../service/adminAPI";
import { getDeviceId } from "../../utils/deviceId";
import { AdminSpinner } from "../../components/admin/AdminUI";

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const getAdminErrorMessage = (error) => {
  const data = error.response?.data;
  const status = error.response?.status;

  if (data?.code === "ADMIN_NOT_CONFIGURED") {
    return "Admin access is not configured yet. Add ADMIN_EMAILS to the backend environment and redeploy.";
  }

  if (data?.code === "ADMIN_FORBIDDEN" || status === 403) {
    return "This Bubbles account does not have admin access.";
  }

  if (data?.code === "EMAIL_NOT_VERIFIED") {
    return "Verify this account's email in the main Bubbles app before signing in to admin.";
  }

  return data?.message || "Admin sign-in failed. Check your details and try again.";
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAdminAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Admin sign in | Bubbles",
    description: "Private Bubbles administration sign in.",
    path: "/admin/login",
    robots: "noindex,nofollow",
  });

  const finishAdminLogin = async (token, user) => {
    if (user?.needsUsername) {
      setError(
        "Finish setting up this Bubbles account in the main app before using admin.",
      );
      return;
    }

    const adminResponse = await getAdminMeAPI({
      Authorization: `Bearer ${token}`,
    });

    login(token, adminResponse.data.admin);
    navigate("/admin", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!identifier.trim() || !password) {
      setError("Enter your admin email or username and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await loginAPI({
        identifier: identifier.trim(),
        password,
        deviceId: getDeviceId(),
      });

      await finishAdminLogin(response.data.token, response.data.user);
    } catch (requestError) {
      setError(getAdminErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await googleAuthAPI({
        credential: credentialResponse.credential,
        deviceId: getDeviceId(),
      });

      await finishAdminLogin(response.data.token, response.data.user);
    } catch (requestError) {
      setError(getAdminErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center">
        <AdminSpinner className="text-2xl text-violet-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="admin-grid-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden flex-col justify-between bg-[linear-gradient(160deg,#1c1233_0%,#2a1749_55%,#3a173e_100%)] p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <img
                  src="/bubbles-logo-144.png"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">
                  Bubbles
                </p>
                <p className="text-xs text-white/60">Admin console</p>
              </div>
            </div>

            <h1 className="mt-12 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              A clear view of the people behind the bubbles.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              See who is online, what devices they use, and what people are
              telling you — all in one private workspace.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: LuWifi,
                title: "Live presence",
                copy: "Online and recently active users at a glance.",
              },
              {
                icon: LuMonitor,
                title: "Device insight",
                copy: "Desktop, mobile, and tablet sessions with browser details.",
              },
              {
                icon: LuInbox,
                title: "Feedback inbox",
                copy: "Review suggestions, bugs, and feature ideas as they arrive.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    <Icon />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/55">
                      {item.copy}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/35">
            Private area. Access is limited to configured admin accounts.
          </p>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mx-auto flex max-w-md flex-col">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 p-2 ring-1 ring-violet-100">
                <img
                  src="/bubbles-logo-144.png"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Bubbles Admin
                </p>
                <p className="text-xs text-slate-500">Private console</p>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100">
                <LuShieldCheck />
                Restricted access
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                Admin sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the verified Bubbles account that is configured as an
                administrator.
              </p>
            </div>

            {error ? (
              <div
                className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
                role="alert"
                aria-live="polite"
              >
                <LuCircleAlert className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Email or username
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-500 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50">
                  <LuAtSign className="shrink-0 text-lg" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    autoComplete="username"
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Password
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-500 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50">
                  <LuLock className="shrink-0 text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Your Bubbles password"
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="shrink-0 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <LuEyeOff /> : <LuEye />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {submitting ? (
                  <>
                    <AdminSpinner />
                    Checking access...
                  </>
                ) : (
                  <>
                    Sign in to admin
                    <LuArrowRight />
                  </>
                )}
              </button>
            </form>

            {googleClientId ? (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium text-slate-400">
                    or continue with Google
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div
                  className={`flex justify-center ${
                    submitting ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <GoogleLogin
                    width={300}
                    text="continue_with"
                    shape="pill"
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setError("Google sign-in could not be completed.");
                    }}
                  />
                </div>
              </>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-medium text-slate-500 transition hover:text-violet-700"
              >
                <LuArrowLeft />
                Back to Bubbles
              </Link>
              <span className="text-xs text-slate-400">
                Admin access only
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLogin;
