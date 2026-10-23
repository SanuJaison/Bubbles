import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import bubbles from "../assets/bubbles.png";

const LegalPage = ({ title, updated, children }) => (
  <div className="auth-shell min-h-screen px-4 py-10 text-ink">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted hover:text-brand-600"
        >
          <LuArrowLeft className="text-base" /> Back to Bubbles
        </Link>

        <Link to="/" aria-label="Bubbles home">
          <img width={110} src={bubbles} alt="Bubbles" />
        </Link>
      </div>

      <article className="glass-strong rounded-3xl border border-brand-100/70 p-6 shadow-soft sm:p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted">Last updated: {updated}</p>

        <div className="mt-6 space-y-5 text-sm leading-7 text-muted [&_a]:text-brand-600 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
          {children}
        </div>
      </article>

      <div className="mt-6 text-center text-xs text-muted">
        <Link to="/privacy" className="hover:text-brand-600">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-brand-600">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link to="/feedback" className="hover:text-brand-600">
          Feedback
        </Link>
      </div>
    </div>
  </div>
);

export default LegalPage;
