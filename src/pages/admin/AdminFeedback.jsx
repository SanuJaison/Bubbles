import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  LuBug,
  LuCalendar,
  LuGlobe,
  LuInbox,
  LuLightbulb,
  LuMail,
  LuMessageCircle,
  LuRefreshCw,
  LuSearch,
  LuSparkles,
  LuX,
} from "react-icons/lu";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPagination,
  AdminSectionHeading,
  AdminSkeleton,
  AdminSpinner,
} from "../../components/admin/AdminUI";
import { useAdminAuth } from "../../context/AdminAuthContext";
import usePageMeta from "../../hooks/usePageMeta";
import {
  getAdminFeedbackAPI,
  updateAdminFeedbackStatusAPI,
} from "../../service/adminAPI";
import {
  CATEGORY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "../../utils/adminFormat";

const PAGE_SIZE = 20;

const CATEGORY_META = {
  suggestion: {
    label: "Suggestion",
    tone: "violet",
    icon: LuMessageCircle,
  },
  bug: {
    label: "Bug report",
    tone: "rose",
    icon: LuBug,
  },
  feature: {
    label: "Feature idea",
    tone: "amber",
    icon: LuLightbulb,
  },
  other: {
    label: "Something else",
    tone: "slate",
    icon: LuSparkles,
  },
};

const STATUS_META = {
  new: { label: "New", tone: "blue" },
  reviewed: { label: "Reviewed", tone: "emerald" },
  archived: { label: "Archived", tone: "slate" },
};

const STATUS_ORDER = ["new", "reviewed", "archived"];

const FeedbackSkeleton = () => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: 4 }).map((_, index) => (
      <AdminCard key={index} className="p-5">
        <div className="flex items-center gap-2">
          <AdminSkeleton className="h-6 w-24 rounded-full" />
          <AdminSkeleton className="h-6 w-16 rounded-full" />
          <AdminSkeleton className="h-3 w-20" />
        </div>
        <AdminSkeleton className="mt-4 h-4 w-full" />
        <AdminSkeleton className="mt-2 h-4 w-4/5" />
        <AdminSkeleton className="mt-4 h-3 w-64" />
      </AdminCard>
    ))}
  </div>
);

