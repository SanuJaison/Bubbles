import { useMemo, useState } from "react";
import {
  LuPhone,
  LuVideo,
  LuBell,
  LuBellOff,
  LuBan,
  LuTrash2,
  LuEraser,
  LuFileText,
  LuLink,
  LuSearch,
  LuUserPlus,
  LuX,
  LuFlag,
} from "react-icons/lu";
import defaultProfile from "../assets/profileImage.png";
import AudioMessage from "./AudioMessage";

const LINK_PATTERN = /(https?:\/\/[^\s]+)/g;

const formatFileSize = (size) => {
  if (typeof size !== "number" || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatLastSeen = (value) => {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const EmptySection = ({ label }) => (
  <p className="text-xs text-muted px-1 py-3">{label}</p>
);

const PanelRow = ({ icon, label, hint, onClick, danger, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition disabled:opacity-50 ${
      danger
        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        : "text-ink hover:bg-black/5 dark:hover:bg-white/5"
    }`}
  >
    <span className="text-lg shrink-0">{icon}</span>

    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium truncate">{label}</span>

      {hint && <span className="block text-xs text-muted truncate">{hint}</span>}
    </span>
  </button>
);

const ProfilePanel = ({
  chat,
  messages = [],
  isMuted = false,
  isBlocked = false,
  busyAction = "",
  onToggleMute,
  onToggleBlock,
  onClearChat,
  onDeleteChat,
  onReport,
  onSearchInChat,
  onAddToGroup,
  onVoiceCall,
  onVideoCall,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("media");
  const [openImage, setOpenImage] = useState(null);

  // Presence is only shown when the contact really is online — and never
  // when they've hidden their status.
  const isOnline = Boolean(chat?.online) && !chat?.presenceHidden;

  const avatarSrc =
    !chat || chat.photoHidden
      ? defaultProfile
      : chat.profilePicture || defaultProfile;

  const allFiles = useMemo(
    () =>
      messages.flatMap((chatMessage) =>
        (chatMessage.files || []).map((file) => ({
          ...file,
          messageId: chatMessage.id,
        })),
      ),
    [messages],
  );

  const mediaFiles = useMemo(
    () =>
      allFiles
        .filter((file) => file.mimeType?.startsWith("image/"))
        .reverse(),
    [allFiles],
  );

  const audioFiles = useMemo(
    () =>
      allFiles
        .filter((file) => file.mimeType?.startsWith("audio/"))
        .reverse(),
    [allFiles],
  );

  const docFiles = useMemo(
    () =>
      allFiles
        .filter(
          (file) =>
            !file.mimeType?.startsWith("image/") &&
            !file.mimeType?.startsWith("audio/"),
        )
        .reverse(),
    [allFiles],
  );

  const links = useMemo(() => {
    const found = [];

    messages.forEach((chatMessage) => {
      if (!chatMessage.text) {
        return;
      }

      const matches = chatMessage.text.match(LINK_PATTERN);

      matches?.forEach((url) => found.push({ url, messageId: chatMessage.id }));
    });

    return found.reverse();
  }, [messages]);

  const tabs = [
    { id: "media", label: "Media", count: mediaFiles.length },
    { id: "audio", label: "Voice", count: audioFiles.length },
    { id: "links", label: "Links", count: links.length },
    { id: "docs", label: "Docs", count: docFiles.length },
  ];

  const lastSeenLabel =
    !chat?.lastSeenHidden && chat?.lastSeen ? formatLastSeen(chat.lastSeen) : "";

  return (
    <div className="h-full flex flex-col brand-panel border-l border-brand-100/70">
      <div className="flex-1 overflow-y-auto scrollbar-brand pb-6">
        {/* Cover */}
        <div className="relative">
          <div className="h-28 sm:h-32 brand-gradient opacity-80"></div>

          <div className="absolute left-1/2 -bottom-12 -translate-x-1/2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-100 border-4 border-white dark:border-[#16161b] shadow-soft">
                <img
                  src={avatarSrc}
                  alt={chat?.name || "Profile"}
                  className="w-full h-full object-cover block"
                />
              </div>

              {isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#16161b] rounded-full"></span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong text-muted hover:text-ink transition flex items-center justify-center"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        {/* Name */}
        <div className="text-center mt-14 px-5">
          <h2 className="text-xl font-semibold text-ink break-words">
            {chat?.name || "Unknown"}
          </h2>

          <p className="text-sm text-muted break-words">
            @{chat?.username || "unknown"}
          </p>

          <p
            className={`text-sm mt-1 ${isOnline ? "text-green-500" : "text-muted"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>

          {!isOnline && lastSeenLabel && (
            <p className="text-xs text-muted mt-0.5">
              Last seen {lastSeenLabel}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-3 sm:gap-4 mt-6 px-5">
          <button
            type="button"
            onClick={onVoiceCall}
            disabled={isBlocked}
            title="Voice call"
            className="w-12 h-12 rounded-xl brand-gradient-soft text-brand-600 flex items-center justify-center hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuPhone className="text-xl" />
          </button>

          <button
            type="button"
            onClick={onVideoCall}
            disabled={isBlocked}
            title="Video call"
            className="w-12 h-12 rounded-xl brand-gradient-soft text-brand-600 flex items-center justify-center hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuVideo className="text-xl" />
          </button>

          <button
            type="button"
            onClick={onSearchInChat}
            title="Search in chat"
            className="w-12 h-12 rounded-xl brand-gradient-soft text-brand-600 flex items-center justify-center hover:brightness-95 transition"
          >
            <LuSearch className="text-xl" />
          </button>

          <button
            type="button"
            onClick={onAddToGroup}
            disabled={isBlocked}
            title="Add to group"
            className="w-12 h-12 rounded-xl brand-gradient-soft text-brand-600 flex items-center justify-center hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuUserPlus className="text-xl" />
          </button>
        </div>

        {/* About */}
        <div className="mx-4 mt-6 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            About
          </h3>

          <p className="text-sm text-ink/90 mt-2 leading-6">
            {chat?.bio || "No bio yet."}
          </p>
        </div>

        {/* Media, links & docs */}
        <div className="mx-4 mt-4 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Media, links & docs
            </h3>
          </div>

          <div className="flex gap-1 mt-2 p-1 rounded-full bg-black/5 dark:bg-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-2 py-1.5 rounded-full text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "brand-gradient text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="mt-3">
            {activeTab === "media" &&
              (mediaFiles.length === 0 ? (
                <EmptySection label="No media shared yet." />
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto scrollbar-brand pr-1">
                  {mediaFiles.map((file, index) => (
                    <button
                      key={`${file.url || file.name}-${index}`}
                      type="button"
                      onClick={() => setOpenImage(file)}
                      className="aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 group"
                    >
                      <img
                        src={file.url}
                        alt={file.name || "Shared media"}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </button>
                  ))}
                </div>
              ))}

            {activeTab === "links" &&
              (links.length === 0 ? (
                <EmptySection label="No links shared yet." />
              ) : (
                <div className="max-h-72 overflow-y-auto scrollbar-brand">
                  {links.map((link, index) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <LuLink className="shrink-0 text-brand-600" />

                      <span className="min-w-0 flex-1 text-xs text-ink truncate">
                        {link.url}
                      </span>
                    </a>
                  ))}
                </div>
              ))}

            {activeTab === "audio" &&
              (audioFiles.length === 0 ? (
                <EmptySection label="No voice messages yet." />
              ) : (
                <div className="max-h-72 overflow-y-auto scrollbar-brand space-y-2 px-1">
                  {audioFiles.map((file, index) => (
                    <div
                      key={`${file.url || file.name}-${index}`}
                      className="rounded-2xl border border-brand-100/70 bg-white/70 px-3 py-2 dark:bg-white/5"
                    >
                      <AudioMessage file={file} />
                    </div>
                  ))}
                </div>
              ))}

            {activeTab === "docs" &&
              (docFiles.length === 0 ? (
                <EmptySection label="No documents shared yet." />
              ) : (
                <div className="max-h-72 overflow-y-auto scrollbar-brand">
                  {docFiles.map((file, index) => (
                    <a
                      key={`${file.url || file.name}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <LuFileText className="shrink-0 text-brand-600" />

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-ink truncate">
                          {file.name || "Document"}
                        </span>

                        <span className="block text-[10px] text-muted">
                          {formatFileSize(file.size) || "Open file"}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="mx-4 mt-4 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-2">
          <button
            type="button"
            onClick={onToggleMute}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <span className="text-lg shrink-0">
              {isMuted ? <LuBellOff /> : <LuBell />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                Mute notifications
              </span>

              <span className="block text-xs text-muted">
                {isMuted ? "Muted for this chat" : "Notifications are on"}
              </span>
            </span>

            <span
              className={`relative shrink-0 w-10 h-6 rounded-full transition ${
                isMuted ? "brand-gradient" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              <span
                className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-all ${
                  isMuted ? "left-[18px]" : "left-[2px]"
                }`}
              ></span>
            </span>
          </button>
        </div>

        {/* Contact actions */}
        <div className="mx-4 mt-4 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-2">
          <PanelRow
            icon={<LuFlag />}
            label={`Report ${chat?.name || "user"}`}
            hint="Send a private report to the team"
            onClick={onReport}
          />

          <PanelRow
            icon={<LuBan />}
            label={isBlocked ? `Unblock ${chat?.name || "contact"}` : `Block ${chat?.name || "contact"}`}
            hint={
              isBlocked
                ? "They can message you again"
                : "They won't be able to message you"
            }
            onClick={onToggleBlock}
            disabled={busyAction === "block"}
          />

          <PanelRow
            icon={<LuEraser />}
            label={busyAction === "clear" ? "Clearing..." : "Clear chat"}
            hint="Deletes messages for you only"
            onClick={onClearChat}
            disabled={busyAction === "clear"}
          />

          <PanelRow
            icon={<LuTrash2 />}
            label={busyAction === "delete" ? "Deleting..." : "Delete chat"}
            hint="Removes it from your chat list"
            onClick={onDeleteChat}
            danger
            disabled={busyAction === "delete"}
          />
        </div>
      </div>

      {openImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setOpenImage(null)}
        >
          <img
            src={openImage.url}
            alt={openImage.name || "Shared media"}
            className="max-h-full max-w-full rounded-xl object-contain"
          />

          <a
            href={openImage.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="absolute bottom-6 px-4 py-2 rounded-full glass-strong text-sm text-ink"
          >
            Open original
          </a>
        </div>
      )}
    </div>
  );
};

export default ProfilePanel;
