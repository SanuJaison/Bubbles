import { Link } from "react-router-dom";
import { LuArrowUp } from "react-icons/lu";

const LandingFooter = () => (
  <footer className="relative z-10 border-t border-brand-100/60 bg-brand-50/40">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffffff] p-1 shadow-sm">
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

          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Real-time conversations, groups, voice notes, AI replies, and calls
            — in one place.
          </p>

          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-100/70 bg-white/60 px-3 py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Web app live · Windows &amp; Android in development
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Product</p>

          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <a href="#features" className="transition hover:text-brand-600">
                Features
              </a>
            </li>
            <li>
              <a href="#preview" className="transition hover:text-brand-600">
                Preview
              </a>
            </li>
            <li>
              <a href="#download" className="transition hover:text-brand-600">
                Download
              </a>
            </li>
            <li>
              <a href="#faq" className="transition hover:text-brand-600">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">More</p>

          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link to="/privacy" className="transition hover:text-brand-600">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition hover:text-brand-600">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="transition hover:text-brand-600">
                Feedback
              </Link>
            </li>
            <li>
              <Link to="/login" className="transition hover:text-brand-600">
                Open web app
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-brand-100/60 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Bubbles. Built with React, Node.js, and
          MongoDB.
        </p>

        <a
          href="#top"
          className="inline-flex items-center gap-1.5 transition hover:text-brand-600"
        >
          Back to top
          <LuArrowUp />
        </a>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
