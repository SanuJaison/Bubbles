import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuMenu,
  LuMoon,
  LuMonitor,
  LuSun,
  LuX,
} from "react-icons/lu";
import { useTheme } from "../../context/ThemeContext";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#preview", label: "Preview" },
  { href: "#download", label: "Download" },
  { href: "#faq", label: "FAQ" },
  { to: "/feedback", label: "Feedback" },
];

const ThemeButton = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const Icon =
    theme === "system" ? LuMonitor : resolvedTheme === "dark" ? LuMoon : LuSun;

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Theme: ${theme}. Switch to ${nextTheme}.`}
      title={`Theme: ${theme}`}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100/70 bg-white/60 text-muted transition hover:text-brand-600"
    >
      <Icon className="text-base" />
    </button>
  );
};

const LandingNav = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    desktop.addEventListener("change", handleChange);

    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  return (
    <header className="glass sticky top-0 z-50 border-b border-brand-100/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Bubbles home"
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffffff] p-1 shadow-sm">
            <img
              src="/bubbles-logo-72.png"
              srcSet="/bubbles-logo-72.png 1x, /bubbles-logo-144.png 2x"
              width="36"
              height="36"
              alt=""
              className="h-full w-full object-contain"
              decoding="async"
            />
          </span>

          <span className="brand-text text-xl font-bold">Bubbles</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-muted transition hover:text-brand-600"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted transition hover:text-brand-600"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeButton />

          <Link
            to="/login"
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:text-brand-600"
          >
            Sign in
          </Link>

          <Link
            to="/login"
            className="brand-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
          >
            Open web app
            <LuArrowRight className="text-sm" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeButton />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100/70 bg-white/60 text-ink transition hover:text-brand-600"
          >
            {open ? (
              <LuX className="text-lg" />
            ) : (
              <LuMenu className="text-lg" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-brand-100/60 bg-brand-50/95 px-4 py-4 backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              link.to ? (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-white/60 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-white/60 hover:text-brand-600"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>

          <div className="mt-3 grid gap-2 border-t border-brand-100/60 pt-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-400"
            >
              Sign in
            </Link>

            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="brand-gradient flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Open web app
              <LuArrowRight className="text-sm" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default LandingNav;
