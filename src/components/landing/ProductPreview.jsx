import Avatar from "./Avatar";
import { AVATAR_GRADIENTS } from "../../constants/avatars";
import {
  LuArrowLeft,
  LuBatteryFull,
  LuCheckCheck,
  LuChevronDown,
  LuEllipsis,
  LuImage,
  LuMic,
  LuPaperclip,
  LuPhone,
  LuPlus,
  LuSearch,
  LuSendHorizontal,
  LuSignal,
  LuSmile,
  LuSparkles,
  LuStar,
  LuSun,
  LuUsers,
  LuVideo,
  LuWifi,
} from "react-icons/lu";

const LOGO = "/bubbles-logo.png";

const LogoMark = ({ size = "h-7 w-7" }) => (
  <span
    className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-[#ffffff] p-0.5`}
  >
    <img
      src={LOGO}
      alt=""
      className="h-full w-full object-contain"
      decoding="async"
    />
  </span>
);

const CHATS = [
  {
    name: "Ava Reynolds",
    initials: "AR",
    gradient: AVATAR_GRADIENTS[0],
    preview: "That sounds perfect ✨",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    name: "Weekend Crew",
    initials: "WC",
    gradient: AVATAR_GRADIENTS[1],
    preview: "Sam: I'll bring the snacks",
    time: "18m",
    unread: 5,
  },
  {
    name: "Noah Bennett",
    initials: "NB",
    gradient: AVATAR_GRADIENTS[2],
    preview: "Voice message · 0:12",
    time: "1h",
    online: true,
  },
];

const Message = ({ side = "left", children, time = "9:41", read = false }) => {
  const isRight = side === "right";

  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[10px] leading-4 shadow-sm ${
          isRight
            ? "brand-gradient rounded-br-md text-white"
            : "rounded-bl-md border border-brand-100/70 bg-white/90 text-ink"
        }`}
      >
        {children}

        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[7px] ${
            isRight ? "text-white/70" : "text-muted"
          }`}
        >
          {time}

          {read ? <LuCheckCheck className="text-[9px]" /> : null}
        </div>
      </div>
    </div>
  );
};

const VoiceBubble = () => {
  const bars = [5, 9, 13, 7, 15, 10, 6, 12, 8, 14, 6, 9];

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full brand-gradient text-white">
        <LuMic className="text-[10px]" />
      </span>

      <span className="flex h-4 items-center gap-[2px]">
        {bars.map((height, index) => (
          <span
            key={index}
            className="w-[2px] rounded-full bg-current opacity-70"
            style={{ height: `${height}px` }}
          />
        ))}
      </span>

      <span className="text-[8px] opacity-70">0:12</span>
    </div>
  );
};

const ImageBubble = () => (
  <div className="overflow-hidden rounded-xl border border-white/30">
    <div className="flex h-16 w-32 items-center justify-center bg-linear-to-br from-brand-300 via-blush-300 to-coral-300 text-white">
      <LuImage className="text-lg" />
    </div>
  </div>
);

