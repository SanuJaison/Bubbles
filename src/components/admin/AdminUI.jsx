import {
  LuChevronLeft,
  LuChevronRight,
  LuLoaderCircle,
  LuRefreshCw,
} from "react-icons/lu";
import {
  formatNumber,
  getInitials,
} from "../../utils/adminFormat";

const STAT_TONES = {
  violet: {
    icon: "bg-violet-600 text-white",
    ring: "ring-violet-100 dark:ring-violet-500/20",
  },
  emerald: {
    icon: "bg-emerald-500 text-white",
    ring: "ring-emerald-100 dark:ring-emerald-500/20",
  },
  amber: {
    icon: "bg-amber-500 text-white",
    ring: "ring-amber-100 dark:ring-amber-500/20",
  },
  rose: {
    icon: "bg-rose-500 text-white",
    ring: "ring-rose-100 dark:ring-rose-500/20",
  },
  sky: {
    icon: "bg-sky-500 text-white",
    ring: "ring-sky-100 dark:ring-sky-500/20",
  },
  slate: {
    icon: "bg-slate-700 text-white",
    ring: "ring-slate-100 dark:ring-slate-500/20",
  },
};

const BADGE_TONES = {
  slate:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  violet:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  rose:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
  sky:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
  blue:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
};

const BUTTON_VARIANTS = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:bg-violet-300 dark:bg-violet-500 dark:shadow-none dark:hover:bg-violet-400 dark:disabled:bg-violet-500/40",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800 dark:disabled:text-slate-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:text-slate-600",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 dark:bg-rose-500 dark:hover:bg-rose-400 dark:disabled:bg-rose-500/40",
};

export const AdminCard = ({ className = "", children, ...props }) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
    {...props}
  >
    {children}
  </section>
);

export const AdminButton = ({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const AdminSectionHeading = ({
  eyebrow,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const AdminStatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "violet",
}) => {
  const palette = STAT_TONES[tone] || STAT_TONES.violet;

  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-4 ${palette.icon} ${palette.ring}`}
        >
          <Icon className="text-xl" aria-hidden="true" />
        </span>
      </div>
    </AdminCard>
  );
};

export const AdminBadge = ({ tone = "slate", children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${BADGE_TONES[tone] || BADGE_TONES.slate}`}
  >
    {children}
  </span>
);

export const AdminAvatar = ({ user, size = "md" }) => {
  const sizeClasses =
    size === "lg"
      ? "h-14 w-14 text-base"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-11 w-11 text-sm";

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt=""
        className={`${sizeClasses} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 ring-2 ring-white shadow-sm`}
    >
      {getInitials(user?.name, user?.email)}
    </span>
  );
};

export const AdminPagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.total === 0) {
    return null;
  }

  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {from}
        </span>
        –
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {formatNumber(total)}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
          aria-label="Previous page"
        >
          <LuChevronLeft />
        </button>

        <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          Page {page} of {Math.max(pages, 1)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
          aria-label="Next page"
        >
          <LuChevronRight />
        </button>
      </div>
    </div>
  );
};

export const AdminEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    {Icon ? (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="text-2xl" />
      </span>
    ) : null}
    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
      {title}
    </h3>
    {description ? (
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const AdminErrorState = ({ message, onRetry }) => (
  <AdminCard className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
      <LuRefreshCw className="text-xl" />
    </span>
    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
      Something went wrong
    </h3>
    <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
      {message || "The admin data could not be loaded."}
    </p>
    {onRetry ? (
      <AdminButton
        variant="secondary"
        className="mt-5"
        onClick={onRetry}
      >
        <LuRefreshCw />
        Try again
      </AdminButton>
    ) : null}
  </AdminCard>
);

export const AdminSkeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
    aria-hidden="true"
  />
);

export const AdminSpinner = ({ className = "" }) => (
  <LuLoaderCircle
    className={`animate-spin ${className}`}
    aria-hidden="true"
  />
);
