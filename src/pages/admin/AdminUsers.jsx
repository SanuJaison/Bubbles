import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LuChevronRight,
  LuRefreshCw,
  LuSearch,
  LuShieldCheck,
  LuUsers,
  LuX,
} from "react-icons/lu";
import AdminDeviceChips from "../../components/admin/AdminDeviceChips";
import AdminUserDrawer from "../../components/admin/AdminUserDrawer";
import {
  AdminAvatar,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminPagination,
  AdminSectionHeading,
  AdminSkeleton,
} from "../../components/admin/AdminUI";
import { useAdminAuth } from "../../context/AdminAuthContext";
import usePageMeta from "../../hooks/usePageMeta";
import { getAdminUsersAPI } from "../../service/adminAPI";
import {
  formatDate,
  formatNumber,
  formatRelativeTime,
  getDisplayName,
} from "../../utils/adminFormat";

const PAGE_SIZE = 20;

const UsersSkeleton = () => (
  <AdminCard className="overflow-hidden" aria-hidden="true">
    <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
      <AdminSkeleton className="h-5 w-28" />
      <AdminSkeleton className="mt-2 h-3 w-40" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <AdminSkeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1">
            <AdminSkeleton className="h-4 w-40" />
            <AdminSkeleton className="mt-2 h-3 w-56" />
          </div>
          <AdminSkeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <AdminSkeleton className="hidden h-6 w-28 rounded-full md:block" />
        </div>
      ))}
    </div>
  </AdminCard>
);

const AdminUsers = () => {
  const { token, logout } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const selectedUserId = searchParams.get("user") || "";

  usePageMeta({
    title: "Users | Bubbles Admin",
    description: "Private Bubbles user and device overview.",
    path: "/admin/users",
    robots: "noindex,nofollow",
  });

  const openUser = useCallback(
    (userId) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("user", userId);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closeUser = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("user");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await getAdminUsersAPI(
        {
          search: debouncedSearch,
          status: statusFilter,
          device: deviceFilter,
          sort,
          page,
          limit: PAGE_SIZE,
        },
        { Authorization: `Bearer ${token}` },
      );

      setUsers(response.data?.users || []);
      setPagination(response.data?.pagination || null);
      setError("");
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401 || status === 403) {
        logout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Users could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    token,
    debouncedSearch,
    statusFilter,
    deviceFilter,
    sort,
    page,
    logout,
  ]);

  useEffect(() => {
    // Initial data fetch; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    setError("");
    fetchUsers();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    fetchUsers();
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === page) {
      return;
    }

    setRefreshing(true);
    setError("");
    setPage(nextPage);
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setDeviceFilter("");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = Boolean(
    search || statusFilter || deviceFilter || sort !== "newest",
  );

  const selectClasses =
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none dark:focus:border-violet-500 dark:focus:ring-violet-500/20";

  return (
    <div className="space-y-6">
      <AdminSectionHeading
        eyebrow="People"
        title="Users"
        description="Everyone who has joined Bubbles, their presence, and the devices they use."
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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, username, or email"
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
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={selectClasses}
            >
              <option value="">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by device</span>
            <select
              value={deviceFilter}
              onChange={(event) => {
                setDeviceFilter(event.target.value);
                setPage(1);
              }}
              className={selectClasses}
            >
              <option value="">All devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Sort users</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className={selectClasses}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="active">Recently active</option>
            </select>
          </label>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pagination
                ? `${formatNumber(pagination.total)} matching account${
                    pagination.total === 1 ? "" : "s"
                  }`
                : "Filtering users"}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </AdminCard>

      {error && !users.length ? (
        <AdminErrorState message={error} onRetry={handleRetry} />
      ) : null}

      {error && users.length > 0 ? (
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

      {loading && !users.length ? <UsersSkeleton /> : null}

      {!loading && !error && users.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            icon={LuUsers}
            title="No users found"
            description="Try a different search or clear the filters."
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

      {users.length > 0 ? (
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                All users
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {pagination
                  ? `${formatNumber(pagination.total)} account${
                      pagination.total === 1 ? "" : "s"
                    }`
                  : "Accounts"}
              </p>
            </div>
            {loading || refreshing ? (
              <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <LuRefreshCw className="animate-spin" />
                Updating
              </span>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Devices
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Last active
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Open details</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => openUser(user._id)}
                    className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AdminAvatar user={user} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                              {getDisplayName(user)}
                            </p>
                            {user.emailVerified ? (
                              <LuShieldCheck
                                className="shrink-0 text-emerald-500"
                                aria-label="Email verified"
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {user.username
                              ? `@${user.username}`
                              : user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <AdminBadge
                        tone={user.isOnline ? "emerald" : "slate"}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isOnline
                              ? "bg-emerald-500"
                              : "bg-slate-400 dark:bg-slate-500"
                          }`}
                        />
                        {user.isOnline ? "Online" : "Offline"}
                      </AdminBadge>
                    </td>

                    <td className="px-4 py-4">
                      <AdminDeviceChips devices={user.devices} limit={2} />
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {user.isOnline
                        ? "Online now"
                        : formatRelativeTime(user.lastActiveAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openUser(user._id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label={`Open details for ${getDisplayName(
                          user,
                        )}`}
                      >
                        <LuChevronRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openUser(user._id)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <AdminAvatar user={user} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {getDisplayName(user)}
                    </p>
                    {user.emailVerified ? (
                      <LuShieldCheck
                        className="shrink-0 text-emerald-500"
                        aria-label="Email verified"
                      />
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user.username ? `@${user.username}` : user.email}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AdminBadge
                      tone={user.isOnline ? "emerald" : "slate"}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </AdminBadge>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user.isOnline
                        ? "Online now"
                        : formatRelativeTime(user.lastActiveAt)}
                    </span>
                  </div>

                  <div className="mt-2">
                    <AdminDeviceChips devices={user.devices} limit={2} />
                  </div>
                </div>

                <LuChevronRight className="mt-1 shrink-0 text-slate-500 dark:text-slate-400" />
              </button>
            ))}
          </div>

          <AdminPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </AdminCard>
      ) : null}

      <AdminUserDrawer userId={selectedUserId} onClose={closeUser} />
    </div>
  );
};

export default AdminUsers;