const ChatRow = ({ chat, active = false }) => (
  <div
    className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
      active ? "bg-white/80 shadow-sm" : "hover:bg-white/60"
    }`}
  >
    <Avatar
      initials={chat.initials}
      gradient={chat.gradient}
      size="h-7 w-7"
      text="text-[8px]"
      online={chat.online}
    />

    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[10px] font-semibold text-ink">
          {chat.name}
        </p>
        <span className="shrink-0 text-[8px] text-muted">{chat.time}</span>
      </div>

      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[9px] text-muted">{chat.preview}</p>

        {chat.unread ? (
          <span className="flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full brand-gradient px-1 text-[7px] font-bold text-white">
            {chat.unread}
          </span>
        ) : null}
      </div>
    </div>

    <LuStar className="shrink-0 text-[7px] text-gray-300" />
  </div>
);

export const DesktopPreview = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-[26px] border border-brand-100/70 bg-white/90 shadow-soft ${className}`}
  >
    <div className="flex items-center gap-2 border-b border-brand-100/70 bg-brand-50/80 px-3 py-2.5">
      <span className="h-2 w-2 rounded-full bg-[#ff6b6b]" />
      <span className="h-2 w-2 rounded-full bg-[#f7c948]" />
      <span className="h-2 w-2 rounded-full bg-[#51cf66]" />

      <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[8px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="truncate">bubbles-zeta-nine.vercel.app</span>
      </div>
    </div>

    <div className="flex items-center gap-2 border-b border-brand-100/70 bg-white/80 px-2.5 py-2 sm:px-4 sm:py-2.5">
      <div className="flex shrink-0 items-center gap-1.5">
        <LogoMark size="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="brand-text text-[10px] font-bold sm:text-xs">
          Bubbles
        </span>
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-1.5 rounded-full border border-brand-100/70 bg-white/70 px-2.5 py-1 text-[8px] text-muted sm:flex">
        <LuSearch className="text-[9px]" />
        <span className="truncate">Search messages or people...</span>
      </div>

      <div className="ml-auto flex items-center gap-2 text-muted sm:gap-3">
        <LuSun className="text-[11px] sm:text-xs" />

        <Avatar
          initials="B"
          gradient={AVATAR_GRADIENTS[3]}
          size="h-5 w-5 sm:h-6 sm:w-6"
          text="text-[7px]"
        />
      </div>
    </div>

    <div className="grid h-[310px] grid-cols-[112px_1fr] sm:h-[380px] sm:grid-cols-[190px_1fr]">
      <aside className="flex min-w-0 flex-col border-r border-brand-100/70 bg-brand-50/40 p-2 sm:p-3">
        <div className="flex items-stretch gap-0.5 sm:gap-1">
          {["All", "Unread", "Groups"].map((label, index) => (
            <span
              key={label}
              className={`flex-1 rounded-full px-0.5 py-1 text-center text-[6px] sm:text-[9px] ${
                index === 0
                  ? "brand-gradient text-white shadow-sm"
                  : "border border-brand-100/70 bg-white/60 text-muted"
              }`}
            >
              {label}
            </span>
          ))}

          <span className="flex shrink-0 items-center justify-center gap-0.5 rounded-full border border-brand-100/70 bg-white/60 px-1 py-1 text-[6px] text-muted sm:px-1.5 sm:text-[9px]">
            <span className="hidden sm:inline">More</span>
            <LuChevronDown className="text-[6px] sm:text-[8px]" />
          </span>
        </div>

        <div className="mt-2 flex-1 space-y-0.5 overflow-hidden">
          {CHATS.map((chat, index) => (
            <ChatRow key={chat.name} chat={chat} active={index === 0} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1 sm:gap-1.5">
          <span className="flex-1 rounded-full brand-gradient px-1 py-1.5 text-center text-[7px] font-semibold text-white sm:py-2 sm:text-[9px]">
            + New Chat
          </span>

          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-600 shadow-sm sm:h-7 sm:w-7">
            <LuUsers className="text-[9px] sm:text-[11px]" />
          </span>

          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-white shadow-sm sm:h-7 sm:w-7">
            <span className="flex h-4 w-4 items-center justify-center rounded-full brand-gradient text-white sm:h-5 sm:w-5">
              <LuSparkles className="text-[7px] sm:text-[8px]" />
            </span>
          </span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col bg-brand-50/30">
        <header className="flex items-center justify-between border-b border-brand-100/70 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar
              initials="AR"
              gradient={AVATAR_GRADIENTS[0]}
              size="h-7 w-7 sm:h-8 sm:w-8"
              text="text-[9px]"
              online
            />

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-ink sm:text-xs">
                Ava Reynolds
              </p>
              <p className="text-[8px] text-emerald-500">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted">
            <LuPhone className="text-[11px] sm:text-xs" />
            <LuVideo className="text-[11px] sm:text-xs" />
            <LuEllipsis className="text-[11px] sm:text-xs" />
          </div>
        </header>

        <div className="flex-1 space-y-2 overflow-hidden p-3 sm:space-y-2.5 sm:p-4">
          <div className="text-center text-[7px] font-medium tracking-wider text-muted uppercase">
            Today
          </div>

          <Message side="left" time="9:38">
            Hey! Are we still on for the design review?
          </Message>

          <Message side="right" time="9:39" read>
            Yes — I just pushed the new landing page. Take a look 👀
          </Message>

          <Message side="left" time="9:40">
            The gradient hero looks so good. The mobile preview is clean too.
          </Message>
        </div>

        <div className="border-t border-brand-100/70 p-2.5 sm:p-3">
          <div className="flex items-center gap-2 rounded-xl border border-brand-100/70 bg-white/80 px-2.5 py-2 text-[9px] text-muted">
            <LuSmile className="text-[11px]" />
            <span className="flex-1 truncate">Write a message...</span>
            <LuPaperclip className="text-[11px]" />
            <span className="flex h-6 w-6 items-center justify-center rounded-lg brand-gradient text-white">
              <LuSendHorizontal className="text-[10px]" />
            </span>
          </div>
        </div>
      </main>
    </div>
  </div>
);

export const PhonePreview = ({ compact = false, className = "" }) => {
  const widthClass = compact
    ? "w-[185px]"
    : "w-[250px] sm:w-[270px]";
  const heightClass = compact ? "h-[390px]" : "h-[440px]";

  return (
    <div className={`relative mx-auto ${widthClass} ${className}`}>
      <div className="rounded-[38px] border-[7px] border-[#241d35] bg-[#241d35] p-1 shadow-soft">
        <div className="relative overflow-hidden rounded-[31px] bg-brand-50">
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#241d35]" />

          <div className={`flex ${heightClass} flex-col pt-7`}>
            <div className="flex items-center justify-between px-4 pb-1 text-[8px] font-semibold text-ink">
              <span>9:41</span>

              <span className="flex items-center gap-1">
                <LuSignal className="text-[8px]" />
                <LuWifi className="text-[8px]" />
                <LuBatteryFull className="text-[10px]" />
              </span>
            </div>

            <header className="flex items-center gap-2 border-b border-brand-100/70 bg-white/70 px-3 py-2">
              <LuArrowLeft className="text-xs text-muted" />

              <Avatar
                initials="AR"
                gradient={AVATAR_GRADIENTS[0]}
                size="h-7 w-7"
                text="text-[9px]"
                online
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-ink">
                  Ava Reynolds
                </p>
                <p className="text-[8px] text-emerald-500">Online</p>
              </div>

              <LuPhone className="text-xs text-muted" />
              <LuVideo className="text-xs text-muted" />
            </header>

            <div className="flex-1 space-y-2 overflow-hidden px-3 py-3">
              <div className="text-center text-[7px] font-medium tracking-wider text-muted uppercase">
                Today
              </div>

              <Message side="left" time="9:38">
                Hey! Are we still on for the design review?
              </Message>

              <Message side="right" time="9:39" read>
                Yes — just pushed the new landing page 👀
              </Message>

              <Message side="left" time="9:40">
                The mobile preview looks clean. Love it.
              </Message>

              <Message side="left" time="9:41">
                <VoiceBubble />
              </Message>

              <Message side="right" time="9:42" read>
                <ImageBubble />
              </Message>
            </div>

            <div className="border-t border-brand-100/70 bg-white/70 p-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-brand-100/70 bg-white/90 px-2 py-1.5 text-[8px] text-muted">
                <LuPlus className="text-[10px]" />
                <span className="flex-1 truncate">Message...</span>
                <LuPaperclip className="text-[10px]" />
                <span className="flex h-5 w-5 items-center justify-center rounded-lg brand-gradient text-white">
                  <LuSendHorizontal className="text-[8px]" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
