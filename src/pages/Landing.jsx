import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuAppWindow,
  LuArrowRight,
  LuCheck,
  LuChevronDown,
  LuDownload,
  LuFileText,
  LuGlobe,
  LuLaptop,
  LuLock,
  LuMessageCircle,
  LuMic,
  LuMonitor,
  LuPalette,
  LuShieldCheck,
  LuSmartphone,
  LuSparkles,
  LuUsers,
  LuVideo,
  LuZap,
} from "react-icons/lu";
import LandingFooter from "../components/landing/LandingFooter";
import LandingNav from "../components/landing/LandingNav";
import Avatar from "../components/landing/Avatar";
import {
  DesktopPreview,
  PhonePreview,
} from "../components/landing/ProductPreview";
import { AVATAR_GRADIENTS } from "../constants/avatars";
import {
  APP_VERSION,
  DOWNLOAD_LINKS,
  RELEASE_DATE,
} from "../constants/downloads";
import useLandingMotion from "../hooks/useLandingMotion";
import usePageMeta from "../hooks/usePageMeta";

const TRUST_ITEMS = [
  { icon: LuZap, label: "Real-time by default" },
  { icon: LuUsers, label: "Groups & voice notes" },
  { icon: LuSparkles, label: "AI that helps" },
  { icon: LuVideo, label: "Calls on web" },
  { icon: LuLock, label: "Private conversations" },
];

const FEATURES = [
  {
    icon: LuMessageCircle,
    title: "Real-time conversations",
    description:
      "Messages arrive instantly with typing, delivery, and read states, so conversations feel natural.",
    tone: "from-brand-500 to-blush-400",
    badge: "Live on web",
  },
  {
    icon: LuUsers,
    title: "Groups that stay organized",
    description:
      "Create groups, add members, manage admins, and keep every conversation in one place.",
    tone: "from-coral-400 to-brand-400",
    badge: "Live on web",
  },
  {
    icon: LuMic,
    title: "Voice notes and files",
    description:
      "Record a quick thought or share photos, documents, and links without leaving the chat.",
    tone: "from-emerald-400 to-teal-500",
    badge: "Live on web",
  },
  {
    icon: LuSparkles,
    title: "Bubbles AI",
    description:
      "Summaries, reply ideas, and answers that help you move the conversation forward.",
    tone: "from-brand-500 via-brand-400 to-blush-400",
    badge: "Live on web",
  },
  {
    icon: LuVideo,
    title: "Calls on the web",
    description:
      "Start a voice or video call from any conversation, right in your browser.",
    tone: "from-amber-400 to-coral-400",
    badge: "Android soon",
  },
  {
    icon: LuPalette,
    title: "Make it yours",
    description:
      "Light, dark, or system theme, plus wallpapers and message styles that match your mood.",
    tone: "from-blush-400 to-coral-400",
    badge: "Live on web",
  },
];

const FAQS = [
  {
    question: "Is Bubbles free?",
    answer:
      "Yes. Bubbles is free to use. It started as a personal project, and anyone is welcome to use it.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Yes. You can sign up with email or Google. New email accounts need to verify their address before signing in.",
  },
  {
    question: "Are calls available?",
    answer:
      "Voice and video calls work in the web app today. The Android app will show the call buttons from the first release; mobile calling is coming in a later update.",
  },
  {
    question: "Can I use Bubbles on my phone now?",
    answer:
      "Yes. Open the web app in your mobile browser. The native Android app is in development.",
  },
  {
    question: "How will I install the Android app?",
    answer:
      "When the APK is released, download it, open it, and allow installs from your browser if Android asks. The Play Store release can come later.",
  },
  {
    question: "Will there be an iOS app?",
    answer:
      "Maybe later. iOS builds need a Mac and an Apple Developer account, so Android and Windows come first.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your chats are only shown to the people in the conversation. Read the Privacy Policy for the full details.",
  },
  {
    question: "How do I report a bug?",
    answer:
      "Use the contact details on the Privacy Policy page. Include what you were doing and what went wrong.",
  },
];

