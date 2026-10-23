import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBug,
  LuCheck,
  LuCircleCheckBig,
  LuLightbulb,
  LuLoaderCircle,
  LuMessageCircle,
  LuSend,
  LuShieldCheck,
  LuSparkles,
} from "react-icons/lu";
import PublicFooter from "../components/PublicFooter";
import { useAuth } from "../context/AuthContext";
import usePageMeta from "../hooks/usePageMeta";
import { submitFeedbackAPI } from "../service/api";

const CATEGORIES = [
  {
    value: "suggestion",
    label: "Suggestion",
    description: "An idea that would make Bubbles better.",
    icon: LuMessageCircle,
  },
  {
    value: "bug",
    label: "Bug report",
    description: "Something is broken or not working as expected.",
    icon: LuBug,
  },
  {
    value: "feature",
    label: "Feature idea",
    description: "Something new you would love to see.",
    icon: LuLightbulb,
  },
  {
    value: "other",
    label: "Something else",
    description: "Anything that does not fit the options above.",
    icon: LuSparkles,
  },
];

const REASONS = [
  {
    icon: LuLightbulb,
    title: "Share an idea",
    description: "A small tweak or a big feature — both are welcome.",
  },
  {
    icon: LuBug,
    title: "Report a bug",
    description: "Tell us what happened and what you expected instead.",
  },
  {
    icon: LuMessageCircle,
    title: "Say what feels off",
    description: "Confusing flows and rough edges are worth fixing too.",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_MESSAGE_LENGTH = 2000;

const Feedback = () => {
  const { user } = useAuth();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const [form, setForm] = useState({
    category: "suggestion",
    message: "",
    website: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  usePageMeta({
    title: "Feedback | Bubbles",
    description:
      "Share a suggestion, report a bug, or tell us what would make Bubbles better. No account needed.",
    path: "/feedback",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    // These two fields are uncontrolled so an auth refresh can prefill them
    // without triggering a cascading render. Never overwrite something the
    // person has already typed.
    if (nameRef.current && !nameRef.current.value) {
      nameRef.current.value = user.name || "";
    }

    if (emailRef.current && !emailRef.current.value) {
      emailRef.current.value = user.email || "";
    }
  }, [user]);

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  const updateField = (field) => (event) => {
    const { value } = event.target;

    setForm((current) => ({ ...current, [field]: value }));

    clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status === "submitting") {
      return;
    }

    const name = nameRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";
    const message = form.message.trim();

    if (message.length < 5) {
      setError(
        "Please add a little more detail so we can understand your feedback.",
      );
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Please keep your feedback under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`,
      );
      return;
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      setError("Please enter a valid email address, or leave it blank.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      await submitFeedbackAPI({
        name,
        email,
        category: form.category,
        message,
        page: "/feedback",
        source: "web",
        website: form.website,
      });

      setStatus("success");
      setForm((current) => ({
        ...current,
        category: "suggestion",
        message: "",
        website: "",
      }));
    } catch (requestError) {
      setStatus("idle");
      setError(
        requestError.response?.data?.message ||
          "We could not send your feedback. Please try again.",
      );
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setError("");
  };

  return (
    <div className="landing-page auth-shell relative min-h-screen text-ink">
      <a
        href="#feedback-main"
        className="sr-only rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-400/20 blur-[110px] dark:bg-brand-500/20" />
        <div className="absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-blush-400/20 blur-[110px] dark:bg-blush-500/15" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted transition hover:text-brand-600"
          >
            <LuArrowLeft className="text-base" />
            Back to Bubbles
          </Link>

          <Link
            to="/"
            aria-label="Bubbles home"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
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

            <span className="brand-text text-lg font-bold">Bubbles</span>
          </Link>
        </header>

        <main
          id="feedback-main"
          tabIndex={-1}
          className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12"
        >
          <section className="lg:pt-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">
              Feedback
            </p>

            <h1 className="mt-3 max-w-lg text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
              Help shape <span className="brand-text">Bubbles.</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-muted">
              Found a bug, have an idea, or noticed something that could feel
              better? Tell us. Every message helps decide what to improve next.
            </p>

            <ul className="mt-8 space-y-4">
              {REASONS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-100/70 bg-white/60 text-brand-600 shadow-sm">
                    <Icon className="text-lg" />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-muted">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-brand-100/70 bg-brand-50/60 p-4 text-sm leading-6 text-muted">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <LuShieldCheck className="text-brand-600" />
                No account needed
              </p>
              <p className="mt-1.5">
                Your email is optional and only used to follow up. Read the{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-brand-600 underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="glass-strong rounded-3xl border border-brand-100/70 p-5 shadow-soft sm:p-8">
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-[28rem] flex-col items-center justify-center text-center"
              >
                <span className="brand-gradient flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-glow">
                  <LuCircleCheckBig className="text-3xl" />
                </span>

                <h2 className="mt-5 text-2xl font-bold">Thanks for sharing</h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Your feedback is in. It will help make Bubbles better for
                  everyone.
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-400"
                  >
                    Send another
                  </button>

                  <Link
                    to="/"
                    className="brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
                  >
                    Back to Bubbles
                    <LuArrowRight />
                  </Link>
                </div>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              noValidate
              className={status === "success" ? "hidden" : "space-y-6"}
            >
                <div>
                  <h2 className="text-xl font-bold">Tell us what you think</h2>
                  <p className="mt-1 text-sm text-muted">
                    A few details help us act on it faster.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-ink">
                    Name{" "}
                    <span className="font-normal text-muted">(optional)</span>
                    <input
                      ref={nameRef}
                      type="text"
                      name="name"
                      onChange={clearError}
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Your name"
                      className="mt-2 w-full rounded-xl border border-brand-100/80 bg-white/70 px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-ink">
                    Email{" "}
                    <span className="font-normal text-muted">(optional)</span>
                    <input
                      ref={emailRef}
                      type="email"
                      name="email"
                      onChange={clearError}
                      maxLength={254}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-brand-100/80 bg-white/70 px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">
                    What is this about?
                  </legend>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {CATEGORIES.map(
                      ({ value, label, description, icon: Icon }) => {
                        const selected = form.category === value;

                        return (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-brand-400 focus-within:ring-offset-2 ${
                              selected
                                ? "border-brand-400 bg-brand-50/80 shadow-sm"
                                : "border-brand-100/70 bg-white/60 hover:border-brand-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={value}
                              checked={selected}
                              onChange={updateField("category")}
                              className="sr-only"
                            />

                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                selected
                                  ? "brand-gradient text-white"
                                  : "bg-brand-50 text-brand-600"
                              }`}
                            >
                              <Icon className="text-base" />
                            </span>

                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-ink">
                                {label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-muted">
                                {description}
                              </span>
                            </span>

                            {selected ? (
                              <LuCheck className="mt-1 ml-auto shrink-0 text-brand-600" />
                            ) : null}
                          </label>
                        );
                      },
                    )}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink">
                    <span>Your feedback</span>
                    <span className="text-xs font-normal text-muted">
                      {form.message.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </span>

                  <textarea
                    name="message"
                    value={form.message}
                    onChange={updateField("message")}
                    required
                    minLength={5}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={6}
                    placeholder="What should we improve? If you are reporting a bug, what did you do, and what happened?"
                    aria-describedby="feedback-message-hint"
                    className="mt-2 w-full resize-y rounded-xl border border-brand-100/80 bg-white/70 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </label>

                <p
                  id="feedback-message-hint"
                  className="-mt-3 text-xs leading-5 text-muted"
                >
                  Be as specific as you like. Steps, screenshots, or examples
                  help if you are reporting a bug.
                </p>

                <div className="sr-only" aria-hidden="true">
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={updateField("website")}
                    />
                  </label>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {error}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "submitting" ? (
                      <>
                        <LuLoaderCircle className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <LuSend />
                        Send feedback
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-muted">
                    Your message goes straight to the person building Bubbles.
                  </p>
                </div>
            </form>
          </section>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
};

export default Feedback;
