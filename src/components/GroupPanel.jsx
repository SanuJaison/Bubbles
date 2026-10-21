import { useMemo, useRef, useState } from "react";
import {
  LuX,
  LuCamera,
  LuCheck,
  LuEllipsis,
  LuUserPlus,
  LuBell,
  LuBellOff,
  LuSearch,
  LuEraser,
  LuFlag,
  LuLogOut,
  LuTrash2,
  LuLink,
  LuFileText,
  LuShieldCheck,
  LuPencil,
  LuMessageCircle,
  LuUserMinus,
} from "react-icons/lu";
import defaultProfile from "../assets/profileImage.png";
import GroupAvatar from "./GroupAvatar";
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

      {hint && (
        <span className="block text-xs text-muted truncate">{hint}</span>
      )}
    </span>
  </button>
);

const PermissionToggle = ({ label, value, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
    <span className="text-sm text-ink">{label}</span>

    <div className="flex rounded-full bg-black/5 dark:bg-white/10 p-0.5">
      {[
        { id: "all", label: "Everyone" },
        { id: "admins", label: "Admins" },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition disabled:opacity-50 ${
            value === option.id
              ? "brand-gradient text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const GroupPanel = ({
  chat,
  messages = [],
  currentUserId,
  isMuted = false,
  busyAction = "",
  onClose,
  onToggleMute,
  onAddMembers,
  onRemoveMember,
  onToggleAdmin,
  onEditGroup,
  onUpdatePermissions,
  onClearChat,
  onReport,
  onLeaveGroup,
  onDeleteGroup,
  onMessageMember,
  onSearchInChat,
}) => {
  const [activeTab, setActiveTab] = useState("members");
  const [openImage, setOpenImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);

  const avatarInputRef = useRef(null);

  const members = chat?.members || [];
  const adminIds = (chat?.admins || []).map(String);
  const isAdmin = adminIds.includes(String(currentUserId));
  const isCreator = Boolean(
    chat?.createdBy && String(chat.createdBy) === String(currentUserId),
  );
  const creatorId = chat?.createdBy ? String(chat.createdBy) : "";
  const permissions = chat?.permissions || {};

  const canEdit = isAdmin || permissions.editInfo === "all";

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
    { id: "members", label: "Members", count: members.length },
    { id: "media", label: "Media", count: mediaFiles.length },
    { id: "voice", label: "Voice", count: audioFiles.length },
    { id: "options", label: "Settings", count: 0 },
  ];

  const startEditing = () => {
    setEditName(chat?.name || "");
    setEditDescription(chat?.description || "");
    setAvatarFile(null);
    setAvatarPreview(chat?.profilePicture || "");
    setEditing(true);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveEdits = () => {
    onEditGroup?.({
      name: editName.trim(),
      description: editDescription.trim(),
      avatarFile,
    });

    setEditing(false);
  };

  return (
    <div className="h-full flex flex-col brand-panel border-l border-brand-100/70">
      <div className="flex-1 overflow-y-auto scrollbar-brand pb-6">
        <div className="relative">
          <div className="h-28 brand-gradient opacity-80"></div>

          {/* While editing, the avatar moves into the form — showing it in both
              places looked like two different photos. */}
          {!editing && (
            <div className="absolute left-1/2 -bottom-12 -translate-x-1/2">
              <GroupAvatar
                name={chat?.name}
                src={chat?.profilePicture}
                className="w-24 h-24 border-4 border-white dark:border-[#16161b] shadow-soft"
                textClassName="text-3xl"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong text-muted hover:text-ink transition flex items-center justify-center"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div
          className={`text-center px-5 ${editing ? "mt-4" : "mt-14"}`}
        >
          {editing ? (
            <div className="text-left">
              <div className="flex justify-center mb-3">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative"
                  title="Change group photo"
                >
                  <GroupAvatar
                    name={editName || chat?.name}
                    src={avatarPreview}
                    className="w-20 h-20"
                    textClassName="text-2xl"
                  />

                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full brand-gradient text-white flex items-center justify-center">
                    <LuCamera className="text-sm" />
                  </span>
                </button>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-brand-100 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-brand-300"
              />

              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Group description"
                className="mt-2 w-full resize-none rounded-xl border border-brand-100 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-brand-300 placeholder:text-muted"
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm text-ink"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveEdits}
                  className="flex-1 py-2 rounded-xl brand-gradient text-white text-sm flex items-center justify-center gap-1.5"
                >
                  <LuCheck className="text-base" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ink break-words">
                {chat?.name || "Group"}
              </h2>

              <p className="text-sm text-muted">
                {members.length} member{members.length === 1 ? "" : "s"}
              </p>

              {chat?.description && (
                <p className="text-sm text-ink/80 mt-2 leading-6 break-words">
                  {chat.description}
                </p>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full brand-gradient-soft text-brand-600 text-xs font-medium"
                >
                  <LuPencil className="text-sm" />
                  Edit group
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex gap-1 mx-4 mt-5 p-1 rounded-full bg-black/5 dark:bg-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-1 py-1.5 rounded-full text-[11px] font-medium transition ${
                activeTab === tab.id
                  ? "brand-gradient text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count > 0 ? ` (${tab.count})` : ""}
            </button>
          ))}
        </div>

        {activeTab === "members" && (
          <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-2">
            {members.length === 0 ? (
              <EmptySection label="No members yet." />
            ) : (
              members.map((member) => {
                const memberIsAdmin = adminIds.includes(String(member.id));
                const isMe = String(member.id) === String(currentUserId);
                const memberIsCreator =
                  Boolean(creatorId) && String(member.id) === creatorId;
                const menuOpen =
                  String(openMemberMenuId) === String(member.id);

                return (
                  <div key={member.id} className="relative">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <img
                        src={member.profilePicture || defaultProfile}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">
                          {member.name}
                          {isMe ? " (you)" : ""}
                        </p>

                        <p className="text-[11px] text-muted truncate">
                          @{member.username || "user"}
                        </p>
                      </div>

                      {memberIsCreator ? (
                        <span className="shrink-0 flex items-center gap-1 rounded-full brand-gradient text-white px-2 py-0.5 text-[10px] font-medium">
                          <LuShieldCheck className="text-xs" />
                          Creator
                        </span>
                      ) : (
                        memberIsAdmin && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full brand-gradient-soft text-brand-600 px-2 py-0.5 text-[10px] font-medium">
                            <LuShieldCheck className="text-xs" />
                            Admin
                          </span>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMemberMenuId(
                            menuOpen ? null : String(member.id),
                          )
                        }
                        title="Member options"
                        className="shrink-0 w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
                      >
                        <LuEllipsis className="text-base" />
                      </button>
                    </div>

                    {menuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[120]"
                          onClick={() => setOpenMemberMenuId(null)}
                        />

                        <div className="absolute right-1 top-11 z-[130] w-48 rounded-xl brand-modal border border-brand-100 shadow-soft py-1 overflow-hidden">
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMemberMenuId(null);
                                onMessageMember?.(member);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-brand-50 dark:hover:bg-white/5"
                            >
                              <LuMessageCircle className="text-base" />
                              Message
                            </button>
                          )}

                          {isAdmin && !isMe && !memberIsCreator && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMemberMenuId(null);
                                onToggleAdmin?.(member);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-brand-50 dark:hover:bg-white/5"
                            >
                              <LuShieldCheck className="text-base" />
                              {memberIsAdmin
                                ? "Dismiss as admin"
                                : "Make admin"}
                            </button>
                          )}

                          {isAdmin && !isMe && !memberIsCreator && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMemberMenuId(null);
                                onRemoveMember?.(member);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              <LuUserMinus className="text-base" />
                              Remove from group
                            </button>
                          )}

                          {isMe && (
                            <p className="px-3 py-2 text-xs text-muted">
                              {memberIsCreator
                                ? "You created this group"
                                : memberIsAdmin
                                  ? "You're an admin of this group"
                                  : "You're a member of this group"}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}

            {(isAdmin || permissions.addMembers === "all") && (
              <button
                type="button"
                onClick={onAddMembers}
                className="w-full flex items-center gap-3 px-2 py-3 mt-1 rounded-xl text-left text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition"
              >
                <span className="w-9 h-9 rounded-full brand-gradient-soft flex items-center justify-center">
                  <LuUserPlus className="text-lg" />
                </span>

                <span className="text-sm font-medium">Add members</span>
              </button>
            )}
          </div>
        )}

        {activeTab === "media" && (
          <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-3">
            {mediaFiles.length === 0 ? (
              <EmptySection label="No media shared yet." />
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-80 overflow-y-auto scrollbar-brand pr-1">
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
            )}

            {links.length > 0 && (
              <div className="mt-3 pt-3 border-t border-brand-100/70">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted px-1">
                  Links
                </h3>

                <div className="mt-1 max-h-48 overflow-y-auto scrollbar-brand">
                  {links.map((link, index) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <LuLink className="shrink-0 text-brand-600 text-sm" />

                      <span className="min-w-0 flex-1 text-xs text-ink truncate">
                        {link.url}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {docFiles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-brand-100/70">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted px-1">
                  Documents
                </h3>

                <div className="mt-1 max-h-48 overflow-y-auto scrollbar-brand">
                  {docFiles.map((file, index) => (
                    <a
                      key={`${file.url || file.name}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <LuFileText className="shrink-0 text-brand-600 text-sm" />

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
              </div>
            )}
          </div>
        )}

        {activeTab === "voice" && (
          <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-3">
            {audioFiles.length === 0 ? (
              <EmptySection label="No voice messages yet." />
            ) : (
              <div className="max-h-80 overflow-y-auto scrollbar-brand space-y-2 px-1">
                {audioFiles.map((file, index) => (
                  <div
                    key={`${file.url || file.name}-${index}`}
                    className="rounded-2xl border border-brand-100/70 bg-white/70 px-3 py-2 dark:bg-white/5"
                  >
                    <AudioMessage file={file} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "options" && (
          <>
            {isAdmin && (
              <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted px-3 pt-2">
                  Permissions
                </h3>

                <PermissionToggle
                  label="Send messages"
                  value={permissions.sendMessages || "all"}
                  onChange={(value) =>
                    onUpdatePermissions?.({ sendMessages: value })
                  }
                />

                <PermissionToggle
                  label="Add members"
                  value={permissions.addMembers || "all"}
                  onChange={(value) =>
                    onUpdatePermissions?.({ addMembers: value })
                  }
                />

                <PermissionToggle
                  label="Edit group info"
                  value={permissions.editInfo || "admins"}
                  onChange={(value) =>
                    onUpdatePermissions?.({ editInfo: value })
                  }
                />
              </div>
            )}

            <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-2">
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
                    {isMuted ? "Muted for this group" : "Notifications are on"}
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

              <PanelRow
                icon={<LuSearch />}
                label="Search in group"
                onClick={onSearchInChat}
              />

              {!isCreator && (
                <PanelRow
                  icon={<LuFlag />}
                  label="Report group"
                  hint="Send a private report to the team"
                  onClick={onReport}
                />
              )}

              <PanelRow
                icon={<LuEraser />}
                label={busyAction === "clear" ? "Clearing..." : "Clear chat"}
                hint="Deletes messages for you only"
                onClick={onClearChat}
                disabled={busyAction === "clear"}
              />
            </div>

            <div className="mx-4 mt-3 rounded-2xl border border-brand-100/70 bg-white/70 dark:bg-white/5 p-2">
              {isCreator ? (
                <PanelRow
                  icon={<LuTrash2 />}
                  label={
                    busyAction === "delete" ? "Deleting..." : "Delete group"
                  }
                  hint="Deletes the group for every member"
                  onClick={onDeleteGroup}
                  danger
                  disabled={busyAction === "delete"}
                />
              ) : (
                <PanelRow
                  icon={<LuLogOut />}
                  label="Exit group"
                  hint="Leaves the group and clears it from your chats"
                  onClick={onLeaveGroup}
                  danger
                  disabled={busyAction === "leave"}
                />
              )}
            </div>
          </>
        )}
      </div>

      {openImage && (
        <div
          className="fixed inset-0 z-[220] bg-black/85 flex items-center justify-center p-4"
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

export default GroupPanel;
