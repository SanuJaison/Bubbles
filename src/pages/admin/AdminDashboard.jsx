import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuActivity,
  LuArrowUpRight,
  LuCircleHelp,
  LuInbox,
  LuMessageSquare,
  LuMonitor,
  LuPhone,
  LuRefreshCw,
  LuSmartphone,
  LuTablet,
  LuTrendingUp,
  LuUserPlus,
  LuUsers,
  LuWifi,
} from "react-icons/lu";
import AdminDeviceChips from "../../components/admin/AdminDeviceChips";
import AdminSignupChart from "../../components/admin/AdminSignupChart";
import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminSectionHeading,
  AdminSkeleton,
  AdminStatCard,
} from "../../components/admin/AdminUI";
import { useAdminAuth } from "../../context/AdminAuthContext";
import usePageMeta from "../../hooks/usePageMeta";
import { getAdminOverviewAPI } from "../../service/adminAPI";
import {
  CATEGORY_LABELS,
  DEVICE_LABELS,
  STATUS_LABELS,
  formatNumber,
  formatRelativeTime,
  getDisplayName,
  getPercent,
} from "../../utils/adminFormat";

const CATEGORY_TONES = {
  suggestion: "violet",
  bug: "rose",
  feature: "amber",
  other: "slate",
};

const STATUS_TONES = {
  new: "blue",
  reviewed: "emerald",
  archived: "slate",
};

const DEVICE_ICONS = {
  desktop: LuMonitor,
  mobile: LuSmartphone,
  tablet: LuTablet,
  unknown: LuCircleHelp,
};