const SectionHeading = ({ eyebrow, title, description }) => (
  <div data-reveal className="mx-auto max-w-2xl text-center">
    <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">
      {eyebrow}
    </p>

    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
      {title}
    </h2>

    <p className="mt-4 text-base leading-7 text-muted">{description}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, tone, badge }) => (
  <article className="glass-strong flex h-full flex-col rounded-3xl border border-brand-100/70 p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
    <div className="flex items-start justify-between gap-3">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${tone} text-white shadow-sm`}
      >
        <Icon className="text-lg" />
      </span>

      <span className="rounded-full border border-brand-100/70 bg-brand-50/70 px-2.5 py-1 text-[10px] font-semibold text-brand-600">
        {badge}
      </span>
    </div>

    <h3 className="mt-5 text-lg font-semibold">{title}</h3>

    <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
  </article>
);

const DownloadCard = ({
  icon: Icon,
  title,
  subtitle,
  points,
  href,
  tone,
  primaryLabel,
}) => {
  const available = Boolean(href);

  return (
    <article className="glass-strong flex h-full flex-col rounded-3xl border border-brand-100/70 p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${tone} text-white shadow-sm`}
        >
          <Icon className="text-xl" />
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            available
              ? "bg-emerald-500/15 text-emerald-600"
              : "border border-brand-100/70 bg-brand-50/70 text-brand-600"
          }`}
        >
          {available ? "Download" : "In development"}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-bold">{title}</h3>

      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      <ul className="mt-5 space-y-2 text-sm text-muted">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <LuCheck className="mt-0.5 shrink-0 text-emerald-500" />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {available ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
          >
            <LuDownload />
            {primaryLabel}
          </a>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm font-semibold text-muted"
            >
              <LuDownload />
              Coming soon
            </button>

            <p className="text-center text-xs font-medium text-muted">
              The first build will be announced here.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

const WebCard = () => (
  <article className="glass-strong relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-200/80 p-6 shadow-soft">
    <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full brand-gradient opacity-10 blur-2xl" />

    <div className="flex items-start justify-between gap-3">
      <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm">
        <LuGlobe className="text-xl" />
      </span>

      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
        Live now
      </span>
    </div>

    <h3 className="mt-5 text-xl font-bold">Bubbles Web</h3>

    <p className="mt-1 text-sm text-muted">Any modern browser</p>

    <ul className="mt-5 space-y-2 text-sm text-muted">
      <li className="flex items-start gap-2">
        <LuCheck className="mt-0.5 shrink-0 text-emerald-500" />
        Full experience today
      </li>
      <li className="flex items-start gap-2">
        <LuCheck className="mt-0.5 shrink-0 text-emerald-500" />
        Calls, AI, groups, and files
      </li>
      <li className="flex items-start gap-2">
        <LuCheck className="mt-0.5 shrink-0 text-emerald-500" />
        No install required
      </li>
    </ul>

    <div className="mt-auto pt-6">
      <Link
        to="/login"
        className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
      >
        Open web app
        <LuArrowRight />
      </Link>
    </div>
  </article>
);

const InfoCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-3xl border border-brand-100/70 bg-brand-50/30 p-5">
    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
      <Icon className="text-brand-500" />
      {title}
    </div>

    <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
  </div>
);

const FaqItem = ({ question, answer, open, onToggle }) => {
  const panelId = `faq-${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

  return (
    <div className="glass-strong rounded-2xl border border-brand-100/70 p-5 shadow-soft">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-ink focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {question}
        <LuChevronDown
          className={`shrink-0 text-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        id={panelId}
        aria-hidden={!open}
        className={`grid transition-all duration-300 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="mt-3 text-sm leading-6 text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FloatingMessageCard = () => (
  <div
    data-float
    className="glass-strong absolute top-8 -left-4 hidden items-center gap-2 rounded-2xl border border-brand-100/70 px-3 py-2 shadow-soft xl:flex"
  >
    <Avatar
      initials="AR"
      gradient={AVATAR_GRADIENTS[0]}
      size="h-8 w-8"
      text="text-[9px]"
      online
    />

    <div>
      <p className="text-[10px] font-semibold text-ink">New message</p>
      <p className="text-[9px] text-muted">Ava: That sounds perfect ✨</p>
    </div>
  </div>
);

const FloatingAiCard = () => (
  <div
    data-float
    className="glass-strong absolute bottom-16 -left-6 hidden w-[210px] rounded-2xl border border-brand-100/70 p-3 shadow-soft xl:block"
  >
    <div className="flex items-center gap-2">
      <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-white">
        <LuSparkles className="text-sm" />
      </span>

      <div>
        <p className="text-[10px] font-semibold text-ink">Bubbles AI</p>
        <p className="text-[8px] text-muted">Summary ready</p>
      </div>
    </div>

    <p className="mt-2 text-[10px] leading-4 text-muted">
      “Ava shared the new landing page. You agreed to review it at 4 PM.”
    </p>
  </div>
);

const Landing = () => {
  const rootRef = useLandingMotion();
  const [openFaq, setOpenFaq] = useState(null);

  usePageMeta({
    title: "Bubbles | Chat, Calls & AI in One Place",
    description:
      "Bubbles is a real-time chat app with groups, voice notes, file sharing, AI replies, and web calls. Use it in your browser today; Windows and Android apps are on the way.",
    path: "/",
  });

  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior;

    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      document.documentElement.style.scrollBehavior = previous;
    };
  }, []);

  return (
    <div id="top" ref={rootRef} className="min-h-screen text-ink">
      <LandingNav />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div
              data-blob
              className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
            />
            <div
              data-blob
              className="absolute top-24 -right-24 h-80 w-80 rounded-full bg-blush-300/30 blur-3xl"
            />
            <div
              data-blob
              className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-coral-300/20 blur-3xl"
            />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:px-8 lg:pt-20 lg:pb-24">
            <div>
              <span
                data-hero
                className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/70 px-3 py-1.5 text-xs font-medium text-brand-700"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Web app live · Windows + Android coming soon
              </span>

              <h1
                data-hero
                className="mt-5 max-w-2xl text-4xl leading-[1.04] font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Conversations that{" "}
                <span className="brand-text">feel alive.</span>
              </h1>

              <p
                data-hero
                className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg"
              >
                Bubbles brings real-time chats, groups, voice notes, file
                sharing, AI replies, and calls into one beautifully simple
                place. Use it in your browser today — native Windows and
                Android apps are on the way.
              </p>

              <div
                data-hero
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/login"
                  className="brand-gradient flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
                >
                  Open web app
                  <LuArrowRight />
                </Link>

                <a
                  href="#download"
                  className="flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-white/60 px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-400"
                >
                  See downloads
                  <LuDownload />
                </a>
              </div>

              <div
                data-hero
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"
              >
                <span className="inline-flex items-center gap-1.5">
                  <LuCheck className="text-emerald-500" />
                  Free to use
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <LuCheck className="text-emerald-500" />
                  Email + Google sign-in
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <LuCheck className="text-emerald-500" />
                  Dark mode
                </span>
              </div>

              <div
                data-hero
                className="mt-8 flex items-center gap-3 text-xs text-muted"
              >
                <div className="flex -space-x-2">
                  {["AR", "WC", "NB"].map((initials, index) => (
                    <Avatar
                      key={initials}
                      initials={initials}
                      gradient={AVATAR_GRADIENTS[index]}
                      size="h-8 w-8"
                      text="text-[9px]"
                    />
                  ))}
                </div>

                <span>
                  Built for everyday conversations — and the big ones.
                </span>
              </div>
            </div>

            <div
              data-hero-visual
              className="relative mx-auto w-full max-w-[620px] pb-12 lg:pb-0"
            >
              <div className="absolute -inset-6 -z-10 rounded-[44px] bg-linear-to-br from-brand-200/50 via-blush-300/30 to-coral-300/40 blur-2xl" />

              <div data-tilt className="relative">
                <DesktopPreview />
              </div>

              <div
                data-float
                className="absolute -right-2 -bottom-8 hidden w-[185px] sm:block lg:-right-6 lg:w-[205px]"
              >
                <PhonePreview compact />
              </div>

              <FloatingMessageCard />
              <FloatingAiCard />
            </div>
          </div>
        </section>

        <section className="border-y border-brand-100/60 bg-brand-50/40">
          <div
            data-reveal
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-xs font-medium text-muted sm:px-6 lg:px-8"
          >
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon className="text-brand-500" />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Everything in one place"
              title="More than a chat app"
              description="Messaging, groups, voice notes, AI, and calls — designed to stay out of your way and keep the conversation moving."
            />

            <div
              data-reveal-group
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>

            <div
              data-reveal
              className="mt-6 flex flex-col gap-4 rounded-3xl border border-brand-100/70 bg-brand-50/40 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm">
                  <LuSmartphone className="text-lg" />
                </span>

                <div>
                  <p className="font-semibold">Android app in development</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Chats, groups, voice notes, and notifications first. Call
                    buttons will be there from day one; mobile calls follow.
                  </p>
                </div>
              </div>

              <a
                href="#download"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"
              >
                See download status
                <LuArrowRight />
              </a>
            </div>
          </div>
        </section>

        <section
          id="preview"
          className="scroll-mt-24 border-y border-brand-100/60 bg-brand-50/30 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="A closer look"
              title="Designed for desktop and mobile"
              description="A clean chat list, expressive messages, and the tools you need — without the clutter."
            />

            <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div data-reveal className="min-w-0">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
                  <LuMonitor className="text-brand-500" />
                  Desktop web app
                </div>

                <DesktopPreview />
              </div>

              <div data-reveal className="flex flex-col items-center">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-muted">
                  <span className="inline-flex items-center gap-2">
                    <LuSmartphone className="text-brand-500" />
                    Android app preview
                  </span>

                  <span className="rounded-full border border-brand-100/70 bg-brand-50/70 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                    Calls coming soon
                  </span>
                </div>

                <PhonePreview />

                <p className="mt-4 max-w-[250px] text-center text-xs leading-5 text-muted">
                  Chats, groups, voice notes, and notifications first. Call
                  buttons are visible in the app; Android calls are coming next.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="download" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Take Bubbles with you"
              title="Download Bubbles"
              description="Use it in your browser today. Native Windows and Android builds are in development — the download buttons will go live as soon as the first installers are ready."
            />

            <div
              data-reveal-group
              className="mt-10 grid gap-4 lg:grid-cols-3"
            >
              <DownloadCard
                icon={LuMonitor}
                title="Bubbles for Windows"
                subtitle="Windows 10/11 · 64-bit"
                tone="from-brand-500 to-brand-400"
                primaryLabel="Download for Windows"
                href={DOWNLOAD_LINKS.windows}
                points={[
                  "Native Windows window",
                  "Desktop notifications",
                  "Installer and auto-updates planned",
                ]}
              />

              <DownloadCard
                icon={LuSmartphone}
                title="Bubbles for Android"
                subtitle="Android 8.0+"
                tone="from-emerald-400 to-teal-500"
                primaryLabel="Download APK"
                href={DOWNLOAD_LINKS.android}
                points={[
                  "Chats, groups, and voice notes",
                  "Push notifications planned",
                  "Call icons included; calls coming soon",
                ]}
              />

              <WebCard />
            </div>

            <div
              data-reveal-group
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <InfoCard icon={LuAppWindow} title="Install on Windows">
                When the installer is available, download it, run it, and follow
                the prompts. Unsigned builds may show a Windows SmartScreen
                warning — choose <strong className="text-ink">More info</strong>{" "}
                →{" "}
                <strong className="text-ink">Run anyway</strong> only if you
                trust the build.
              </InfoCard>

              <InfoCard icon={LuSmartphone} title="Install on Android">
                When the APK is available, download it and open it. If Android
                asks, allow installs from your browser or file manager. The
                first build focuses on chats and notifications; calls follow in
                a later update.
              </InfoCard>
            </div>

            <div
              data-reveal-group
              className="mt-4 grid gap-4 md:grid-cols-3"
            >
              <InfoCard icon={LuLaptop} title="System requirements">
                Windows 10/11 (64-bit), Android 8.0+, or any modern browser.
                An internet connection is required.
              </InfoCard>

              <InfoCard icon={LuFileText} title="Release notes">
                <span className="font-semibold text-ink">
                  v{APP_VERSION} · {RELEASE_DATE}
                </span>
                <br />
                Web app live. Windows and Android builds in development. Next:
                installers, push notifications, and Android calls.
              </InfoCard>

              <InfoCard icon={LuShieldCheck} title="Checksums & updates">
                SHA-256 checksums will be published with every installer and
                APK. Release notes and update details will appear on this page.
              </InfoCard>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-24 border-t border-brand-100/60 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Good to know"
              title="Questions, answered"
              description="A few things people usually ask before jumping in."
            />

            <div
              data-reveal-group
              className="mx-auto mt-10 grid max-w-5xl gap-3 lg:grid-cols-2"
            >
              {FAQS.map((faq) => (
                <FaqItem
                  key={faq.question}
                  {...faq}
                  open={openFaq === faq.question}
                  onToggle={() =>
                    setOpenFaq((current) =>
                      current === faq.question ? null : faq.question,
                    )
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="relative isolate overflow-hidden rounded-[36px] brand-gradient px-6 py-12 text-center text-white shadow-glow sm:px-12 sm:py-16"
            >
              <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute -right-10 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <p className="text-xs font-semibold tracking-[0.2em] text-white/75 uppercase">
                  Start a conversation
                </p>

                <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Your next favorite chat is one click away.
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                  Open Bubbles in your browser now. Windows and Android apps are
                  on the way.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#4c2fa8] shadow-sm transition hover:bg-brand-50"
                  >
                    Open web app
                    <LuArrowRight />
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Landing;