const AdminFeedback = () => {
  const { token, logout } = useAdminAuth();

  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  usePageMeta({
    title: "Feedback | Bubbles Admin",
    description: "Private Bubbles feedback inbox.",
    path: "/admin/feedback",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchFeedback = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await getAdminFeedbackAPI(
        {
          search: debouncedSearch,
          category: categoryFilter,
          status: statusFilter,
          page,
          limit: PAGE_SIZE,
        },
        { Authorization: `Bearer ${token}` },
      );

      setFeedback(response.data?.feedback || []);
      setPagination(response.data?.pagination || null);
      setSummary(response.data?.summary || null);
      setError("");
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401 || status === 403) {
        logout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Feedback could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    token,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    page,
    logout,
  ]);

  useEffect(() => {
    // Initial data fetch; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeedback();
  }, [fetchFeedback]);

  const handleRefresh = () => {
    setRefreshing(true);
    setError("");
    fetchFeedback();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    fetchFeedback();
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === page) {
      return;
    }

    setRefreshing(true);
    setError("");
    setPage(nextPage);
  };

  const statusCounts = useMemo(
    () => summary?.byStatus || {},
    [summary],
  );

  const hasFilters = Boolean(search || categoryFilter || statusFilter);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleStatusChange = async (feedbackId, nextStatus) => {
    if (!feedbackId || !nextStatus || updatingId) {
      return;
    }

    const previousStatus = feedback.find(
      (item) => item._id === feedbackId,
    )?.status;

    if (!previousStatus || previousStatus === nextStatus) {
      return;
    }

    setUpdatingId(feedbackId);

    try {
      const response = await updateAdminFeedbackStatusAPI(
        feedbackId,
        nextStatus,
        { Authorization: `Bearer ${token}` },
      );
      const updated = response.data?.feedback;

      if (updated) {
        setFeedback((current) =>
          current.map((item) =>
            item._id === feedbackId ? updated : item,
          ),
        );
      }

      setSummary((current) => {
        if (!current) {
          return current;
        }

        const byStatus = { ...current.byStatus };

        byStatus[previousStatus] = Math.max(
          0,
          (byStatus[previousStatus] || 0) - 1,
        );
        byStatus[nextStatus] = (byStatus[nextStatus] || 0) + 1;

        return { ...current, byStatus };
      });

      toast.success(
        `Feedback marked as ${STATUS_LABELS[nextStatus] || nextStatus}.`,
      );

      if (statusFilter && nextStatus !== statusFilter) {
        setRefreshing(true);
        await fetchFeedback();
      }
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401 || status === 403) {
        logout();
        return;
      }

      toast.error(
        requestError.response?.data?.message ||
          "The feedback status could not be updated.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const selectClasses =
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50 disabled:cursor-wait disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none dark:focus:border-violet-500 dark:focus:ring-violet-500/20 dark:disabled:bg-slate-800";

  return (
    <div className="space-y-6">
      <AdminSectionHeading
        eyebrow="Inbox"
        title="Feedback"
        description="Every suggestion, bug report, and idea people have sent through Bubbles."
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

      <AdminCard className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <span className="sr-only">Search feedback</span>
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search message, name, or email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-400 dark:focus:border-violet-500 dark:focus:ring-violet-500/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Clear search"
              >
                <LuX />
              </button>
            ) : null}
          </label>

          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className={selectClasses}
            >
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${
              statusFilter === ""
                ? "bg-slate-900 text-white ring-slate-900 dark:bg-violet-600 dark:ring-violet-600"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            All
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                statusFilter === ""
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {formatNumber(summary?.total || 0)}
            </span>
          </button>

          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];

            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${
                  statusFilter === status
                    ? "bg-violet-600 text-white ring-violet-600 dark:bg-violet-500 dark:ring-violet-500"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                {meta.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    statusFilter === status
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {formatNumber(statusCounts[status] || 0)}
                </span>
              </button>
            );
          })}

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-200"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </AdminCard>

      {error && !feedback.length ? (
        <AdminErrorState message={error} onRetry={handleRetry} />
      ) : null}

      {error && feedback.length > 0 ? (
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

      {loading && !feedback.length ? <FeedbackSkeleton /> : null}

      {!loading && !error && feedback.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon={LuInbox}
            title="No feedback found"
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Feedback sent from the website or app will appear here."
            }
            action={
              hasFilters ? (
                <AdminButton variant="secondary" onClick={resetFilters}>
                  Clear filters
                </AdminButton>
              ) : null
            }
          />
        </AdminCard>
      ) : null}

      {feedback.length > 0 ? (
        <>
          <div className="space-y-3">
            {feedback.map((item) => {
              const category =
                CATEGORY_META[item.category] || CATEGORY_META.other;
              const statusMeta =
                STATUS_META[item.status] || STATUS_META.new;
              const CategoryIcon = category.icon;
              const isUpdating = updatingId === item._id;

              return (
                <AdminCard key={item._id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <CategoryIcon />
                      </span>
                      <AdminBadge tone={category.tone}>
                        {category.label}
                      </AdminBadge>
                      <AdminBadge tone={statusMeta.tone}>
                        {statusMeta.label}
                      </AdminBadge>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUpdating ? (
                        <AdminSpinner className="text-slate-500 dark:text-slate-400" />
                      ) : null}
                      <select
                        value={item.status}
                        onChange={(event) =>
                          handleStatusChange(
                            item._id,
                            event.target.value,
                          )
                        }
                        disabled={Boolean(updatingId)}
                        className={selectClasses}
                        aria-label="Change feedback status"
                      >
                        {STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {item.message}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <LuMail className="text-slate-500 dark:text-slate-400" />
                      {item.name || item.email || "Anonymous"}
                      {item.name && item.email ? (
                        <a
                          href={`mailto:${item.email}`}
                          className="text-violet-700 dark:text-violet-300 hover:underline"
                        >
                          {item.email}
                        </a>
                      ) : null}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <LuCalendar className="text-slate-500 dark:text-slate-400" />
                      {formatDate(item.createdAt, { withTime: true })}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <LuGlobe className="text-slate-500 dark:text-slate-400" />
                      {SOURCE_LABELS[item.source] || item.source}
                      {item.page ? ` · ${item.page}` : ""}
                    </span>
                  </div>
                </AdminCard>
              );
            })}
          </div>

          <AdminCard className="overflow-hidden">
            <AdminPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </AdminCard>
        </>
      ) : null}
    </div>
  );
};

export default AdminFeedback;
