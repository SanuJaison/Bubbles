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
    ring: "ring-violet-100",
  },
  emerald: {
    icon: "bg-emerald-500 text-white",
    ring: "ring-emerald-100",
  },
  amber: {
    icon: "bg-amber-500 text-white",
    ring: "ring-amber-100",
  },
  rose: {
    icon: "bg-rose-500 text-white",
    ring: "ring-rose-100",
  },
  sky: {
    icon: "bg-sky-500 text-white",
    ring: "ring-sky-100",
  },
  slate: {
    icon: "bg-slate-700 text-white",
    ring: "ring-slate-100",
  },
};

const BADGE_TONES = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

const BUTTON_VARIANTS = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:bg-violet-300",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:text-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
};

export const AdminCard = ({ className = "", children, ...props }) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] ${className}`}
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
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
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> of{" "}
        <span className="font-semibold text-slate-700">
          {formatNumber(total)}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Previous page"
        >
          <LuChevronLeft />
        </button>

        <span className="px-2 text-xs font-medium text-slate-500">
          Page {page} of {Math.max(pages, 1)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
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
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="text-2xl" />
      </span>
    ) : null}
    <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
    {description ? (
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const AdminErrorState = ({ message, onRetry }) => (
  <AdminCard className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <LuRefreshCw className="text-xl" />
    </span>
    <h3 className="mt-4 text-base font-semibold text-slate-900">
      Something went wrong
    </h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">
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
    className={`animate-pulse rounded-xl bg-slate-100 ${className}`}
    aria-hidden="true"
  />
);

export const AdminSpinner = ({ className = "" }) => (
  <LuLoaderCircle
    className={`animate-spin ${className}`}
    aria-hidden="true"
  />
);
