import { useEffect, useState } from "react";
import {
  LuCalendar,
  LuCircleAlert,
  LuCircleHelp,
  LuClock,
  LuGlobe,
  LuInbox,
  LuMail,
  LuMessageSquare,
  LuMonitor,
  LuPhone,
  LuRefreshCw,
  LuShieldCheck,
  LuSmartphone,
  LuTablet,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getAdminUserAPI } from "../../service/adminAPI";
import {
  DEVICE_LABELS,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "../../utils/adminFormat";
import {
  AdminAvatar,
  AdminBadge,
  AdminSkeleton,
  AdminSpinner,
} from "./AdminUI";

const DEVICE_ICONS = {
  desktop: LuMonitor,
  mobile: LuSmartphone,
  tablet: LuTablet,
  unknown: LuCircleHelp,
};

const STAT_ITEMS = [
  { key: "chats", label: "Chats", icon: LuMessageSquare },
  { key: "groups", label: "Groups", icon: LuUsers },
  { key: "messages", label: "Messages", icon: LuMessageSquare },
  { key: "calls", label: "Calls", icon: LuPhone },
  { key: "feedback", label: "Feedback", icon: LuInbox },
];

const AdminUserDrawer = ({ userId, onClose }) => {
  const { token, logout } = useAdminAuth();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let active = true;

    const loadUser = async () => {
      // Yield before updating state so this effect only starts the request;
      // the actual loading UI is driven from the async continuation.
      await Promise.resolve();

      if (!active) {
        return;
      }

      setLoading(true);
      setError("");
      setUser(null);
      setStats(null);

      try {
        const response = await getAdminUserAPI(userId, {
          Authorization: `Bearer ${token}`,
        });

        if (!active) {
          return;
        }

        setUser(response.data?.user || null);
        setStats(response.data?.stats || null);
      } catch (requestError) {
        if (!active) {
          return;
        }

        const status = requestError.response?.status;

        if (status === 401 || status === 403) {
          logout();
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "This user could not be loaded.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [userId, token, logout, reloadKey]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userId, onClose]);

  if (!userId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="User details"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close user details"
      />

      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {user ? (
              <AdminAvatar user={user} size="lg" />
            ) : (
              <AdminSkeleton className="h-14 w-14 rounded-full" />
            )}

            <div className="min-w-0">
              {loading && !user ? (
                <>
                  <AdminSkeleton className="h-5 w-40" />
                  <AdminSkeleton className="mt-2 h-3 w-28" />
                </>
              ) : (
                <>
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    {user?.name || "User details"}
                  </h2>
                  <p className="truncate text-sm text-slate-500">
                    {user?.username ? `@${user.username}` : user?.email}
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close user details"
          >
            <LuX className="text-lg" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <LuCircleAlert className="mt-0.5 shrink-0 text-base" />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-rose-700 underline underline-offset-2"
              >
                <LuRefreshCw />
                Try again
              </button>
            </div>
          ) : null}

          {loading && !user ? (
            <div className="space-y-4">
              <AdminSkeleton className="h-24 w-full" />
              <AdminSkeleton className="h-32 w-full" />
              <AdminSkeleton className="h-44 w-full" />
            </div>
          ) : null}

          {user ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge tone={user.isOnline ? "emerald" : "slate"}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.isOnline ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {user.isOnline ? "Online now" : "Offline"}
                </AdminBadge>
                <AdminBadge tone={user.emailVerified ? "emerald" : "amber"}>
                  <LuShieldCheck />
                  {user.emailVerified ? "Email verified" : "Email unverified"}
                </AdminBadge>
                <AdminBadge tone={user.isGoogle ? "sky" : "slate"}>
                  {user.isGoogle ? "Google account" : "Password account"}
                </AdminBadge>
              </div>

              <dl className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <LuMail className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">
                      Email
                    </dt>
                    <dd className="truncate font-medium text-slate-800">
                      {user.email || "—"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LuCalendar className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Joined
                    </dt>
                    <dd className="font-medium text-slate-800">
                      {formatDate(user.createdAt, { withTime: true })}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <LuClock className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Last active
                    </dt>
                    <dd className="font-medium text-slate-800">
                      {user.isOnline
                        ? "Online now"
                        : formatRelativeTime(user.lastActiveAt)}
                    </dd>
                  </div>
                </div>

                {user.bio ? (
                  <div className="border-t border-slate-200 pt-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Bio
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                      {user.bio}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Activity
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STAT_ITEMS.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <Icon className="text-sm text-slate-400" />
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                          {formatNumber(stats?.[item.key] || 0)}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Devices
                  </h3>
                  <span className="text-xs text-slate-500">
                    {user.deviceCount} recorded
                  </span>
                </div>

                {user.devices?.length ? (
                  <div className="mt-3 space-y-2">
                    {user.devices.map((device, index) => {
                      const Icon =
                        DEVICE_ICONS[device.type] || LuCircleHelp;

                      return (
                        <div
                          key={`${device.type}-${device.os}-${index}`}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Icon />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {DEVICE_LABELS[device.type] || "Unknown"}
                                  {device.os ? ` · ${device.os}` : ""}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {[device.browser, device.ip]
                                    .filter(Boolean)
                                    .join(" · ") || "Browser not recorded"}
                                </p>
                              </div>
                            </div>

                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatRelativeTime(device.lastActiveAt)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-11 text-[11px] text-slate-400">
                            <span>
                              First seen {formatDate(device.firstSeenAt)}
                            </span>
                            <span>
                              Last active {formatDate(device.lastActiveAt, {
                                withTime: true,
                              })}
                            </span>
                          </div>

                          {device.userAgent ? (
                            <p
                              className="mt-2 truncate pl-11 text-[10px] text-slate-400"
                              title={device.userAgent}
                            >
                              {device.userAgent}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No device data has been recorded for this account yet.
                  </div>
                )}
              </section>

              <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-xs text-violet-700">
                <LuGlobe className="shrink-0" />
                Device data updates when the person signs in or opens Bubbles.
              </div>
            </div>
          ) : null}
        </div>

        <footer className="border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {loading ? <AdminSpinner /> : null}
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default AdminUserDrawer;