const DashboardSkeleton = () => (
  <div className="space-y-5" aria-hidden="true">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <AdminCard key={index} className="p-5">
          <AdminSkeleton className="h-3 w-24" />
          <AdminSkeleton className="mt-3 h-9 w-20" />
          <AdminSkeleton className="mt-2 h-3 w-32" />
        </AdminCard>
      ))}
    </div>
    <div className="grid gap-5 xl:grid-cols-3">
      <AdminCard className="p-5 xl:col-span-2">
        <AdminSkeleton className="h-5 w-40" />
        <AdminSkeleton className="mt-2 h-3 w-56" />
        <AdminSkeleton className="mt-6 h-60 w-full" />
      </AdminCard>
      <AdminCard className="p-5">
        <AdminSkeleton className="h-5 w-28" />
        <AdminSkeleton className="mt-2 h-3 w-48" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <AdminSkeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </AdminCard>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { token, logout } = useAdminAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Admin overview | Bubbles",
    description: "Private Bubbles administration overview.",
    path: "/admin",
    robots: "noindex,nofollow",
  });

  const fetchOverview = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await getAdminOverviewAPI({
        Authorization: `Bearer ${token}`,
      });

      setOverview(response.data?.overview || null);
      setError("");
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401 || status === 403) {
        logout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "The dashboard could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout]);

  useEffect(() => {
    // Initial data fetch; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverview();
  }, [fetchOverview]);

  const handleRefresh = () => {
    setRefreshing(true);
    setError("");
    fetchOverview();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    fetchOverview();
  };

  const totals = overview?.totals || {};
  const signupTotal = useMemo(
    () =>
      (overview?.signupSeries || []).reduce(
        (sum, entry) => sum + (Number(entry.count) || 0),
        0,
      ),
    [overview],
  );
  const deviceTotal = useMemo(
    () =>
      (overview?.deviceBreakdown || []).reduce(
        (sum, entry) => sum + (Number(entry.count) || 0),
        0,
      ),
    [overview],
  );
  const feedbackTotal = useMemo(
    () =>
      (overview?.feedbackByCategory || []).reduce(
        (sum, entry) => sum + (Number(entry.count) || 0),
        0,
      ),
    [overview],
  );

  return (
    <div className="space-y-6" aria-busy={loading || refreshing}>
      <AdminSectionHeading
        eyebrow="Dashboard"
        title="A live look at Bubbles"
        description="Users, presence, devices, conversations, and feedback in one place."
        action={
          <AdminButton
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <LuRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </AdminButton>
        }
      />

      {error && !overview ? (
        <AdminErrorState
          message={error}
          onRetry={handleRetry}
        />
      ) : null}

      {error && overview ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 self-start font-semibold underline underline-offset-2 sm:self-auto"
          >
            <LuRefreshCw />
            Retry
          </button>
        </div>
      ) : null}

      {loading && !overview ? <DashboardSkeleton /> : null}

      {overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              icon={LuUsers}
              label="Total users"
              value={formatNumber(totals.users)}
              hint={`${formatNumber(totals.verifiedUsers)} verified · ${formatNumber(totals.googleUsers)} Google`}
              tone="violet"
            />
            <AdminStatCard
              icon={LuWifi}
              label="Online now"
              value={formatNumber(totals.onlineUsers)}
              hint={`${formatNumber(totals.active24h)} active in the last 24h`}
              tone="emerald"
            />
            <AdminStatCard
              icon={LuUserPlus}
              label="New users (24h)"
              value={formatNumber(totals.newUsers24h)}
              hint={`${formatNumber(totals.newUsers7d)} in the last 7 days`}
              tone="amber"
            />
            <AdminStatCard
              icon={LuUserPlus}
              label="New users (7d)"
              value={formatNumber(totals.newUsers7d)}
              hint={`${formatNumber(totals.newUsers30d)} in the last 30 days`}
              tone="sky"
            />
            <AdminStatCard
              icon={LuActivity}
              label="Active users (24h)"
              value={formatNumber(totals.active24h)}
              hint={`${formatNumber(totals.onlineUsers)} online right now`}
              tone="emerald"
            />
            <AdminStatCard
              icon={LuInbox}
              label="Feedback"
              value={formatNumber(totals.feedback)}
              hint={`${formatNumber(totals.newFeedback)} new · ${formatNumber(totals.newFeedback24h)} in 24h`}
              tone="rose"
            />
            <AdminStatCard
              icon={LuMessageSquare}
              label="Messages (24h)"
              value={formatNumber(totals.messages24h)}
              hint={`${formatNumber(totals.messages)} all time`}
              tone="violet"
            />
            <AdminStatCard
              icon={LuPhone}
              label="Conversations"
              value={formatNumber(totals.chats)}
              hint={`${formatNumber(totals.groups)} groups · ${formatNumber(totals.calls)} calls`}
              tone="slate"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <AdminCard className="p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    New users
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Last 14 days · {formatNumber(signupTotal)} new accounts
                  </p>
                </div>
                <AdminBadge tone="violet">
                  <LuTrendingUp />
                  Growth
                </AdminBadge>
              </div>

              <div className="mt-4">
                <AdminSignupChart data={overview.signupSeries || []} />
              </div>
            </AdminCard>

            <AdminCard className="p-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Devices
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Registered users by device type
                </p>
              </div>

              {deviceTotal > 0 ? (
                <div className="mt-5 space-y-4">
                  {(overview.deviceBreakdown || []).map((entry) => {
                    const Icon =
                      DEVICE_ICONS[entry.type] || LuCircleHelp;
                    const percent = getPercent(entry.count, deviceTotal);

                    return (
                      <div key={entry.type}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                            <Icon className="text-slate-500 dark:text-slate-400" />
                            {DEVICE_LABELS[entry.type] || "Unknown"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatNumber(entry.count)} · {percent}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Device data will appear after users sign in or open Bubbles.
                </div>
              )}

              <p className="mt-5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                One person can appear under more than one device type.
              </p>
            </AdminCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <AdminCard className="overflow-hidden xl:col-span-2">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Recent users
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    The newest accounts on Bubbles
                  </p>
                </div>
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                >
                  View all
                  <LuArrowUpRight />
                </Link>
              </div>

              {overview.recentUsers?.length ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overview.recentUsers.map((user) => (
                    <Link
                      key={user._id}
                      to={`/admin/users?user=${user._id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <AdminAvatar user={user} size="sm" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {getDisplayName(user)}
                          </p>
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              user.isOnline
                                ? "bg-emerald-500"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                            aria-label={
                              user.isOnline ? "Online" : "Offline"
                            }
                          />
                        </div>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.username ? `@${user.username}` : user.email}
                        </p>
                      </div>

                      <div className="hidden max-w-[190px] sm:block">
                        <AdminDeviceChips
                          devices={user.devices}
                          limit={1}
                        />
                      </div>

                      <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(user.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  icon={LuUsers}
                  title="No users yet"
                  description="New accounts will appear here as people join Bubbles."
                />
              )}
            </AdminCard>

            <AdminCard className="p-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Feedback categories
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  What people are talking about
                </p>
              </div>

              {feedbackTotal > 0 ? (
                <div className="mt-5 space-y-4">
                  {(overview.feedbackByCategory || []).map((entry) => {
                    const percent = getPercent(entry.count, feedbackTotal);
                    const tone = CATEGORY_TONES[entry.category] || "slate";

                    return (
                      <div key={entry.category}>
                        <div className="flex items-center justify-between gap-3">
                          <AdminBadge tone={tone}>
                            {CATEGORY_LABELS[entry.category] ||
                              entry.category}
                          </AdminBadge>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatNumber(entry.count)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              entry.category === "bug"
                                ? "bg-rose-500"
                                : entry.category === "feature"
                                  ? "bg-amber-500"
                                  : entry.category === "suggestion"
                                    ? "bg-violet-500"
                                    : "bg-slate-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Feedback categories will appear after the first message.
                </div>
              )}

              <Link
                to="/admin/feedback"
                className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
              >
                Open feedback inbox
                <LuArrowUpRight />
              </Link>
            </AdminCard>
          </div>

          <AdminCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent feedback
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The latest suggestions, bugs, and ideas
                </p>
              </div>
              <Link
                to="/admin/feedback"
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
              >
                View inbox
                <LuArrowUpRight />
              </Link>
            </div>

            {overview.recentFeedback?.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {overview.recentFeedback.map((item) => (
                  <Link
                    key={item._id}
                    to="/admin/feedback"
                    className="block px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminBadge
                        tone={
                          CATEGORY_TONES[item.category] || "slate"
                        }
                      >
                        {CATEGORY_LABELS[item.category] || item.category}
                      </AdminBadge>
                      <AdminBadge
                        tone={STATUS_TONES[item.status] || "slate"}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </AdminBadge>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {item.message}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.name || item.email || "Anonymous"}
                      {item.email ? ` · ${item.email}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                icon={LuInbox}
                title="No feedback yet"
                description="Feedback sent from the website or app will appear here."
              />
            )}
          </AdminCard>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
