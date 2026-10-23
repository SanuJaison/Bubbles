import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LuExternalLink,
  LuInbox,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMoon,
  LuSun,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useTheme } from "../../context/ThemeContext";
import { AdminAvatar } from "../../components/admin/AdminUI";

const NAV_ITEMS = [
  {
    to: "/admin",
    label: "Overview",
    icon: LuLayoutDashboard,
    end: true,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: LuUsers,
  },
  {
    to: "/admin/feedback",
    label: "Feedback",
    icon: LuInbox,
  },
];

const PAGE_TITLES = {
  "/admin": "Overview",
  "/admin/users": "Users",
  "/admin/feedback": "Feedback",
};

const SidebarContent = ({ admin, onNavigate, onLogout }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-3 px-5 py-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
        <img
          src="/bubbles-logo-144.png"
          alt=""
          className="h-full w-full object-contain"
        />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">Bubbles</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          Admin console
        </p>
      </div>
    </div>

    <nav className="flex-1 space-y-1 px-3" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white/10 text-white ring-1 ring-inset ring-white/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="text-lg opacity-80" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>

    <div className="space-y-3 border-t border-white/10 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
        <AdminAvatar user={admin} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {admin?.name || "Administrator"}
          </p>
          <p className="truncate text-xs text-white/45">{admin?.email}</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Sign out of admin"
        >
          <LuLogOut />
        </button>
      </div>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
      >
        View Bubbles
        <LuExternalLink />
      </a>
    </div>
  </div>
);

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = resolvedTheme === "dark";

  const pageTitle = PAGE_TITLES[location.pathname] || "Admin";

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell min-h-screen text-slate-900 dark:text-slate-100">
      <a
        href="#admin-main"
        className="sr-only rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] dark:bg-slate-900 dark:text-slate-100"
      >
        Skip to content
      </a>

      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col lg:flex">
        <SidebarContent
          admin={admin}
          onNavigate={() => setMenuOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close admin menu"
          />

          <aside className="admin-sidebar relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close admin menu"
            >
              <LuX />
            </button>

            <SidebarContent
              admin={admin}
              onNavigate={() => setMenuOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Open admin menu"
              >
                <LuMenu className="text-lg" />
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Bubbles admin
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {pageTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
                aria-label={
                  isDark ? "Switch to light theme" : "Switch to dark theme"
                }
                title={
                  isDark ? "Switch to light theme" : "Switch to dark theme"
                }
              >
                {isDark ? (
                  <LuSun className="text-lg" />
                ) : (
                  <LuMoon className="text-lg" />
                )}
              </button>

              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Admin session
              </span>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                <LuExternalLink />
                <span className="hidden sm:inline">View site</span>
              </a>
            </div>
          </div>
        </header>

        <main id="admin-main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
