import Topbar from "../components/Topbar";
import {
  LuPhone,
  LuVideo,
  LuChevronDown,
  LuStar,
  LuMic,
  LuEllipsis,
  LuPaperclip,
  LuSmile,
  LuSendHorizontal,
  LuArrowLeft,
  LuX,
  LuUserRound,
  LuSearch,
  LuPin,
  LuPinOff,
  LuFlag,
  LuBan,
  LuEraser,
  LuTrash2,
  LuBell,
  LuBellOff,
  LuUsers,
  LuUserPlus,
  LuLogOut,
  LuArchive,
  LuArchiveRestore,
} from "react-icons/lu";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import ProfilePanel from "../components/ProfilePanel";
import NewChatPanel from "../components/NewChatPanel";
import GroupPanel from "../components/GroupPanel";
import GroupAvatar from "../components/GroupAvatar";
import CreateGroupDialog from "../components/CreateGroupDialog";
import AddMembersDialog from "../components/AddMembersDialog";
import AddToGroupDialog from "../components/AddToGroupDialog";
import AIChat from "../components/AIChat";
import ForwardModal from "../components/ForwardModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ReportDialog from "../components/ReportDialog";
import AudioMessage from "../components/AudioMessage";
import LinkifiedText from "../components/LinkifiedText";
import LiveWaveform from "../components/LiveWaveform";
import { extractWaveform, formatVoiceDuration } from "../utils/voice";
import useVoiceRecorder from "../hooks/useVoiceRecorder";
import bubbleAI from "../assets/bubble-ai.png";
import defaultProfile from "../assets/profileImage.png";

// Lazy-loaded so the (heavy) emoji library is code-split out of the main bundle
// and only fetched the first time the picker is opened.
const EmojiPicker = lazy(() => import("emoji-picker-react"));

import {
  createOrGetChatAPI,
  sendMessageAPI,
  getChatMessagesAPI,
  getMyChatsAPI,
  markMessagesAsReadAPI,
  markMessagesAsDeliveredAPI,
  togglePinMessageAPI,
  deleteMessageAPI,
  editMessageAPI,
  forwardMessageAPI,
  toggleBlockUserAPI,
  deleteChatAPI,
  clearChatAPI,
  reportUserAPI,
  reportChatAPI,
  updateGroupAPI,
  removeGroupMemberAPI,
  setGroupAdminAPI,
  updateGroupPermissionsAPI,
  leaveGroupAPI,
  deleteGroupAPI,
} from "../service/api";

import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext";
import { useTheme } from "../context/ThemeContext";
import { resolveWallpaper } from "../constants/wallpapers";
import { getMessageThemeClass } from "../constants/messageThemes";
import toast from "react-hot-toast";

// Lightweight WebAudio chime so notification sounds need no asset file.
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.32);

    oscillator.onended = () => ctx.close();
  } catch (error) {
    console.log("Notification sound failed:", error);
  }
};

const formatLastSeen = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} ${time}`;
};

// Resolves what a contact's presence should read as, honouring their
// online-status / last-seen privacy settings.
const getPresenceLabel = (chat) => {
  if (!chat || chat.presenceHidden) {
    return "Offline";
  }

  if (chat.online) {
    return "Online";
  }

  if (!chat.lastSeenHidden && chat.lastSeen) {
    const lastSeen = formatLastSeen(chat.lastSeen);

    if (lastSeen) {
      return `Last seen ${lastSeen}`;
    }
  }

  return "Offline";
};

// Bubbles AI lives only on this device (localStorage), but once the user has
// actually chatted with it we surface it in the conversation list like any
// other contact.
const AI_CHAT_ID = "bubbles-ai";

const getAIStorageKey = (user) =>
  `bubblesAIHistory:${user?._id || user?.id || "guest"}`;

const readAIChatSummary = (user) => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(getAIStorageKey(user)) || "null"
    );

    if (!Array.isArray(saved)) {
      return null;
    }

    const conversation = saved.filter(
      (item) =>
        item &&
        (item.type === "user" || item.type === "ai") &&
        !item.greeting &&
        !item.error &&
        typeof item.text === "string" &&
        item.text.trim(),
    );

    if (conversation.length === 0) {
      return null;
    }

    const last = conversation[conversation.length - 1];
    const preview = last.text.replace(/\s+/g, " ").trim();

    return {
      hasConversation: true,
      lastMessage: last.type === "user" ? `You: ${preview}` : preview,
      time: last.time || "",
    };
  } catch {
    return null;
  }
};

// Full timestamp used by the "Message info" panel.
const formatInfoTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// The single line shown for a message in chat lists, pinned banners and
// reply previews, whatever kind of message it is.
const getMessagePreview = (chatMessage) => {
  if (!chatMessage) {
    return "";
  }

  if (chatMessage.isDeleted) {
    return "This message was deleted";
  }

  if (chatMessage.messageType === "call") {
    const kind = chatMessage.callInfo?.callType === "video" ? "Video" : "Voice";
    const status = chatMessage.callInfo?.status;

    if (status === "completed") {
      return `${kind} call`;
    }

    if (status === "declined") {
      return `Declined ${kind.toLowerCase()} call`;
    }

    if (status === "cancelled") {
      return `Cancelled ${kind.toLowerCase()} call`;
    }

    return `Missed ${kind.toLowerCase()} call`;
  }

  if (chatMessage.messageType === "system") {
    return chatMessage.text || "";
  }

  if (chatMessage.text) {
    return chatMessage.text;
  }

  if (chatMessage.files?.length > 0) {
    if (chatMessage.messageType === "image") {
      return "Photo";
    }

    if (chatMessage.messageType === "audio") {
      return "Voice message";
    }

    return "File";
  }

  return "";
};

// Call history reads differently depending on which side is looking at it —
// the caller never sees "missed", the person who declined sees that they did.
const getCallLabel = (chatMessage) => {
  const isVideo = chatMessage.callInfo?.callType === "video";
  const kind = isVideo ? "Video" : "Voice";
  const status = chatMessage.callInfo?.status;
  const isMine = chatMessage.type === "sent";

  if (status === "completed") {
    return `${kind} call`;
  }

  if (status === "declined") {
    return isMine
      ? `${kind} call declined`
      : `You declined the ${kind.toLowerCase()} call`;
  }

  if (status === "cancelled") {
    return isMine
      ? `You cancelled the ${kind.toLowerCase()} call`
      : `Missed ${kind.toLowerCase()} call`;
  }

  return isMine ? "No answer" : `Missed ${kind.toLowerCase()} call`;
};

// One row in the chat header's overflow menu.
const ChatMenuAction = ({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition disabled:opacity-50 ${
      danger
        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        : "text-ink hover:bg-brand-50 dark:hover:bg-white/5"
    }`}
  >
    <span className="shrink-0 text-base">{icon}</span>

    <span className="min-w-0 flex-1 truncate">{label}</span>
  </button>
);

const Home = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [recordingUsers, setRecordingUsers] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [addToGroupContact, setAddToGroupContact] = useState(null);
  const [createGroupSeed, setCreateGroupSeed] = useState([]);
  const [createGroupKey, setCreateGroupKey] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatSummary, setAiChatSummary] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState(null);
  const [pinningMessageId, setPinningMessageId] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [messageInfoId, setMessageInfoId] = useState(null);
  const [profileAction, setProfileAction] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargetMessage, setForwardTargetMessage] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [failedMessageIds, setFailedMessageIds] = useState([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [mutedChatIds, setMutedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mutedChats") || "[]");
    } catch {
      return [];
    }
  });
  const [favoriteChatIds, setFavoriteChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteChats") || "[]");
    } catch {
      return [];
    }
  });
  const [pinnedChatIds, setPinnedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pinnedChats") || "[]");
    } catch {
      return [];
    }
  });
  const [archivedChatIds, setArchivedChatIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("archivedChats") || "[]");
    } catch {
      return [];
    }
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [chatContextMenu, setChatContextMenu] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [chatMenuPos, setChatMenuPos] = useState({
    top: 72,
    right: 16,
    width: 240,
  });
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);

  const { socket } = useSocket();

  const { startCall, startGroupCall, joinGroupCall, groupCallStates, call } =
    useCall();

  const { user: authUser, updateUser } = useAuth();

  const { chatTheme, resolvedTheme } = useTheme();

  const activeWallpaper = resolveWallpaper(
    authUser?.chatWallpaper,
    resolvedTheme === "dark",
  );

  const chatThemeClass = getMessageThemeClass(chatTheme);

  // Read receipts are two-way: with them off you neither broadcast "read"
  // nor see other people's read ticks — messages top out at "delivered".
  const readReceiptsEnabled = authUser?.readReceipts !== false;

  const aiSummaryLoadedRef = useRef(false);

  // Restore the local Bubbles AI conversation into the sidebar on first load.
  useEffect(() => {
    if (!authUser || aiSummaryLoadedRef.current) {
      return;
    }

    aiSummaryLoadedRef.current = true;
    setAiChatSummary(readAIChatSummary(authUser));
  }, [authUser]);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const tempIdCounterRef = useRef(0);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const mutedChatsRef = useRef([]);
  const messageRefs = useRef({});
  const emojiButtonRef = useRef(null);
  const openChatRef = useRef(null);
  const refreshChatsRef = useRef(null);
  const chatMenuRef = useRef(null);
  const chatMenuButtonRef = useRef(null);
  const filterMenuRef = useRef(null);
  const chatContextMenuRef = useRef(null);

  // The recorder resolves its blob through a ref so its callback can be the
  // (later-declared) send function without breaking hook ordering.
  const voiceCompleteRef = useRef(null);
  const recordingChatRef = useRef(null);

  // Native history entries let the browser Back/Forward buttons mirror the
  // in-app back arrows. Every entry carries the view it represents, so a
  // refresh (or a popstate) can restore the exact screen without touching
  // `/login` again.
  const historyIndexRef = useRef(0);
  const initialHistoryRef = useRef({ hasState: false });
  const initialViewAppliedRef = useRef(false);
  const applyHistoryEntryRef = useRef(() => {});

  const writeHistoryEntry = (view, chatId = null, { replace = false } = {}) => {
    const currentState = window.history.state || {};
    const currentView = currentState.bubblesView;
    const currentChatId = currentState.bubblesChatId;

    if (
      !replace &&
      currentView === view &&
      String(currentChatId || "") === String(chatId || "")
    ) {
      return;
    }

    const nextIndex = replace
      ? historyIndexRef.current
      : historyIndexRef.current + 1;

    const nextState = {
      ...currentState,
      bubblesView: view,
      bubblesChatId: chatId ? String(chatId) : null,
      bubblesIndex: nextIndex,
    };

    if (replace) {
      window.history.replaceState(nextState, "", window.location.href);
    } else {
      window.history.pushState(nextState, "", window.location.href);
    }

    historyIndexRef.current = nextIndex;
  };

  const currentHistoryView = () => window.history.state?.bubblesView || "list";

  const {
    isRecording,
    seconds: recordingSeconds,
    error: recorderError,
    analyser: recorderAnalyser,
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
    clearError: clearRecorderError,
  } = useVoiceRecorder({
    onComplete: (payload) => voiceCompleteRef.current?.(payload),
  });

  // Tell the chat room when a voice note is being recorded, so the other side
  // sees "Alice is recording a voice message..." like the typing indicator.
  useEffect(() => {
    if (!socket || !isRecording || !selectedConversation) {
      return;
    }

    recordingChatRef.current = selectedConversation;
    socket.emit("recording", selectedConversation);
  }, [isRecording, socket, selectedConversation]);

  useEffect(() => {
    if (isRecording || !recordingChatRef.current) {
      return;
    }

    socket?.emit("stopRecording", recordingChatRef.current);
    recordingChatRef.current = null;
  }, [isRecording, socket]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [emojiPickerPos, setEmojiPickerPos] = useState({
    left: 16,
    bottom: 96,
    width: 320,
  });

  // Mirrors the user's saved settings so socket callbacks (which are bound
  // once per socket) always read the latest values.
  const settingsRef = useRef({
    enterToSend: true,
    readReceipts: true,
    messageNotifications: true,
    notificationSound: true,
  });

  useEffect(() => {
    settingsRef.current = {
      enterToSend: authUser?.enterToSend !== false,
      readReceipts: authUser?.readReceipts !== false,
      messageNotifications: authUser?.messageNotifications !== false,
      notificationSound: authUser?.notificationSound !== false,
    };
  }, [authUser]);

  useEffect(() => {
    mutedChatsRef.current = mutedChatIds;
  }, [mutedChatIds]);

  const selectedChat = conversations.find(
    (chat) => String(chat.id) === String(selectedConversation),
  );

  const currentMessages = chatMessages[selectedConversation] || [];

  const infoMessage =
    currentMessages.find(
      (chatMessage) => String(chatMessage.id) === String(messageInfoId),
    ) || null;

  // Every pinned message in the open chat, newest pin first.
  const pinnedMessages = currentMessages
    .filter((chatMessage) => chatMessage.isPinned)
    .sort(
      (first, second) =>
        new Date(second.pinnedAt || 0) - new Date(first.pinnedAt || 0),
    );

  // The banner cycles through them; the modulo keeps the index in range
  // when a message is unpinned underneath us.
  const pinnedMessage =
    pinnedMessages.length > 0
      ? pinnedMessages[pinnedIndex % pinnedMessages.length]
      : null;

  const isChatFavorite = favoriteChatIds.includes(
    String(selectedConversation),
  );

  const isChatPinned = pinnedChatIds.includes(String(selectedConversation));

  const isChatMuted = mutedChatIds.some(
    (mutedId) => String(mutedId) === String(selectedConversation),
  );

  const chatSearchResults = (() => {
    const query = chatSearchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return currentMessages
      .filter(
        (chatMessage) =>
          !chatMessage.isDeleted &&
          (chatMessage.text || "").toLowerCase().includes(query),
      )
      .slice(0, 40);
  })();

  useEffect(() => {
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setFilePreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const currentTypingUsers = typingUsers[String(selectedConversation)] || [];
  const currentRecordingUsers =
    recordingUsers[String(selectedConversation)] || [];

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = String(loggedInUser?._id || loggedInUser?.id || "");
  const currentUserName = loggedInUser?.name || loggedInUser?.username || "You";

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // One shape for every chat, whether it came from the API, a socket event or
  // a group mutation. Group chats have no single "other user", so they carry
  // the full member list instead.
  const formatConversation = (chat, viewerId, viewerName = "") => {
    const participants = chat.participants || [];

    const members = participants.map((participant) => ({
      id: String(participant._id || participant),
      name: participant.name || "Unknown",
      username: participant.username || "",
      profilePicture: participant.profilePicture || defaultProfile,
    }));

    const senderId = chat.lastMessageSender
      ? String(chat.lastMessageSender._id || chat.lastMessageSender)
      : "";

    const senderMember = members.find((member) => member.id === senderId);

    const senderName = senderId
      ? senderId === String(viewerId)
        ? viewerName || "You"
        : senderMember?.name || ""
      : "";

    if (chat.isGroup) {
      const admins = (chat.groupAdmins || []).map(String);

      return {
        id: String(chat._id),
        userId: null,
        isGroup: true,
        group: true,
        name: chat.groupName || "Group",
        username: "",
        bio: chat.groupDescription || "",
        description: chat.groupDescription || "",
        profilePicture: chat.groupAvatar || "",
        online: false,
        lastSeen: null,
        presenceHidden: true,
        lastSeenHidden: true,
        photoHidden: false,
        unread: 0,
        admins,
        createdBy: chat.groupCreatedBy
          ? String(chat.groupCreatedBy)
          : null,
        permissions: chat.groupPermissions || {
          sendMessages: "all",
          addMembers: "all",
          editInfo: "admins",
        },
        members: members.map((member) => ({
          ...member,
          isAdmin: admins.includes(member.id),
        })),
        memberCount: members.length,
        time: formatTime(chat.lastMessageAt),
        lastMessage: chat.lastMessage || "",
        lastMessageSenderName: senderName,
      };
    }

    const otherUser = participants.find(
      (participant) => String(participant._id) !== String(viewerId),
    );

    if (!otherUser) {
      return null;
    }

    return {
      id: String(chat._id),
      userId: otherUser._id,
      name: otherUser.name || "Unknown User",
      username: otherUser.username || "",
      bio: otherUser.bio || "",
      profilePicture: otherUser.profilePicture || defaultProfile,
      online:
        otherUser.onlineStatus === false ? false : otherUser.isOnline || false,
      lastSeen: otherUser.lastSeen || null,
      presenceHidden: otherUser.onlineStatus === false,
      lastSeenHidden: otherUser.lastSeenVisibility === "nobody",
      photoHidden: otherUser.profilePhotoVisibility === "nobody",
      unread: 0,
      group: false,
      isGroup: false,
      members,
      memberCount: 2,
      time: formatTime(chat.lastMessageAt),
      lastMessage: chat.lastMessage || "",
      lastMessageSenderName: senderId === String(viewerId) ? "You" : senderName,
    };
  };

  const scrollToBottom = (behavior = "smooth") => {
    isNearBottomRef.current = true;

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });

      setShowScrollToBottom(false);
    }, 50);
  };

  // Shows the "jump to latest" control only when the reader has scrolled up.
  const handleMessagesScroll = (event) => {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isNearBottomRef.current = distanceFromBottom < 120;
    setShowScrollToBottom(distanceFromBottom > 240);
  };

  const handleCopyMessage = async (chatMessage) => {
    const text = chatMessage?.text || "";

    if (!text) {
      toast.error("There's no text to copy");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Older/insecure contexts have no async clipboard API.
        const textArea = document.createElement("textarea");

        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy the message");
    }
  };

  const toggleMuteChat = (chatId) => {
    setMutedChatIds((prev) => {
      const isMuted = prev.some(
        (mutedId) => String(mutedId) === String(chatId),
      );

      const next = isMuted
        ? prev.filter((mutedId) => String(mutedId) !== String(chatId))
        : [...prev, chatId];

      localStorage.setItem("mutedChats", JSON.stringify(next));

      return next;
    });
  };

  const getTypingText = (chat) => {
    if (!chat) {
      return "";
    }

    const chatId = String(chat.id);

    const resolveName = (entry) => {
      if (entry?.name) {
        return entry.name;
      }

      const member = (chat.members || []).find(
        (chatMember) => String(chatMember.id) === String(entry?.id),
      );

      return member?.name || chat.name || "Someone";
    };

    const recording = recordingUsers[chatId] || [];

    if (recording.length > 0) {
      const names = recording.map(resolveName);

      if (names.length === 1) {
        return `${names[0]} is recording a voice message...`;
      }

      if (names.length === 2) {
        return `${names[0]} and ${names[1]} are recording voice messages...`;
      }

      return `${names[0]}, ${names[1]} and ${names.length - 2} others are recording voice messages...`;
    }

    const users = typingUsers[chatId] || [];

    if (users.length === 0) {
      return "";
    }

    const names = users.map(resolveName);

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    }

    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    }

    if (names.length === 3) {
      return `${names[0]}, ${names[1]} and ${names[2]} are typing...`;
    }

    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
  };

  const aiConversation = aiChatSummary?.hasConversation
    ? {
        id: AI_CHAT_ID,
        name: "Bubbles AI",
        username: "bubbles-ai",
        profilePicture: bubbleAI,
        online: true,
        isGroup: false,
        group: false,
        isAI: true,
        unread: 0,
        time: aiChatSummary.time || "",
        lastMessage: aiChatSummary.lastMessage || "",
        lastMessageSenderName: "",
        userId: "",
      }
    : null;

  // Pinned chats float to the top of the list. Array#sort is stable, so the
  // rest keep the server's newest-first order.
  const orderedConversations = [
    ...(aiConversation ? [aiConversation] : []),
    ...conversations,
  ].sort((first, second) => {
    const firstPinned = pinnedChatIds.includes(String(first.id));
    const secondPinned = pinnedChatIds.includes(String(second.id));

    if (firstPinned === secondPinned) {
      return 0;
    }

    return firstPinned ? -1 : 1;
  });

  const isChatArchived = (chatId) =>
    archivedChatIds.some((archivedId) => String(archivedId) === String(chatId));

  const filteredConversations = orderedConversations.filter((chat) => {
    const archived = isChatArchived(chat.id);

    // Archived chats live in their own tab and never leak into the others.
    if (activeFilter === "archived") {
      return archived;
    }

    if (archived) {
      return false;
    }

    if (activeFilter === "unread") {
      return (
        chat.unread > 0 ||
        (typingUsers[String(chat.id)] || []).length > 0 ||
        (recordingUsers[String(chat.id)] || []).length > 0
      );
    }

    if (activeFilter === "groups") {
      return Boolean(chat.group || chat.isGroup);
    }

    if (activeFilter === "favorites") {
      return favoriteChatIds.includes(String(chat.id));
    }

    return true;
  });

  const filterCounts = {
    all: orderedConversations.filter((chat) => !isChatArchived(chat.id)).length,
    unread: orderedConversations.filter(
      (chat) => !isChatArchived(chat.id) && chat.unread > 0,
    ).length,
    groups: orderedConversations.filter(
      (chat) => !isChatArchived(chat.id) && (chat.group || chat.isGroup),
    ).length,
    favorites: orderedConversations.filter(
      (chat) =>
        !isChatArchived(chat.id) && favoriteChatIds.includes(String(chat.id)),
    ).length,
    archived: orderedConversations.filter((chat) => isChatArchived(chat.id))
      .length,
  };

  const isMoreFilterActive =
    activeFilter === "favorites" || activeFilter === "archived";

  const toggleFavorite = (chatId) => {
    setFavoriteChatIds((prev) => {
      const id = String(chatId);

      const next = prev.includes(id)
        ? prev.filter((favoriteId) => favoriteId !== id)
        : [...prev, id];

      localStorage.setItem("favoriteChats", JSON.stringify(next));

      return next;
    });
  };

  const togglePinnedChat = (chatId) => {
    setPinnedChatIds((prev) => {
      const id = String(chatId);

      const next = prev.includes(id)
        ? prev.filter((pinnedId) => pinnedId !== id)
        : [...prev, id];

      localStorage.setItem("pinnedChats", JSON.stringify(next));

      return next;
    });
  };

  const toggleArchivedChat = (chatId) => {
    setArchivedChatIds((prev) => {
      const id = String(chatId);
      const isArchived = prev.includes(id);

      const next = isArchived
        ? prev.filter((archivedId) => archivedId !== id)
        : [...prev, id];

      localStorage.setItem("archivedChats", JSON.stringify(next));

      return next;
    });
  };

  // The menu is rendered as a fixed overlay so it always paints above the
  // message list (and can never be clipped by the header's backdrop blur).
  const handleToggleChatMenu = () => {
    if (showChatMenu) {
      setShowChatMenu(false);
      return;
    }

    const rect = chatMenuButtonRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setChatMenuPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
      width: Math.max(200, Math.min(240, window.innerWidth - 16)),
    });

    setShowChatMenu(true);
  };

  // Right-click (or long-press) on a chat opens a quick actions menu anchored
  // to the cursor. It's a fixed overlay so it can't be clipped by the list.
  const openChatContextMenu = (event, chat) => {
    event.preventDefault();
    event.stopPropagation();

    const width = 232;
    const estimatedHeight = chat?.isGroup ? 300 : 352;
    const left = Math.max(
      8,
      Math.min(event.clientX, window.innerWidth - width - 8),
    );
    const top = Math.max(
      8,
      Math.min(event.clientY, window.innerHeight - estimatedHeight - 8),
    );

    setChatContextMenu({
      chatId: String(chat.id),
      left,
      top,
    });
    setShowChatMenu(false);
    setShowFilterMenu(false);
  };

  const openChatSearch = () => {
    setShowChatMenu(false);
    setShowProfile(false);
    setShowChatSearch(true);
  };

  const closeChatSearch = () => {
    setShowChatSearch(false);
    setChatSearchQuery("");
  };

  const loadChatMessages = async (chatId) => {
    try {
      setLoadingMessages(true);

      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Authentication token not found");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await getChatMessagesAPI(chatId, reqHeader);

      if (response.status === 200) {
        const messages = response.data.messages || [];

        const loggedInUser = JSON.parse(localStorage.getItem("user"));

        const currentUserId = String(
          loggedInUser?._id || loggedInUser?.id || "",
        );

        const formattedMessages = messages.map((chatMessage) => {
          const senderId = String(
            chatMessage.sender?._id || chatMessage.sender || "",
          );

          const isSentByMe = senderId === currentUserId;

          return {
            id: chatMessage._id,
            sender: isSentByMe ? "me" : "other",
            text: chatMessage.text || "",
            time: formatTime(chatMessage.createdAt),
            type: isSentByMe ? "sent" : "received",
            isDelivered: chatMessage.isDelivered || false,
            isRead: chatMessage.isRead || false,
            deliveredAt: chatMessage.deliveredAt || null,
            readAt: chatMessage.readAt || null,
            isPinned: chatMessage.isPinned || false,
            pinnedAt: chatMessage.pinnedAt || null,
            pinnedBy: chatMessage.pinnedBy
              ? String(chatMessage.pinnedBy._id || chatMessage.pinnedBy)
              : null,
            pinnedByName:
              chatMessage.pinnedBy?.name ||
              chatMessage.pinnedBy?.username ||
              "",
            sentAt: chatMessage.createdAt || null,
            isDeleted: chatMessage.isDeleted || false,
            isEdited: chatMessage.isEdited || false,
            senderId,
            senderName:
              chatMessage.sender?.name ||
              chatMessage.sender?.username ||
              (isSentByMe ? currentUserName : selectedChat?.name || ""),
            replyTo: chatMessage.replyTo
              ? {
                  id: chatMessage.replyTo._id || chatMessage.replyTo,
                  text: chatMessage.replyTo.text || "",
                  isDeleted: chatMessage.replyTo.isDeleted || false,
                  isEdited: chatMessage.replyTo.isEdited || false,
                  sender: chatMessage.replyTo.sender || null,
                  senderId: String(
                    chatMessage.replyTo.sender?._id ||
                      chatMessage.replyTo.sender ||
                      "",
                  ),
                  senderName:
                    chatMessage.replyTo.sender?.name ||
                    chatMessage.replyTo.sender?.username ||
                    "",
                  messageType: chatMessage.replyTo.messageType || "text",
                }
              : null,
            messageType: chatMessage.messageType || "text",
            callInfo: chatMessage.callInfo || null,
            files: chatMessage.files || [],
          };
        });

        setChatMessages((prev) => ({
          ...prev,
          [chatId]: formattedMessages,
        }));

        if (formattedMessages.length > 0) {
          const lastMessage = formattedMessages[formattedMessages.length - 1];

          setConversations((prev) =>
            prev.map((chat) =>
              String(chat.id) === String(chatId)
                ? {
                    ...chat,
                    time: lastMessage.time,
                    lastMessage: getMessagePreview(lastMessage),
                    lastMessageSenderName: chat.isGroup
                      ? lastMessage.senderName || ""
                      : chat.lastMessageSenderName,
                  }
                : chat,
            ),
          );
        } else {
          setConversations((prev) =>
            prev.map((chat) =>
              String(chat.id) === String(chatId)
                ? {
                    ...chat,
                    lastMessage: "",
                    time: "",
                  }
                : chat,
            ),
          );
        }
      }
    } catch (error) {
      console.log("Error fetching chat messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (chatId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const reqHeader = {
      Authorization: `Bearer ${token}`,
    };

    // Delivery is always acknowledged. "Read receipts" only controls the
    // read tick: with it off the sender still sees "delivered", never "read".
    try {
      await markMessagesAsDeliveredAPI(chatId, reqHeader);
    } catch (error) {
      console.log("Error marking messages as delivered:", error);
    }

    if (!settingsRef.current.readReceipts) {
      return;
    }

    try {
      const response = await markMessagesAsReadAPI(chatId, reqHeader);

      if (response.status === 200) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((chatMessage) => ({
            ...chatMessage,
            isRead: chatMessage.type === "received" ? true : chatMessage.isRead,
          })),
        }));
      }
    } catch (error) {
      console.log("Error marking messages as read:", error);
    }
  };

  const loadMyChats = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoadingChats(true);
      }

      const token = localStorage.getItem("token");
      const loggedInUser = JSON.parse(localStorage.getItem("user"));

      if (!token) {
        console.log("Authentication token not found");
        return;
      }

      if (!loggedInUser) {
        console.log("Logged in user not found");
        return;
      }

      const currentUserId = String(loggedInUser._id || loggedInUser.id || "");

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await getMyChatsAPI(reqHeader);

      if (response.status === 200) {
        const chats = response.data.chats || [];

        const formattedChats = chats
          .map((chat) =>
            formatConversation(chat, currentUserId, currentUserName),
          )
          .filter(Boolean);

        setConversations((prev) => {
          return formattedChats.map((newChat) => {
            const oldChat = prev.find(
              (chat) => String(chat.id) === String(newChat.id),
            );

            return {
              ...newChat,
              unread: oldChat?.unread || 0,
            };
          });
        });

        setChatMessages((prev) => {
          const updatedMessages = {
            ...prev,
          };

          formattedChats.forEach((chat) => {
            if (!updatedMessages[chat.id]) {
              updatedMessages[chat.id] = [];
            }
          });

          return updatedMessages;
        });

        // Apply the view encoded in the current history entry exactly once.
        // A fresh entry (for example straight after login) can restore the
        // last chat, while a real Back navigation to the list must stay on
        // the list even though `activeChatId` is still in localStorage.
        if (!initialViewAppliedRef.current) {
          initialViewAppliedRef.current = true;

          const currentState = window.history.state || {};
          const historyView = currentState.bubblesView || "list";
          const historyChatId = currentState.bubblesChatId;
          const savedChatId = localStorage.getItem("activeChatId");
          const canRestoreSavedChat =
            savedChatId &&
            formattedChats.some(
              (chat) => String(chat.id) === String(savedChatId),
            );

          let targetChatId = null;

          if (
            historyView === "chat" &&
            historyChatId &&
            formattedChats.some(
              (chat) => String(chat.id) === String(historyChatId),
            )
          ) {
            targetChatId = historyChatId;
          } else if (
            !initialHistoryRef.current.hasState &&
            canRestoreSavedChat
          ) {
            targetChatId = savedChatId;
            writeHistoryEntry("chat", targetChatId);
          }

          if (historyView === "ai") {
            setSelectedConversation(null);
            setShowAIChat(true);
            setShowMobileSidebar(false);
            localStorage.removeItem("activeChatId");
          } else if (historyView === "new-chat") {
            setSelectedConversation(null);
            setShowNewChat(true);
            setShowMobileSidebar(true);
            localStorage.removeItem("activeChatId");
          } else if (targetChatId) {
            setSelectedConversation(targetChatId);
            localStorage.setItem("activeChatId", targetChatId);
            loadChatMessages(targetChatId);
            markMessagesAsRead(targetChatId);
          } else {
            setSelectedConversation(null);
            setShowAIChat(false);
            setShowNewChat(false);
            setShowMobileSidebar(true);

            if (historyView !== "list") {
              writeHistoryEntry("list", null, { replace: true });
            }

            localStorage.removeItem("activeChatId");
          }
        }
      }
    } catch (error) {
      console.log("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    // React StrictMode runs mount effects twice in development. The seed must
    // only happen once, otherwise the second pass would think the list entry
    // came from a real navigation and disable saved-chat restore.
    if (initialHistoryRef.current.initialized) {
      return;
    }

    const currentState = window.history.state || {};
    const hasViewState = Boolean(currentState.bubblesView);

    initialHistoryRef.current = {
      initialized: true,
      hasState: hasViewState,
    };

    if (hasViewState) {
      historyIndexRef.current = Number(currentState.bubblesIndex) || 0;
      return;
    }

    // Seed a "chat list" entry so opening a chat always has somewhere safe
    // to return to. Login/registration replace their own entries first, so
    // Back can never reveal an authenticated screen at `/login`.
    window.history.replaceState(
      {
        ...currentState,
        bubblesView: "list",
        bubblesChatId: null,
        bubblesIndex: 0,
      },
      "",
      window.location.href,
    );

    historyIndexRef.current = 0;
  }, []);

  useEffect(() => {
    loadMyChats();
  }, []);

  // Socket handlers refresh the list without the loading flash.
  useEffect(() => {
    refreshChatsRef.current = () => loadMyChats({ silent: true });
  });

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleOnlineUsers = (onlineUserIds) => {
      const onlineSet = new Set(onlineUserIds.map((id) => String(id)));

      setConversations((prev) =>
        prev.map((chat) => ({
          ...chat,
          online: chat.presenceHidden
            ? false
            : onlineSet.has(String(chat.userId)),
        })),
      );
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      setConversations((prev) =>
        prev.map((chat) =>
          String(chat.userId) === String(userId)
            ? {
                ...chat,
                online: chat.presenceHidden ? false : isOnline,
                lastSeen,
              }
            : chat,
        ),
      );
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userStatus", handleUserStatus);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userStatus", handleUserStatus);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !selectedConversation) {
      return;
    }

    socket.emit("joinChat", selectedConversation);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      socket.emit("stopTyping", selectedConversation);
      socket.emit("leaveChat", selectedConversation);
    };
  }, [socket, selectedConversation]);

  // Keep the server's view of our presence in sync with the privacy setting.
  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit("setOnlineStatus", authUser?.onlineStatus !== false);
  }, [socket, authUser?.onlineStatus]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewMessage = (socketData) => {
      if (!socketData) {
        return;
      }

      const newMessage = socketData.message;
      const chatData = socketData.chat;

      if (!newMessage || !chatData) {
        return;
      }

      const chatId = String(
        chatData._id || newMessage.chat?._id || newMessage.chat || "",
      );

      if (!chatId) {
        return;
      }

      const loggedInUser = JSON.parse(localStorage.getItem("user"));

      const currentUserId = String(loggedInUser?._id || loggedInUser?.id || "");

      const senderId = String(
        newMessage.sender?._id || newMessage.sender || "",
      );

      const isMine = senderId === currentUserId;

      // Our own text/media messages are added from the send response; call
      // logs and group activity only arrive over the socket, so those pass.
      if (
        isMine &&
        newMessage.messageType !== "call" &&
        newMessage.messageType !== "system"
      ) {
        return;
      }

      const isCurrentChat = String(selectedConversation) === chatId;

      const formattedMessage = {
        id: newMessage._id,
        sender: isMine ? "me" : "other",
        text: newMessage.text || "",
        time: formatTime(newMessage.createdAt),
        type: isMine ? "sent" : "received",
        isDelivered: newMessage.isDelivered || false,
        isRead: isMine ? newMessage.isRead || false : isCurrentChat,
        deliveredAt: newMessage.deliveredAt || null,
        readAt: newMessage.readAt || null,
        isPinned: newMessage.isPinned || false,
        pinnedAt: newMessage.pinnedAt || null,
        pinnedBy: newMessage.pinnedBy
          ? String(newMessage.pinnedBy._id || newMessage.pinnedBy)
          : null,
        pinnedByName:
          newMessage.pinnedBy?.name || newMessage.pinnedBy?.username || "",
        sentAt: newMessage.createdAt || null,
        isDeleted: newMessage.isDeleted || false,
        isEdited: newMessage.isEdited || false,
        senderId,
        senderName:
          newMessage.sender?.name ||
          newMessage.sender?.username ||
          selectedChat?.name ||
          "",
        replyTo: newMessage.replyTo
          ? {
              id: newMessage.replyTo._id || newMessage.replyTo,
              text: newMessage.replyTo.text || "",
              isDeleted: newMessage.replyTo.isDeleted || false,
              isEdited: newMessage.replyTo.isEdited || false,
              sender: newMessage.replyTo.sender || null,
              senderId: String(
                newMessage.replyTo.sender?._id ||
                  newMessage.replyTo.sender ||
                  "",
              ),
              senderName:
                newMessage.replyTo.sender?.name ||
                newMessage.replyTo.sender?.username ||
                "",
              messageType: newMessage.replyTo.messageType || "text",
            }
          : null,
        messageType: newMessage.messageType || "text",
        callInfo: newMessage.callInfo || null,
        files: newMessage.files || [],
      };

      setChatMessages((prev) => {
        const existingMessages = prev[chatId] || [];

        const resolvedReplyTo = formattedMessage.replyTo
          ? existingMessages.find(
              (chatMessage) =>
                String(chatMessage.id) === String(formattedMessage.replyTo.id),
            )
          : null;

        const messageWithResolvedReply = resolvedReplyTo
          ? {
              ...formattedMessage,
              replyTo: {
                ...formattedMessage.replyTo,
                text: resolvedReplyTo.text || "",
                isDeleted: resolvedReplyTo.isDeleted || false,
                isEdited: resolvedReplyTo.isEdited || false,
                sender: resolvedReplyTo.sender || null,
                senderId: resolvedReplyTo.senderId || "",
                senderName: resolvedReplyTo.senderName || "",
              },
            }
          : formattedMessage;

        const alreadyExists = existingMessages.some(
          (existingMessage) =>
            String(existingMessage.id) === String(newMessage._id),
        );

        if (alreadyExists) {
          return prev;
        }

        return {
          ...prev,
          [chatId]: [...existingMessages, messageWithResolvedReply],
        };
      });

      const participants = chatData.participants || [];

      const otherUser = participants.find(
        (participant) => String(participant._id) !== currentUserId,
      );

      const previewText = getMessagePreview(formattedMessage);

      setConversations((prev) => {
        const existingChat = prev.find((chat) => String(chat.id) === chatId);

        const unreadCount = isMine
          ? existingChat?.unread || 0
          : isCurrentChat
            ? 0
            : (existingChat?.unread || 0) + 1;

        const baseChat =
          formatConversation(
            chatData,
            currentUserId,
            loggedInUser?.name || loggedInUser?.username || "You",
          ) || existingChat;

        if (!baseChat) {
          return prev;
        }

        const updatedChat = {
          ...baseChat,
          unread: unreadCount,
          time: formattedMessage.time,
          lastMessage: previewText,
          lastMessageSenderName: baseChat.isGroup
            ? isMine
              ? "You"
              : formattedMessage.senderName ||
                existingChat?.lastMessageSenderName ||
                ""
            : existingChat?.lastMessageSenderName || "",
        };

        return [
          updatedChat,
          ...prev.filter((chat) => String(chat.id) !== chatId),
        ];
      });

      if (!isCurrentChat && !isMine) {
        const senderLabel =
          formattedMessage.senderName || otherUser?.name || "New message";

        const isMuted = mutedChatsRef.current.some(
          (mutedId) => String(mutedId) === String(chatId),
        );

        if (settingsRef.current.messageNotifications && !isMuted) {
          const openChat = () => {
            openChatRef.current?.(chatId);
          };

          toast(
            (toastInstance) => (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(toastInstance.id);
                  openChat();
                }}
                className="w-full text-left"
              >
                <span className="block text-sm font-semibold text-ink truncate">
                  {senderLabel}
                </span>

                <span className="block text-xs text-muted truncate mt-0.5">
                  {previewText || "Sent you a message"}
                </span>
              </button>
            ),
            { duration: 4500 },
          );

          if (
            document.hidden &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            const desktopNotification = new Notification(senderLabel, {
              body: previewText || "Sent you a message",
            });

            desktopNotification.onclick = () => {
              window.focus();
              openChat();
              desktopNotification.close();
            };
          }
        }

        if (settingsRef.current.notificationSound && !isMuted) {
          playNotificationSound();
        }
      }

      if (isCurrentChat) {
        markMessagesAsRead(chatId);

        // Don't yank the reader back down while they're reading history.
        if (isNearBottomRef.current) {
          scrollToBottom();
        }
      }
    };

    const handleMessagesRead = ({ chatId, messageIds, readAt }) => {
      // Only the messages the server actually marked read — a blocked message
      // must never turn into a blue double tick.
      const readIds = Array.isArray(messageIds)
        ? new Set(messageIds.map((id) => String(id)))
        : null;

      setChatMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((chatMessage) => {
          if (chatMessage.type !== "sent") {
            return chatMessage;
          }

          if (readIds && !readIds.has(String(chatMessage.id))) {
            return chatMessage;
          }

          return {
            ...chatMessage,
            isDelivered: true,
            isRead: true,
            deliveredAt: chatMessage.deliveredAt || readAt || null,
            readAt: readAt || null,
          };
        }),
      }));
    };

    const handleMessageDelivered = ({ messageId, chatId, deliveredAt }) => {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((chatMessage) =>
          String(chatMessage.id) === String(messageId)
            ? {
                ...chatMessage,
                isDelivered: true,
                deliveredAt: deliveredAt || chatMessage.deliveredAt || null,
              }
            : chatMessage,
        ),
      }));
    };

    const handleMessagePinned = ({
      chatId,
      messageId,
      isPinned,
      pinnedAt,
      pinnedBy,
    }) => {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((chatMessage) =>
          String(chatMessage.id) === String(messageId)
            ? {
                ...chatMessage,
                isPinned,
                pinnedAt: isPinned ? pinnedAt : null,
                pinnedBy: isPinned && pinnedBy ? String(pinnedBy._id) : null,
                pinnedByName:
                  isPinned && pinnedBy
                    ? pinnedBy.name || pinnedBy.username || ""
                    : "",
              }
            : chatMessage,
        ),
      }));
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      setChatMessages((prev) => {
        const messages = prev[chatId] || [];

        const deletedIndex = messages.findIndex(
          (chatMessage) => String(chatMessage.id) === String(messageId),
        );

        if (deletedIndex === -1) {
          return prev;
        }

        const updatedMessages = messages.map((chatMessage) =>
          String(chatMessage.id) === String(messageId)
            ? {
                ...chatMessage,
                text: "",
                isDeleted: true,
                isDelivered: false,
                isRead: false,
              }
            : chatMessage,
        );

        if (deletedIndex === messages.length - 1) {
          setConversations((prevConversations) =>
            prevConversations.map((chat) =>
              String(chat.id) === String(chatId)
                ? {
                    ...chat,
                    lastMessage: "This message was deleted",
                  }
                : chat,
            ),
          );
        }

        return {
          ...prev,
          [chatId]: updatedMessages,
        };
      });

      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
    };

    const handleMessageDeletedForUser = ({ messageId, chatId }) => {
      setChatMessages((prev) => {
        const messages = prev[chatId] || [];

        const deletedMessageIndex = messages.findIndex(
          (chatMessage) => String(chatMessage.id) === String(messageId),
        );

        if (deletedMessageIndex === -1) {
          return prev;
        }

        const updatedMessages = messages.filter(
          (chatMessage) => String(chatMessage.id) !== String(messageId),
        );

        const lastMessage = updatedMessages[updatedMessages.length - 1];

        setConversations((prevConversations) =>
          prevConversations.map((chat) => {
            if (String(chat.id) !== String(chatId)) {
              return chat;
            }

            return {
              ...chat,
              time: lastMessage?.time || "",
              lastMessage: lastMessage
                ? lastMessage.isDeleted
                  ? "This message was deleted"
                  : lastMessage.text
                : "",
            };
          }),
        );

        return {
          ...prev,
          [chatId]: updatedMessages,
        };
      });

      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
    };

    const handleMessageEdited = ({ message: editedMessage }) => {
      if (!editedMessage) {
        return;
      }

      const chatId = String(
        editedMessage.chat?._id || editedMessage.chat || "",
      );

      if (!chatId) {
        return;
      }

      const editedText = editedMessage.text || "";

      setChatMessages((prev) => {
        const messages = prev[chatId] || [];
        const editedIndex = messages.findIndex(
          (chatMessage) => String(chatMessage.id) === String(editedMessage._id),
        );

        if (editedIndex === -1) {
          return prev;
        }

        const updatedMessages = messages.map((chatMessage) =>
          String(chatMessage.id) === String(editedMessage._id)
            ? {
                ...chatMessage,
                text: editedText,
                isEdited: true,
              }
            : chatMessage,
        );

        if (editedIndex === messages.length - 1) {
          setConversations((prevConversations) =>
            prevConversations.map((chat) =>
              String(chat.id) === chatId
                ? {
                    ...chat,
                    lastMessage: editedText,
                  }
                : chat,
            ),
          );
        }

        return {
          ...prev,
          [chatId]: updatedMessages,
        };
      });
    };

    const handleUserTyping = ({ chatId, userId, userName }) => {
      const roomId = String(chatId);
      const typingUserId = String(userId);

      setTypingUsers((prev) => {
        const existing = prev[roomId] || [];

        if (existing.some((entry) => String(entry.id) === typingUserId)) {
          return prev;
        }

        return {
          ...prev,
          [roomId]: [
            ...existing,
            { id: typingUserId, name: userName || "" },
          ],
        };
      });
    };

    const handleUserStoppedTyping = ({ chatId, userId }) => {
      const roomId = String(chatId);
      const typingUserId = String(userId);

      setTypingUsers((prev) => {
        const existing = prev[roomId] || [];

        const updated = existing.filter(
          (entry) => String(entry.id) !== typingUserId,
        );

        const newState = {
          ...prev,
        };

        if (updated.length === 0) {
          delete newState[roomId];
        } else {
          newState[roomId] = updated;
        }

        return newState;
      });
    };

    const handleUserRecording = ({ chatId, userId, userName }) => {
      const roomId = String(chatId);
      const recordingUserId = String(userId);

      setRecordingUsers((prev) => {
        const existing = prev[roomId] || [];

        if (existing.some((entry) => String(entry.id) === recordingUserId)) {
          return prev;
        }

        return {
          ...prev,
          [roomId]: [
            ...existing,
            { id: recordingUserId, name: userName || "" },
          ],
        };
      });
    };

    const handleUserStoppedRecording = ({ chatId, userId }) => {
      const roomId = String(chatId);
      const recordingUserId = String(userId);

      setRecordingUsers((prev) => {
        const existing = prev[roomId] || [];

        const updated = existing.filter(
          (entry) => String(entry.id) !== recordingUserId,
        );

        const newState = {
          ...prev,
        };

        if (updated.length === 0) {
          delete newState[roomId];
        } else {
          newState[roomId] = updated;
        }

        return newState;
      });
    };

    const handleTypingUsers = ({
      chatId,
      userIds,
      userNames,
      recordingUserIds,
      recordingUserNames,
    }) => {
      const roomId = String(chatId);

      const users = (userIds || []).map((id, index) => ({
        id: String(id),
        name: userNames?.[index] || "",
      }));

      const recording = (recordingUserIds || []).map((id, index) => ({
        id: String(id),
        name: recordingUserNames?.[index] || "",
      }));

      setTypingUsers((prev) => {
        const newState = {
          ...prev,
        };

        if (users.length === 0) {
          delete newState[roomId];
        } else {
          newState[roomId] = users;
        }

        return newState;
      });

      setRecordingUsers((prev) => {
        const newState = {
          ...prev,
        };

        if (recording.length === 0) {
          delete newState[roomId];
        } else {
          newState[roomId] = recording;
        }

        return newState;
      });
    };

    // Group membership, names and avatars change on the server; a light
    // refresh keeps every open sidebar in sync without a spinner.
    const handleChatsChanged = () => {
      refreshChatsRef.current?.();
    };

    const handleChatRemoved = ({ chatId }) => {
      if (!chatId) {
        return;
      }

      setConversations((prev) =>
        prev.filter((chat) => String(chat.id) !== String(chatId)),
      );

      setChatMessages((prev) => {
        const next = { ...prev };
        delete next[String(chatId)];
        return next;
      });

      if (String(selectedConversation) === String(chatId)) {
        setSelectedConversation(null);
        setShowProfile(false);
        localStorage.removeItem("activeChatId");
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagePinned", handleMessagePinned);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageDeletedForUser", handleMessageDeletedForUser);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("userRecording", handleUserRecording);
    socket.on("userStoppedRecording", handleUserStoppedRecording);
    socket.on("typingUsers", handleTypingUsers);
    socket.on("chatsChanged", handleChatsChanged);
    socket.on("chatRemoved", handleChatRemoved);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagePinned", handleMessagePinned);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageDeletedForUser", handleMessageDeletedForUser);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("userRecording", handleUserRecording);
      socket.off("userStoppedRecording", handleUserStoppedRecording);
      socket.off("typingUsers", handleTypingUsers);
      socket.off("chatsChanged", handleChatsChanged);
      socket.off("chatRemoved", handleChatRemoved);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    scrollToBottom("auto");
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    scrollToBottom();
  }, [currentMessages.length, currentTypingUsers.length, selectedConversation]);

  const handleOpenAI = () => {
    writeHistoryEntry("ai");
    setShowAIChat(true);
    setSelectedConversation(null);
    localStorage.removeItem("activeChatId");

    setShowProfile(false);
    setShowNewChat(false);
    setShowEmojiPicker(false);
    setShowChatMenu(false);
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);

    setMessage("");
    setEditingMessageId(null);
    setReplyingToMessage(null);
    setSelectedFiles([]);

    cancelRecording();

    setShowMobileSidebar(false);
  };

  const handleConversationClick = async (chatId) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socket && selectedConversation) {
      socket.emit("stopTyping", selectedConversation);
    }

    if (String(chatId) === AI_CHAT_ID) {
      handleOpenAI();
      return;
    }

    setConversations((prev) =>
      prev.map((chat) =>
        String(chat.id) === String(chatId)
          ? {
              ...chat,
              unread: 0,
            }
          : chat,
      ),
    );

    // Opening another chat from the list replaces the current chat entry, so
    // one Back always lands on the chat list rather than a chain of chats.
    writeHistoryEntry("chat", chatId, {
      replace:
        currentHistoryView() === "new-chat" ||
        currentHistoryView() === "chat",
    });

    setSelectedConversation(chatId);

    // Remember the open chat so a refresh returns to it.
    localStorage.setItem("activeChatId", chatId);

    setShowProfile(false);
    setShowNewChat(false);
    setShowAIChat(false);
    setShowEmojiPicker(false);
    setShowChatMenu(false);
    setShowChatSearch(false);
    setChatSearchQuery("");
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);
    setPinnedIndex(0);
    cancelRecording();

    setMessage("");
    setEditingMessageId(null);
    setReplyingToMessage(null);
    setSelectedFiles([]);

    setShowMobileSidebar(false);

    await loadChatMessages(chatId);
    await markMessagesAsRead(chatId);

    scrollToBottom("auto");
  };

  // Notifications (toast + desktop) need a way to open a chat from outside
  // the render tree; a ref keeps the latest handler without re-subscribing.
  useEffect(() => {
    openChatRef.current = handleConversationClick;
  });

  // The header's 3-dot menu closes on any click outside it, and on resize
  // (it's anchored to the button with fixed coordinates).
  useEffect(() => {
    if (!showChatMenu) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      const insideMenu = chatMenuRef.current?.contains(event.target);
      const insideButton = chatMenuButtonRef.current?.contains(event.target);

      if (!insideMenu && !insideButton) {
        setShowChatMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowChatMenu(false);
      }
    };

    const handleResize = () => setShowChatMenu(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, [showChatMenu]);

  // The filter dropdown and the chat right-click menu follow the same rules:
  // close on an outside click, Escape, resize, or any scroll.
  useEffect(() => {
    if (!showFilterMenu) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!filterMenuRef.current?.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowFilterMenu(false);
      }
    };

    const handleResize = () => setShowFilterMenu(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, [showFilterMenu]);

  useEffect(() => {
    if (!chatContextMenu) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!chatContextMenuRef.current?.contains(event.target)) {
        setChatContextMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setChatContextMenu(null);
      }
    };

    const closeMenu = () => setChatContextMenu(null);

    const closeOnScroll = (event) => {
      // Scrolling inside the menu itself shouldn't dismiss it.
      if (chatContextMenuRef.current?.contains(event.target)) {
        return;
      }

      setChatContextMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeOnScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [chatContextMenu]);

  // Microphone problems (permission refused, unsupported browser) surface as
  // the same styled toasts the rest of the app uses.
  useEffect(() => {
    if (!recorderError) {
      return;
    }

    toast.error(recorderError);
    clearRecorderError();
  }, [recorderError, clearRecorderError]);

  const handleSelectUser = async (user) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Authentication token not found");
        return;
      }

      const reqBody = {
        userId: user._id,
      };

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await createOrGetChatAPI(reqBody, reqHeader);

      if (response.status === 200 || response.status === 201) {
        const chat = response.data.chat;

        const newConversation = {
          id: chat._id,
          userId: user._id,
          name: user.name,
          username: user.username || "",
          bio: user.bio || "",
          profilePicture: user.profilePicture || defaultProfile,
          online:
            user.onlineStatus === false ? false : user.isOnline || false,
          lastSeen: user.lastSeen || null,
          presenceHidden: user.presenceHidden ?? user.onlineStatus === false,
          lastSeenHidden: user.lastSeenVisibility === "nobody",
          photoHidden:
            user.photoHidden ?? user.profilePhotoVisibility === "nobody",
          unread: 0,
          group: false,
          isGroup: false,
          time: formatTime(chat.lastMessageAt),
          lastMessage: chat.lastMessage || "",
          lastMessageSenderName: "",
        };

        setConversations((prev) => {
          const updatedChat = {
            ...newConversation,
            unread: 0,
          };

          return [
            updatedChat,
            ...prev.filter(
              (conversation) => String(conversation.id) !== String(chat._id),
            ),
          ];
        });

        writeHistoryEntry("chat", chat._id, {
          replace:
            currentHistoryView() === "new-chat" ||
            currentHistoryView() === "chat",
        });
        localStorage.setItem("activeChatId", chat._id);

        setSelectedConversation(chat._id);

        setShowNewChat(false);
        setShowAIChat(false);
        setShowProfile(false);
        setShowEmojiPicker(false);
        setOpenMessageMenuId(null);
        setMessageMenuPosition(null);
        setPinnedIndex(0);

        setMessage("");
        setReplyingToMessage(null);
        setSelectedFiles([]);

        setShowMobileSidebar(false);

        await loadChatMessages(chat._id);
        await markMessagesAsRead(chat._id);

        scrollToBottom("auto");
      }
    } catch (error) {
      console.log("Error creating or getting chat:", error);
    }
  };

  const handleOpenNewChat = () => {
    writeHistoryEntry("new-chat");

    setShowNewChat(true);
    setShowAIChat(false);
    setShowProfile(false);
    setShowChatMenu(false);
    setShowEmojiPicker(false);

    // On phones the new-chat picker replaces the list; on desktop the list
    // stays visible while the picker fills the sidebar.
    setShowMobileSidebar(true);
  };

  const handleTyping = (value) => {
    if (!socket || !selectedConversation) {
      return;
    }

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isTypingRef.current) {
        socket.emit("stopTyping", selectedConversation);
        isTypingRef.current = false;
      }

      return;
    }

    // Only emit once per typing burst instead of on every keystroke.
    if (!isTypingRef.current) {
      socket.emit("typing", selectedConversation);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", selectedConversation);

      isTypingRef.current = false;
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!selectedConversation) {
      return;
    }

    if (!canPostInGroup) {
      toast.error("Only admins can send messages in this group");
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socket) {
      socket.emit("stopTyping", selectedConversation);
    }

    if (!trimmedMessage && selectedFiles.length === 0) {
      return;
    }

    try {
      setSendingMessage(true);

      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Authentication token not found");
        setSendingMessage(false);
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      if (editingMessageId) {
        const response = await editMessageAPI(
          editingMessageId,
          { text: trimmedMessage },
          reqHeader,
        );

        if (response.status === 200) {
          const editedMessage = response.data.data;
          const editedText = editedMessage.text || trimmedMessage;

          setChatMessages((prev) => ({
            ...prev,
            [selectedConversation]: (prev[selectedConversation] || []).map(
              (chatMessage) =>
                String(chatMessage.id) === String(editingMessageId)
                  ? {
                      ...chatMessage,
                      text: editedText,
                      isEdited: true,
                    }
                  : chatMessage,
            ),
          }));

          setConversations((prev) =>
            prev.map((chat) => {
              if (String(chat.id) !== String(selectedConversation)) {
                return chat;
              }

              const messages = chatMessages[selectedConversation] || [];
              const editedIndex = messages.findIndex(
                (chatMessage) =>
                  String(chatMessage.id) === String(editingMessageId),
              );

              return editedIndex === messages.length - 1
                ? { ...chat, lastMessage: editedText }
                : chat;
            }),
          );

          setMessage("");
          setEditingMessageId(null);
          setShowEmojiPicker(false);
          setSelectedFiles([]);
        }

        return;
      }

      const chatId = selectedConversation;
      tempIdCounterRef.current += 1;
      const tempId = `temp-${tempIdCounterRef.current}`;
      const snapshotFiles = [...selectedFiles];
      const snapshotReply = replyingToMessage;
      const snapshotPreviews = [...filePreviewUrls];

      const formData = new FormData();

      formData.append("chatId", chatId);
      formData.append("text", trimmedMessage);
      formData.append(
        "messageType",
        snapshotFiles.length > 0
          ? snapshotFiles.every((file) => file.type.startsWith("image/"))
            ? "image"
            : "file"
          : "text",
      );
      formData.append("replyTo", snapshotReply?.id || "");

      snapshotFiles.forEach((file) => {
        formData.append("files", file);
      });

      const optimisticMessage = {
        id: tempId,
        sender: "me",
        text: trimmedMessage,
        time: formatTime(new Date()),
        type: "sent",
        isDelivered: false,
        isRead: false,
        deliveredAt: null,
        readAt: null,
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null,
        pinnedByName: "",
        sentAt: new Date().toISOString(),
        isDeleted: false,
        isEdited: false,
        senderId: currentUserId,
        senderName: currentUserName,
        pending: true,
        replyTo: snapshotReply
          ? {
              id: snapshotReply.id,
              text: snapshotReply.text || "",
              isDeleted: snapshotReply.isDeleted || false,
              isEdited: snapshotReply.isEdited || false,
              sender: snapshotReply.sender || null,
              senderId:
                snapshotReply.senderId ||
                (snapshotReply.type === "sent" ? currentUserId : ""),
              senderName:
                snapshotReply.senderName ||
                (snapshotReply.type === "sent"
                  ? currentUserName
                  : selectedChat?.name || ""),
              messageType: snapshotReply.messageType || "text",
            }
          : null,
        messageType: formData.get("messageType"),
        files: snapshotFiles.map((file, index) => ({
          url: snapshotPreviews[index],
          name: file.name,
          mimeType: file.type,
          size: file.size,
        })),
      };

      // Show the message instantly and clear the composer before the request
      // resolves, so sending feels immediate even on a slow connection.
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), optimisticMessage],
      }));

      setConversations((prev) => {
        const currentChat = prev.find(
          (chat) => String(chat.id) === String(chatId),
        );

        if (!currentChat) {
          return prev;
        }

        const updatedChat = {
          ...currentChat,
          time: optimisticMessage.time,
          lastMessage:
            optimisticMessage.text ||
            (optimisticMessage.files.length > 0
              ? optimisticMessage.messageType === "image"
                ? "Photo"
                : "File"
              : ""),
          unread: 0,
        };

        return [
          updatedChat,
          ...prev.filter((chat) => String(chat.id) !== String(chatId)),
        ];
      });

      setMessage("");
      setSelectedFiles([]);
      setReplyingToMessage(null);
      setShowEmojiPicker(false);
      scrollToBottom();

      try {
        const response = await sendMessageAPI(formData, reqHeader);

        if (response.status === 201) {
          const savedMessage = response.data.data;

          const confirmedMessage = {
            ...optimisticMessage,
            id: savedMessage._id,
            text: savedMessage.text,
            time: formatTime(savedMessage.createdAt),
            isDelivered: savedMessage.isDelivered || false,
            isRead: savedMessage.isRead || false,
            isDeleted: savedMessage.isDeleted || false,
            isEdited: savedMessage.isEdited || false,
            messageType: savedMessage.messageType || "text",
            files: savedMessage.files || [],
            pending: false,
          };

          setChatMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((chatMessage) =>
              String(chatMessage.id) === tempId
                ? confirmedMessage
                : chatMessage,
            ),
          }));
        }
      } catch (sendError) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((chatMessage) =>
            String(chatMessage.id) === tempId
              ? { ...chatMessage, pending: false, failed: true }
              : chatMessage,
          ),
        }));

        setFailedMessageIds((prev) =>
          prev.includes(tempId) ? prev : [...prev, tempId],
        );

        toast.error(
          sendError?.response?.data?.message || "Unable to send message",
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (editingMessageId
            ? "Unable to edit message"
            : "Unable to send message"),
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // ---- Voice notes ------------------------------------------------------
  const sendVoiceMessage = async ({ blob, duration }) => {
    if (!selectedConversation || !blob) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const reqHeader = { Authorization: `Bearer ${token}` };

    const mimeType = blob.type || "audio/webm";
    const extension = mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("mp4")
        ? "m4a"
        : "webm";

    const file = new File([blob], `voice-message.${extension}`, {
      type: mimeType,
    });

    const localUrl = URL.createObjectURL(blob);
    const chatId = selectedConversation;
    const snapshotReply = replyingToMessage;

    // Real peaks, so both sides draw the shape of what was actually said.
    const waveform = await extractWaveform(blob);

    tempIdCounterRef.current += 1;
    const tempId = `temp-${tempIdCounterRef.current}`;

    const formData = new FormData();

    formData.append("chatId", chatId);
    formData.append("text", "");
    formData.append("messageType", "audio");
    formData.append("replyTo", snapshotReply?.id || "");
    formData.append("duration", String(duration || 0));
    formData.append("waveform", JSON.stringify(waveform));
    formData.append("files", file);

    const optimisticMessage = {
      id: tempId,
      sender: "me",
      text: "",
      time: formatTime(new Date()),
      type: "sent",
      isDelivered: false,
      isRead: false,
      deliveredAt: null,
      readAt: null,
      isPinned: false,
      pinnedAt: null,
      pinnedBy: null,
      pinnedByName: "",
      sentAt: new Date().toISOString(),
      isDeleted: false,
      isEdited: false,
      senderId: currentUserId,
      senderName: currentUserName,
      pending: true,
      replyTo: snapshotReply
        ? {
            id: snapshotReply.id,
            text: snapshotReply.text || "",
            isDeleted: snapshotReply.isDeleted || false,
            isEdited: snapshotReply.isEdited || false,
            sender: snapshotReply.sender || null,
            senderId:
              snapshotReply.senderId ||
              (snapshotReply.type === "sent" ? currentUserId : ""),
            senderName:
              snapshotReply.senderName ||
              (snapshotReply.type === "sent"
                ? currentUserName
                : selectedChat?.name || ""),
            messageType: snapshotReply.messageType || "text",
          }
        : null,
      messageType: "audio",
      files: [
        {
          url: localUrl,
          name: file.name,
          mimeType,
          size: blob.size,
          duration: duration || 0,
          waveform,
        },
      ],
    };

    setChatMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMessage],
    }));

    setConversations((prev) => {
      const currentChat = prev.find((chat) => String(chat.id) === String(chatId));

      if (!currentChat) {
        return prev;
      }

      return [
        { ...currentChat, time: optimisticMessage.time, lastMessage: "Voice message", unread: 0 },
        ...prev.filter((chat) => String(chat.id) !== String(chatId)),
      ];
    });

    setReplyingToMessage(null);
    setShowEmojiPicker(false);
    scrollToBottom();

    try {
      const response = await sendMessageAPI(formData, reqHeader);

      if (response.status === 201) {
        const savedMessage = response.data.data;

        setChatMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((chatMessage) =>
            String(chatMessage.id) === tempId
              ? {
                  ...chatMessage,
                  id: savedMessage._id,
                  time: formatTime(savedMessage.createdAt),
                  isDelivered: savedMessage.isDelivered || false,
                  isRead: savedMessage.isRead || false,
                  messageType: savedMessage.messageType || "audio",
                  files: savedMessage.files?.length
                    ? savedMessage.files
                    : chatMessage.files,
                  pending: false,
                }
              : chatMessage,
          ),
        }));
      }
    } catch (sendError) {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((chatMessage) =>
          String(chatMessage.id) === tempId
            ? { ...chatMessage, pending: false, failed: true }
            : chatMessage,
        ),
      }));

      setFailedMessageIds((prev) =>
        prev.includes(tempId) ? prev : [...prev, tempId],
      );

      toast.error(
        sendError?.response?.data?.message || "Unable to send voice message",
      );
    }
  };

  // Keeps the recorder's completion callback pointing at the freshest
  // sender without writing to a ref during render.
  useEffect(() => {
    voiceCompleteRef.current = sendVoiceMessage;
  });

  const handleToggleRecording = async () => {
    if (isRecording) {
      cancelRecording();
      return;
    }

    if (!selectedConversation || composerDisabled) {
      return;
    }

    setShowEmojiPicker(false);
    await startRecording();
  };

  const handleStartCall = (type) => {
    if (!selectedChat) {
      return;
    }

    if (selectedChat.isGroup) {
      startGroupCall({
        chatId: selectedConversation,
        name: selectedChat.name,
        type,
      });

      return;
    }

    if (isContactBlocked) {
      return;
    }

    startCall({
      userId: selectedChat.userId,
      name: selectedChat.name,
      username: selectedChat.username,
      profilePicture: selectedChat.profilePicture,
      chatId: selectedConversation,
      type,
    });
  };

  const handleEditMessage = (messageId) => {
    const messageToEdit = currentMessages.find(
      (chatMessage) => String(chatMessage.id) === String(messageId),
    );

    if (
      !messageToEdit ||
      messageToEdit.type !== "sent" ||
      messageToEdit.isDeleted
    ) {
      return;
    }

    setEditingMessageId(messageId);
    setReplyingToMessage(null);
    setMessage(messageToEdit.text || "");
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessage("");
    setShowEmojiPicker(false);
  };

  const scrollToReplyMessage = (messageId) => {
    const targetMessage = messageRefs.current[String(messageId)];

    if (!targetMessage) {
      return;
    }

    targetMessage.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedMessageId(String(messageId));

    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 1500);
  };

  const handleTogglePin = async (messageId) => {
    const token = localStorage.getItem("token");

    if (!token || !selectedConversation) {
      return;
    }

    setPinningMessageId(messageId);

    try {
      const response = await togglePinMessageAPI(messageId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        const { isPinned, pinnedAt, pinnedBy } = response.data.data;

        setChatMessages((prev) => ({
          ...prev,
          [selectedConversation]: (prev[selectedConversation] || []).map(
            (chatMessage) =>
              String(chatMessage.id) === String(messageId)
                ? {
                    ...chatMessage,
                    isPinned,
                    pinnedAt: isPinned ? pinnedAt : null,
                    pinnedBy:
                      isPinned && pinnedBy
                        ? String(pinnedBy._id || pinnedBy)
                        : null,
                    pinnedByName: isPinned ? currentUserName : "",
                  }
                : chatMessage,
          ),
        }));

        // A fresh pin becomes the one the banner shows first.
        if (isPinned) {
          setPinnedIndex(0);
        }
      }
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Failed to update pinned message",
      );
    } finally {
      setPinningMessageId(null);
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
    }
  };

  const handleOpenMessageInfo = (messageId) => {
    setMessageInfoId(messageId);
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);
  };

  const handlePinnedClick = () => {
    if (!pinnedMessage) {
      return;
    }

    scrollToReplyMessage(pinnedMessage.id);

    // Tapping the banner again moves on to the next-most-recent pin.
    if (pinnedMessages.length > 1) {
      setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
    }
  };

  const isContactBlocked = Boolean(selectedChat?.userId) &&
    (authUser?.blockedUsers || []).some(
      (blockedUserId) => String(blockedUserId) === String(selectedChat.userId),
    );

  // Groups can be set to "only admins can send messages".
  const canPostInGroup =
    !selectedChat?.isGroup ||
    selectedChat.permissions?.sendMessages !== "admins" ||
    (selectedChat.admins || []).some(
      (adminId) => String(adminId) === currentUserId,
    );

  const canAddMembers =
    !selectedChat?.isGroup ||
    selectedChat.permissions?.addMembers !== "admins" ||
    (selectedChat.admins || []).some(
      (adminId) => String(adminId) === currentUserId,
    );

  // The creator is the group's super admin: they can't be removed, demoted,
  // and only they can delete the group for everyone.
  const isGroupCreator = Boolean(
    selectedChat?.isGroup &&
      selectedChat.createdBy &&
      String(selectedChat.createdBy) === currentUserId,
  );

  const composerDisabled = isContactBlocked || !canPostInGroup;

  const activeGroupCall = selectedConversation
    ? groupCallStates[String(selectedConversation)]
    : null;

  const handleJoinGroupCall = () => {
    if (!activeGroupCall || !selectedChat) {
      return;
    }

    joinGroupCall({
      callId: activeGroupCall.callId,
      chatId: selectedConversation,
      name: selectedChat.name,
      type: activeGroupCall.callType,
    });
  };

  // Every destructive action goes through here so the wording and the busy
  // state live in one place instead of a browser `confirm()` popup.
  const requestConfirm = (config) => {
    setConfirmState(config);
  };

  const closeConfirm = () => {
    if (confirmBusy) {
      return;
    }

    setConfirmState(null);
  };

  const runConfirmedAction = async () => {
    const action = confirmState?.action;

    if (typeof action !== "function") {
      setConfirmState(null);
      return;
    }

    setConfirmBusy(true);

    try {
      await action();
    } finally {
      setConfirmBusy(false);
      setConfirmState(null);
    }
  };

  const performToggleBlock = async () => {
    const token = localStorage.getItem("token");

    if (!token || !selectedChat?.userId) {
      return;
    }

    setProfileAction("block");

    try {
      const response = await toggleBlockUserAPI(selectedChat.userId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        const { blocked, user: updatedUser } = response.data;

        if (updatedUser) {
          updateUser(updatedUser);
        }

        toast.success(
          blocked
            ? `${selectedChat.name} has been blocked`
            : `${selectedChat.name} has been unblocked`,
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't update the block",
      );
    } finally {
      setProfileAction("");
    }
  };

  const handleToggleBlock = () => {
    if (!selectedChat?.userId) {
      return;
    }

    const name = selectedChat.name || selectedChat.username;

    requestConfirm({
      title: isContactBlocked ? `Unblock ${name}?` : `Block ${name}?`,
      message: isContactBlocked
        ? "You'll be able to message each other again and their profile updates will become visible."
        : "They won't be able to reach you. Messages they send while blocked never arrive, and they won't be told about it.",
      confirmLabel: isContactBlocked ? "Unblock" : "Block",
      tone: isContactBlocked ? "primary" : "danger",
      action: performToggleBlock,
    });
  };

  const performClearChat = async (chatId = selectedConversation) => {
    const token = localStorage.getItem("token");

    if (!token || !chatId) {
      return;
    }

    setProfileAction("clear");

    try {
      const response = await clearChatAPI(chatId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        setChatMessages((prev) => ({
          ...prev,
          [String(chatId)]: [],
        }));

        toast.success("Chat cleared");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't clear the chat");
    } finally {
      setProfileAction("");
    }
  };

  const confirmClearChat = (chat) => {
    if (!chat?.id) {
      return;
    }

    requestConfirm({
      title: `Clear ${chat.name || "this chat"}?`,
      message: chat.isGroup
        ? "Every message in this group is removed from your side. Everyone else keeps their own copy."
        : "Every message in this conversation is removed from your side. The other person keeps their own copy.",
      confirmLabel: "Clear chat",
      tone: "danger",
      action: () => performClearChat(chat.id),
    });
  };

  const handleClearChat = () => confirmClearChat(selectedChat);

  const handleClearAIConversation = () => {
    try {
      localStorage.removeItem(getAIStorageKey(authUser));
    } catch {
      // Ignore storage errors; the in-memory summary still resets.
    }

    setAiChatSummary(null);
    setShowAIChat(false);
    setSelectedConversation(null);
    localStorage.removeItem("activeChatId");
    setShowMobileSidebar(true);
    toast.success("AI chat cleared");
  };

  const confirmClearAIConversation = () => {
    requestConfirm({
      title: "Clear Bubbles AI chat?",
      message:
        "This removes your AI conversation from this device. Your regular chats are not affected.",
      confirmLabel: "Clear chat",
      tone: "danger",
      action: handleClearAIConversation,
    });
  };

  const performDeleteChat = async (chatId = selectedConversation) => {
    const token = localStorage.getItem("token");

    if (!token || !chatId) {
      return;
    }

    setProfileAction("delete");

    try {
      const response = await deleteChatAPI(chatId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        removeChatLocally(chatId);
        toast.success("Chat deleted");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't delete the chat");
    } finally {
      setProfileAction("");
    }
  };

  const confirmDeleteChat = (chat) => {
    if (!chat?.id) {
      return;
    }

    requestConfirm({
      title: `Delete ${chat.name || "this chat"}?`,
      message:
        "The chat leaves your list. It comes back on its own if they send you a new message.",
      confirmLabel: "Delete chat",
      tone: "danger",
      action: () => performDeleteChat(chat.id),
    });
  };

  const handleDeleteChat = () => confirmDeleteChat(selectedChat);

  // ---- Groups -----------------------------------------------------------
  const applyGroupChat = (chat) => {
    if (!chat) {
      return;
    }

    const formatted = formatConversation(chat, currentUserId, currentUserName);

    if (!formatted) {
      return;
    }

    setConversations((prev) => {
      const existing = prev.find(
        (conversation) => String(conversation.id) === String(formatted.id),
      );

      const merged = {
        ...formatted,
        unread: existing?.unread || 0,
        time: existing?.time || formatted.time,
        lastMessage: formatted.lastMessage || existing?.lastMessage || "",
        lastMessageSenderName:
          formatted.lastMessageSenderName ||
          existing?.lastMessageSenderName ||
          "",
      };

      const exists = prev.some(
        (conversation) => String(conversation.id) === String(formatted.id),
      );

      if (!exists) {
        return [merged, ...prev];
      }

      return prev.map((conversation) =>
        String(conversation.id) === String(formatted.id)
          ? merged
          : conversation,
      );
    });
  };

  const openAddToGroup = (chat) => {
    if (!chat?.userId) {
      return;
    }

    setShowProfile(false);
    setAddToGroupContact({
      userId: chat.userId,
      name: chat.name,
      username: chat.username,
      profilePicture: chat.profilePicture,
    });
    setShowAddToGroup(true);
  };

  const removeChatLocally = (chatId) => {
    setConversations((prev) =>
      prev.filter((chat) => String(chat.id) !== String(chatId)),
    );

    setChatMessages((prev) => {
      const next = { ...prev };
      delete next[String(chatId)];
      return next;
    });

    if (String(selectedConversation) === String(chatId)) {
      setSelectedConversation(null);
      setShowProfile(false);
      setPinnedIndex(0);
      setShowMobileSidebar(true);
      writeHistoryEntry("list", null, { replace: true });

      if (localStorage.getItem("activeChatId") === String(chatId)) {
        localStorage.removeItem("activeChatId");
      }
    }
  };

  const openCreateGroup = (seed = []) => {
    setCreateGroupSeed(Array.isArray(seed) ? seed : []);
    setCreateGroupKey((prev) => prev + 1);
    setShowNewChat(false);
    setShowAddToGroup(false);
    setShowCreateGroup(true);
  };

  const handleGroupCreated = async (chat) => {
    if (!chat) {
      return;
    }

    const formatted = formatConversation(chat, currentUserId, currentUserName);

    if (!formatted) {
      return;
    }

    setConversations((prev) => [
      { ...formatted, unread: 0 },
      ...prev.filter(
        (conversation) => String(conversation.id) !== String(formatted.id),
      ),
    ]);

    writeHistoryEntry("chat", formatted.id, {
      replace:
        currentHistoryView() === "new-chat" ||
        currentHistoryView() === "chat",
    });
    setSelectedConversation(formatted.id);
    localStorage.setItem("activeChatId", formatted.id);
    setShowNewChat(false);
    setShowProfile(false);
    setShowAIChat(false);
    setShowMobileSidebar(false);
    setPinnedIndex(0);

    await loadChatMessages(formatted.id);
    scrollToBottom("auto");
  };

  const performLeaveGroup = async (targetId = selectedConversation) => {
    const token = localStorage.getItem("token");

    if (!token || !targetId) {
      return;
    }

    const chatId = targetId;

    setProfileAction("leave");

    try {
      const response = await leaveGroupAPI(chatId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        removeChatLocally(chatId);
        toast.success(
          response.data?.deleted ? "Group deleted" : "You left the group",
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't leave the group",
      );
    } finally {
      setProfileAction("");
    }
  };

  const confirmLeaveGroup = (chat) => {
    if (!chat?.isGroup || !chat?.id) {
      return;
    }

    const isCreator = Boolean(
      chat.createdBy && String(chat.createdBy) === currentUserId,
    );

    if (isCreator) {
      requestConfirm({
        title: `Exit and delete "${chat.name}"?`,
        message:
          "You created this group. Leaving deletes it and every message for all members. This can't be undone.",
        confirmLabel: "Delete group",
        tone: "danger",
        action: () => performDeleteGroup(chat.id),
      });

      return;
    }

    requestConfirm({
      title: `Exit "${chat.name}"?`,
      message:
        "The group will be removed from your chats and you'll stop receiving messages. You can be added back by any member who is allowed to add people.",
      confirmLabel: "Exit group",
      tone: "danger",
      action: () => performLeaveGroup(chat.id),
    });
  };

  const handleLeaveGroup = () => confirmLeaveGroup(selectedChat);

  const performDeleteGroup = async (targetId = selectedConversation) => {
    const token = localStorage.getItem("token");

    if (!token || !targetId) {
      return;
    }

    const chatId = targetId;

    setProfileAction("delete");

    try {
      const response = await deleteGroupAPI(chatId, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        removeChatLocally(chatId);
        toast.success("Group deleted");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't delete the group",
      );
    } finally {
      setProfileAction("");
    }
  };

  const confirmDeleteGroup = (chat) => {
    if (!chat?.isGroup || !chat?.id) {
      return;
    }

    const isCreator = Boolean(
      chat.createdBy && String(chat.createdBy) === currentUserId,
    );

    if (isCreator) {
      requestConfirm({
        title: `Delete "${chat.name}" for everyone?`,
        message:
          "You're the group creator. This deletes the group and every message in it for all members. This can't be undone.",
        confirmLabel: "Delete group",
        tone: "danger",
        action: () => performDeleteGroup(chat.id),
      });

      return;
    }

    // Admins don't get to wipe a group they didn't create — deleting it from
    // their side just leaves and clears their own copy.
    requestConfirm({
      title: `Delete "${chat.name}" from your side?`,
      message:
        "You'll leave the group and it will disappear from your chats. The other members keep the group and its messages.",
      confirmLabel: "Delete for me",
      tone: "danger",
      action: () => performLeaveGroup(chat.id),
    });
  };

  const handleDeleteGroup = () => confirmDeleteGroup(selectedChat);

  const performRemoveMember = async (member) => {
    const token = localStorage.getItem("token");

    if (!token || !selectedConversation || !member) {
      return;
    }

    setProfileAction("member");

    try {
      const response = await removeGroupMemberAPI(
        selectedConversation,
        member.id,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (response.status === 200) {
        applyGroupChat(response.data.chat);
        toast.success(`${member.name} was removed`);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't remove that member",
      );
    } finally {
      setProfileAction("");
    }
  };

  const handleRemoveMember = (member) => {
    if (!member) {
      return;
    }

    if (String(member.id) === String(selectedChat?.createdBy || "")) {
      toast.error("The group creator can't be removed");
      return;
    }

    requestConfirm({
      title: `Remove ${member.name}?`,
      message: "They'll be removed from this group and can only rejoin if someone adds them back.",
      confirmLabel: "Remove",
      tone: "danger",
      action: () => performRemoveMember(member),
    });
  };

  const performToggleAdmin = async (member) => {
    const token = localStorage.getItem("token");

    if (!token || !selectedConversation || !member) {
      return;
    }

    const makeAdmin = !member.isAdmin;

    setProfileAction("member");

    try {
      const response = await setGroupAdminAPI(
        selectedConversation,
        member.id,
        { isAdmin: makeAdmin },
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (response.status === 200) {
        applyGroupChat(response.data.chat);
        toast.success(
          makeAdmin
            ? `${member.name} is now an admin`
            : `${member.name} is no longer an admin`,
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't change that role",
      );
    } finally {
      setProfileAction("");
    }
  };

  const handleToggleAdmin = (member) => {
    if (!member) {
      return;
    }

    if (String(member.id) === String(selectedChat?.createdBy || "")) {
      toast.error("The group creator is always an admin");
      return;
    }

    const makeAdmin = !member.isAdmin;

    requestConfirm({
      title: makeAdmin
        ? `Make ${member.name} an admin?`
        : `Dismiss ${member.name} as admin?`,
      message: makeAdmin
        ? "Admins can remove members, change group settings and manage roles."
        : "They'll stay in the group with member privileges only.",
      confirmLabel: makeAdmin ? "Make admin" : "Dismiss admin",
      tone: "primary",
      action: () => performToggleAdmin(member),
    });
  };

  const performUpdatePermissions = async (patch) => {
    const token = localStorage.getItem("token");

    if (!token || !selectedConversation || !selectedChat?.isGroup) {
      return;
    }

    try {
      const response = await updateGroupPermissionsAPI(
        selectedConversation,
        patch,
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (response.status === 200) {
        applyGroupChat(response.data.chat);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't update permissions",
      );
    }
  };

  const handleUpdatePermissions = (patch) => {
    if (!selectedChat?.isGroup || !patch) {
      return;
    }

    const [key] = Object.keys(patch);

    if (!key) {
      return;
    }

    const onlyAdmins = patch[key] === "admins";

    const nounLabels = {
      sendMessages: "sending messages",
      addMembers: "adding members",
      editInfo: "editing group info",
    };

    const verbLabels = {
      sendMessages: "send messages",
      addMembers: "add members",
      editInfo: "edit group info",
    };

    requestConfirm({
      title: onlyAdmins
        ? `Restrict ${nounLabels[key] || "this"} to admins?`
        : `Let every member ${verbLabels[key] || "do this"}?`,
      message: onlyAdmins
        ? "Members who aren't admins will lose this ability right away."
        : "Every member will be able to do this right away.",
      confirmLabel: "Update",
      tone: "primary",
      action: () => performUpdatePermissions(patch),
    });
  };

  const handleEditGroup = async ({ name, description, avatarFile }) => {
    const token = localStorage.getItem("token");

    if (!token || !selectedConversation || !selectedChat?.isGroup) {
      return;
    }

    if (!name) {
      toast.error("A group needs a name");
      return;
    }

    setProfileAction("edit");

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description || "");

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await updateGroupAPI(selectedConversation, formData, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 200) {
        applyGroupChat(response.data.chat);
        toast.success("Group updated");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't update the group",
      );
    } finally {
      setProfileAction("");
    }
  };

  const handleMessageMember = (member) => {
    if (!member) {
      return;
    }

    setShowProfile(false);

    handleSelectUser({
      _id: member.id,
      name: member.name,
      username: member.username,
      profilePicture: member.profilePicture,
    });
  };

  const openReportDialog = ({ userId, name, chatId, isGroup = false } = {}) => {
    if (!userId && !isGroup) {
      toast.error("Reports are available for chats");
      return;
    }

    if (isGroup && !chatId) {
      toast.error("Can't report this group right now");
      return;
    }

    setShowChatMenu(false);
    setReportTarget({ userId, name, chatId, isGroup });
    setShowReportDialog(true);
  };

  const handleSubmitReport = async ({ reason, details }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    if (!reportTarget?.isGroup && !reportTarget?.userId) {
      return;
    }

    setReportBusy(true);

    try {
      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = reportTarget.isGroup
        ? await reportChatAPI(
            reportTarget.chatId,
            {
              reason,
              details,
            },
            reqHeader,
          )
        : await reportUserAPI(
            reportTarget.userId,
            {
              reason,
              details,
              chatId: reportTarget.chatId,
            },
            reqHeader,
          );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          response.data?.message ||
            "Report submitted. Thanks for letting us know.",
        );

        setShowReportDialog(false);
        setReportTarget(null);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't submit the report",
      );
    } finally {
      setReportBusy(false);
    }
  };

  const getReplySenderName = (replyTo) => {
    if (!replyTo) {
      return "";
    }

    const senderId = String(
      replyTo.senderId || replyTo.sender?._id || replyTo.sender || "",
    );

    if (senderId && senderId === currentUserId) {
      return "You";
    }

    return replyTo.senderName || selectedChat?.name || "User";
  };

  const handleReplyMessage = (messageId) => {
    const messageToReply = currentMessages.find(
      (chatMessage) => String(chatMessage.id) === String(messageId),
    );

    if (!messageToReply || messageToReply.isDeleted) {
      return;
    }

    setReplyingToMessage(messageToReply);
    setEditingMessageId(null);
    setMessage("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleToggleEmojiPicker = () => {
    if (!showEmojiPicker && emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();

      // Never wider than the viewport (minus gutters) on small phones.
      const width = Math.max(240, Math.min(320, window.innerWidth - 16));
      const height = 420;

      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - width - 8),
      );

      const bottom = Math.max(
        8,
        Math.min(
          window.innerHeight - rect.top + 8,
          window.innerHeight - height - 8,
        ),
      );

      setEmojiPickerPos({ left, bottom, width });
    }

    setShowEmojiPicker((prev) => !prev);
  };

  const openMessageMenu = (event, messageId) => {
    event.stopPropagation();

    if (String(openMessageMenuId) === String(messageId)) {
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const selectedMessage = currentMessages.find(
      (chatMessage) => String(chatMessage.id) === String(messageId),
    );

    const menuWidth = 208;
    const menuHeight = selectedMessage?.isDeleted ? 60 : 350;
    const spacing = 8;

    const isReceivedMessage = selectedMessage?.type === "received";

    const chatAreaStart = window.innerWidth >= 640 ? 350 : 8;

    const rightPanelWidth =
      window.innerWidth >= 1024 && showProfile && !showAIChat ? 330 : 0;

    const maxLeft = window.innerWidth - rightPanelWidth - menuWidth - 8;

    let left;

    if (isReceivedMessage) {
      left = rect.right + spacing;
    } else {
      left = rect.left - menuWidth - spacing;
    }

    if (left < chatAreaStart) {
      left = chatAreaStart;
    }

    if (left > maxLeft) {
      left = maxLeft;
    }

    let top = rect.top;

    if (top + menuHeight > window.innerHeight - 8) {
      top = window.innerHeight - menuHeight - 8;
    }

    if (top < 8) {
      top = 8;
    }

    setOpenMessageMenuId(messageId);

    setMessageMenuPosition({
      top,
      left,
    });
  };

  const handleDeleteMessage = (messageId) => {
    const messageToDelete = currentMessages.find(
      (chatMessage) => String(chatMessage.id) === String(messageId),
    );

    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);

    if (!messageToDelete) {
      return;
    }

    const mine = String(messageToDelete.senderId) === String(authUser?._id);

    requestConfirm({
      title: messageToDelete.isDeleted
        ? "Remove deleted message?"
        : "Delete message?",
      message: messageToDelete.isDeleted
        ? "It disappears from your side only."
        : mine
          ? "It will be removed for both of you."
          : "It will be removed from your side only.",
      confirmLabel: "Delete",
      tone: "danger",
      action: () => performDeleteMessage(messageId),
    });
  };

  const performDeleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId);
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await deleteMessageAPI(messageId, reqHeader);

      if (response.status === 200) {
        const deleteType = response.data?.deleteType;

        if (deleteType === "forMe") {
          setChatMessages((prev) => {
            const messages = prev[selectedConversation] || [];

            const updatedMessages = messages.filter(
              (chatMessage) => String(chatMessage.id) !== String(messageId),
            );

            const lastMessage = updatedMessages[updatedMessages.length - 1];

            setConversations((prevConversations) =>
              prevConversations.map((chat) =>
                String(chat.id) === String(selectedConversation)
                  ? {
                      ...chat,
                      time: lastMessage?.time || "",
                      lastMessage: lastMessage
                        ? lastMessage.isDeleted
                          ? "This message was deleted"
                          : lastMessage.text
                        : "",
                    }
                  : chat,
              ),
            );

            return {
              ...prev,
              [selectedConversation]: updatedMessages,
            };
          });
        } else {
          setChatMessages((prev) => {
            const messages = prev[selectedConversation] || [];

            const deletedIndex = messages.findIndex(
              (chatMessage) => String(chatMessage.id) === String(messageId),
            );

            if (deletedIndex === -1) {
              return prev;
            }

            const updatedMessages = messages.map((chatMessage) =>
              String(chatMessage.id) === String(messageId)
                ? {
                    ...chatMessage,
                    text: "",
                    isDeleted: true,
                    isDelivered: false,
                    isRead: false,
                  }
                : chatMessage,
            );

            if (deletedIndex === messages.length - 1) {
              setConversations((prevConversations) =>
                prevConversations.map((chat) =>
                  String(chat.id) === String(selectedConversation)
                    ? {
                        ...chat,
                        lastMessage: "This message was deleted",
                      }
                    : chat,
                ),
              );
            }

            return {
              ...prev,
              [selectedConversation]: updatedMessages,
            };
          });
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to delete this message",
      );
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleOpenForwardAI = (message) => {
    setForwardTargetMessage({ ...message, isAI: true });
    setShowForwardModal(true);
  };

  const forwardAITextToChats = async (text, chatIds) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    const reqHeader = {
      Authorization: `Bearer ${token}`,
    };

    let forwardedCount = 0;
    let failedCount = 0;

    for (const chatId of chatIds) {
      try {
        const formData = new FormData();

        formData.append("chatId", chatId);
        formData.append("text", text);
        formData.append("messageType", "text");
        formData.append("replyTo", "");

        const response = await sendMessageAPI(formData, reqHeader);

        if (response.status === 201) {
          const savedMessage = response.data.data;
          const formattedMessage = {
            id: savedMessage._id,
            sender: "me",
            text: savedMessage.text || text,
            time: formatTime(savedMessage.createdAt),
            type: "sent",
            isDelivered: savedMessage.isDelivered || false,
            isRead: savedMessage.isRead || false,
            deliveredAt: savedMessage.deliveredAt || null,
            readAt: savedMessage.readAt || null,
            isPinned: savedMessage.isPinned || false,
            pinnedAt: savedMessage.pinnedAt || null,
            pinnedBy:
              savedMessage.pinnedBy?._id || savedMessage.pinnedBy || null,
            pinnedByName: "",
            sentAt: savedMessage.createdAt,
            isDeleted: savedMessage.isDeleted || false,
            isEdited: savedMessage.isEdited || false,
            senderId: currentUserId,
            senderName: currentUserName,
            pending: false,
            replyTo: null,
            messageType: savedMessage.messageType || "text",
            files: savedMessage.files || [],
          };

          setChatMessages((prev) => ({
            ...prev,
            [String(chatId)]: [
              ...(prev[String(chatId)] || []),
              formattedMessage,
            ],
          }));

          setConversations((prev) => {
            const existingChat = prev.find(
              (chat) => String(chat.id) === String(chatId),
            );

            if (!existingChat) {
              return prev;
            }

            return [
              {
                ...existingChat,
                time: formattedMessage.time,
                lastMessage: formattedMessage.text,
                unread: 0,
              },
              ...prev.filter((chat) => String(chat.id) !== String(chatId)),
            ];
          });

          forwardedCount += 1;
        }
      } catch {
        failedCount += 1;
      }
    }

    setShowForwardModal(false);
    setForwardTargetMessage(null);

    if (forwardedCount > 0) {
      toast.success(
        `Forwarded to ${forwardedCount} chat${
          forwardedCount === 1 ? "" : "s"
        }`,
      );
    }

    if (failedCount > 0) {
      toast.error(
        `Couldn't forward to ${failedCount} chat${
          failedCount === 1 ? "" : "s"
        }`,
      );
    }
  };

  const handleForwardMessages = async (chatIds) => {
    if (!forwardTargetMessage) {
      return;
    }

    if (forwardTargetMessage.isAI) {
      await forwardAITextToChats(forwardTargetMessage.text, chatIds);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await forwardMessageAPI(
        {
          messageId: forwardTargetMessage.id,
          chatIds,
        },
        reqHeader,
      );

      if (response.status === 201) {
        const forwardedMessages = response.data.forwardedMessages || [];

        setChatMessages((prev) => {
          const updatedMessages = {
            ...prev,
          };

          forwardedMessages.forEach((forwardedMessage) => {
            const destinationChatId = String(
              forwardedMessage.chat?._id || forwardedMessage.chat || "",
            );

            if (!destinationChatId) {
              return;
            }

            const existingMessages = updatedMessages[destinationChatId] || [];

            const alreadyExists = existingMessages.some(
              (chatMessage) =>
                String(chatMessage.id) === String(forwardedMessage._id),
            );

            if (alreadyExists) {
              return;
            }

            updatedMessages[destinationChatId] = [
              ...existingMessages,
              {
                id: forwardedMessage._id,
                sender: "me",
                text: forwardedMessage.text || "",
                time: formatTime(forwardedMessage.createdAt),
                type: "sent",
                isDelivered: forwardedMessage.isDelivered || false,
                isRead: forwardedMessage.isRead || false,
                isDeleted: forwardedMessage.isDeleted || false,
                isEdited: forwardedMessage.isEdited || false,
                isForwarded: true,
                senderId: currentUserId,
                senderName: currentUserName,
                replyTo: null,
                messageType: forwardedMessage.messageType || "text",
                files: forwardedMessage.files || [],
              },
            ];
          });

          return updatedMessages;
        });

        setConversations((prev) => {
          const destinationChatIds = [
            ...new Set(
              forwardedMessages
                .map((forwardedMessage) =>
                  String(forwardedMessage.chat?._id || forwardedMessage.chat || ""),
                )
                .filter(Boolean),
            ),
          ];

          const updatedChats = destinationChatIds
            .map((destinationChatId) => {
              const existingChat = prev.find(
                (chat) => String(chat.id) === destinationChatId,
              );

              if (!existingChat) {
                return null;
              }

              const forwardedMessage = forwardedMessages.find(
                (message) =>
                  String(message.chat?._id || message.chat || "") ===
                  destinationChatId,
              );

              return {
                ...existingChat,
                time: formatTime(forwardedMessage?.createdAt),
                lastMessage:
                  forwardedMessage?.text ||
                  (forwardedMessage?.messageType === "image"
                    ? "Photo"
                    : forwardedMessage?.messageType === "file"
                      ? "File"
                      : ""),
              };
            })
            .filter(Boolean);

          return [
            ...updatedChats,
            ...prev.filter(
              (chat) => !destinationChatIds.includes(String(chat.id)),
            ),
          ];
        });

        setShowForwardModal(false);
        setForwardTargetMessage(null);

        scrollToBottom();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to forward this message",
      );
    }
  };

  const applyHistoryEntry = (entry) => {
    const view = entry?.bubblesView || "list";
    const chatId = entry?.bubblesChatId
      ? String(entry.bubblesChatId)
      : null;

    historyIndexRef.current = Number(entry?.bubblesIndex) || 0;

    const closeTransientUi = () => {
      setShowProfile(false);
      setShowChatMenu(false);
      setOpenMessageMenuId(null);
      setMessageMenuPosition(null);
      setShowEmojiPicker(false);
      cancelRecording();
    };

    if (
      view === "chat" &&
      chatId &&
      conversations.some((chat) => String(chat.id) === chatId)
    ) {
      closeTransientUi();
      setShowNewChat(false);
      setShowAIChat(false);
      setSelectedConversation(chatId);
      setShowMobileSidebar(false);
      localStorage.setItem("activeChatId", chatId);
      loadChatMessages(chatId);
      markMessagesAsRead(chatId);
      return;
    }

    if (view === "ai") {
      closeTransientUi();
      setSelectedConversation(null);
      setShowNewChat(false);
      setShowAIChat(true);
      setShowMobileSidebar(false);
      localStorage.removeItem("activeChatId");
      return;
    }

    if (view === "new-chat") {
      closeTransientUi();
      setShowAIChat(false);
      setShowNewChat(true);
      setShowMobileSidebar(true);
      return;
    }

    // Anything else is the chat list. This is also the safe fallback when a
    // forward/back entry points at a chat that has since been deleted.
    closeTransientUi();
    setShowNewChat(false);
    setShowAIChat(false);
    setSelectedConversation(null);
    setShowMobileSidebar(true);
    setPinnedIndex(0);
    localStorage.removeItem("activeChatId");

    if (view !== "list" || entry?.bubblesView === "chat") {
      writeHistoryEntry("list", null, { replace: true });
    }
  };

  // Keep the latest render's callbacks available to the single popstate
  // listener registered below.
  useEffect(() => {
    applyHistoryEntryRef.current = applyHistoryEntry;
  });

  useEffect(() => {
    const handlePopState = (event) => {
      applyHistoryEntryRef.current(event.state);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBackToChats = () => {
    const currentView = currentHistoryView();

    // Walk the real browser history when we have our own entry behind us.
    // The fallback handles a cold load where `/` is the first entry, so the
    // arrow never sends the user out of the app (or back to login).
    if (
      currentView !== "list" &&
      historyIndexRef.current > 0
    ) {
      window.history.back();
      return;
    }

    writeHistoryEntry("list", null, { replace: true });
    applyHistoryEntry({ bubblesView: "list", bubblesIndex: 0 });
  };

  const selectedMenuMessage = currentMessages.find(
    (chatMessage) => String(chatMessage.id) === String(openMessageMenuId),
  );

  const contextChat = chatContextMenu
    ? (aiConversation &&
      String(chatContextMenu.chatId) === AI_CHAT_ID
        ? aiConversation
        : conversations.find(
            (chat) => String(chat.id) === String(chatContextMenu.chatId),
          )) || null
    : null;

  const contextChatArchived = contextChat
    ? isChatArchived(contextChat.id)
    : false;
  const contextChatPinned = contextChat
    ? pinnedChatIds.includes(String(contextChat.id))
    : false;
  const contextChatFavorite = contextChat
    ? favoriteChatIds.includes(String(contextChat.id))
    : false;
  const contextChatMuted = contextChat
    ? mutedChatIds.some(
        (mutedId) => String(mutedId) === String(contextChat.id),
      )
    : false;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Topbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className={`w-full md:w-87.5 shrink-0 brand-panel border-r border-brand-100/70 p-4 sm:p-5 flex flex-col overflow-hidden ${showMobileSidebar ? "flex" : "hidden md:flex"}`}
        >
          {!showNewChat ? (
            <>
              <div className="flex items-stretch gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                {[
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread" },
                  { id: "groups", label: "Groups" },
                ].map((tab) => {
                  const isActive = activeFilter === tab.id;
                  const count = filterCounts[tab.id];

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`flex-1 rounded-full px-1 sm:px-2 py-2 text-xs sm:text-sm transition ${
                        isActive
                          ? "brand-gradient text-white shadow-glow"
                          : "text-muted border border-brand-100 bg-white/60 hover:border-brand-200"
                      }`}
                    >
                      {tab.label}

                      {count > 0 && (
                        <span
                          className={`ml-1 text-[10px] font-semibold ${
                            isActive ? "text-white/80" : "text-brand-500"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="relative shrink-0" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowFilterMenu((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={showFilterMenu}
                    title="More filters"
                    className={`h-full flex items-center justify-center gap-1 rounded-full px-2 sm:px-3 py-2 text-xs sm:text-sm transition ${
                      isMoreFilterActive
                        ? "brand-gradient text-white shadow-glow"
                        : "text-muted border border-brand-100 bg-white/60 hover:border-brand-200"
                    }`}
                  >
                    {isMoreFilterActive ? (
                      <span className="whitespace-nowrap">
                        {activeFilter === "favorites" ? "Favorites" : "Archived"}
                      </span>
                    ) : (
                      <span className="hidden sm:inline whitespace-nowrap">
                        More
                      </span>
                    )}

                    <LuChevronDown
                      className={`text-sm transition-transform ${showFilterMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFilterMenu && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-40 mt-2 w-44 rounded-2xl brand-modal border border-brand-100 p-1.5 shadow-soft"
                    >
                      {[
                        { id: "favorites", label: "Favorites" },
                        { id: "archived", label: "Archived" },
                      ].map((item) => {
                        const isActive = activeFilter === item.id;
                        const count = filterCounts[item.id];

                        return (
                          <button
                            type="button"
                            key={item.id}
                            role="menuitem"
                            onClick={() => {
                              setActiveFilter(item.id);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                              isActive
                                ? "brand-gradient-soft text-brand-600 font-medium"
                                : "text-ink hover:bg-brand-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>

                            {count > 0 && (
                              <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {loadingChats ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <p className="text-sm text-gray-400">Loading chats...</p>
                  </div>
                ) : orderedConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-2xl mb-4">
                      💬
                    </div>

                    <h3 className="font-semibold text-gray-700">
                      No chats yet
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      Start a new conversation with someone.
                    </p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-2xl mb-4">
                      {activeFilter === "unread"
                        ? "✅"
                        : activeFilter === "groups"
                          ? "👥"
                          : activeFilter === "archived" ||
                              (activeFilter === "all" &&
                                orderedConversations.length > 0 &&
                                filterCounts.all === 0)
                            ? "🗄️"
                            : "⭐"}
                    </div>

                    <h3 className="font-semibold text-gray-700">
                      {activeFilter === "unread"
                        ? "No unread chats"
                        : activeFilter === "groups"
                          ? "No groups yet"
                          : activeFilter === "archived"
                            ? "No archived chats"
                            : activeFilter === "all" &&
                                orderedConversations.length > 0 &&
                                filterCounts.all === 0
                              ? "All chats are archived"
                              : "No favorites yet"}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      {activeFilter === "unread"
                        ? "You are all caught up."
                        : activeFilter === "groups"
                          ? "Group chats will appear here."
                          : activeFilter === "archived"
                            ? "Right-click a chat and choose Archive chat to stash it here."
                            : activeFilter === "all" &&
                                orderedConversations.length > 0 &&
                                filterCounts.all === 0
                              ? "Open Archived from the filter menu to find them."
                              : "Star a conversation to pin it here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((chat) => {
                      const isSelected = chat.isAI
                        ? showAIChat
                        : String(chat.id) === String(selectedConversation) &&
                          !showAIChat;

                      const isTyping =
                        (typingUsers[String(chat.id)] || []).length > 0 ||
                        (recordingUsers[String(chat.id)] || []).length > 0;

                      const previewText = isTyping
                        ? getTypingText(chat)
                        : chat.lastMessage
                          ? chat.isGroup && chat.lastMessageSenderName
                            ? `${chat.lastMessageSenderName}: ${chat.lastMessage}`
                            : chat.lastMessage
                          : "No messages yet";

                      const isFavorite = favoriteChatIds.includes(
                        String(chat.id),
                      );

                      const isPinned = pinnedChatIds.includes(
                        String(chat.id),
                      );

                      const isMutedChat = mutedChatIds.some(
                        (mutedId) => String(mutedId) === String(chat.id),
                      );

                      return (
                        <div
                          key={chat.id}
                          onClick={() => handleConversationClick(chat.id)}
                          onContextMenu={(event) =>
                            openChatContextMenu(event, chat)
                          }
                          className={`group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer transition ${isSelected ? "brand-gradient-soft ring-1 ring-brand-200/70" : "hover:bg-brand-50/70"}`}
                        >
                          <div className="relative shrink-0">
                            {chat.isGroup ? (
                              <GroupAvatar
                                name={chat.name}
                                src={chat.profilePicture}
                                className="w-10 h-10 sm:w-12 sm:h-12"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-brand-100">
                                <img
                                  src={
                                    chat.photoHidden
                                      ? defaultProfile
                                      : chat.profilePicture || defaultProfile
                                  }
                                  alt={chat.name}
                                  className="w-full h-full object-cover block"
                                />
                              </div>
                            )}

                            {!chat.isGroup && chat.online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white dark:border-[#141418] rounded-full"></span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isPinned && (
                                  <LuPin
                                    title="Pinned chat"
                                    className="shrink-0 text-brand-500 text-xs fill-current"
                                  />
                                )}

                                <h3 className="font-semibold text-ink truncate text-sm sm:text-base">
                                  {chat.name}
                                </h3>

                                {isMutedChat && (
                                  <LuBellOff
                                    title="Notifications muted"
                                    className="shrink-0 text-muted text-xs"
                                  />
                                )}
                              </div>

                              <span
                                className={`text-[10px] sm:text-xs shrink-0 ml-2 ${chat.unread > 0 ? "text-brand-600 font-medium" : "text-gray-400"}`}
                              >
                                {chat.time}
                              </span>
                            </div>

                            <div className="flex justify-between items-center mt-1">
                              <p
                                className={`text-xs sm:text-sm truncate ${isTyping ? "text-brand-600 font-medium" : chat.unread > 0 ? "text-gray-700 font-medium" : "text-muted"}`}
                              >
                                {previewText}
                              </p>

                              {chat.unread > 0 && (
                                <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
                                  {chat.unread}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(chat.id);
                            }}
                            title={
                              isFavorite
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition ${
                              isFavorite
                                ? "text-amber-400"
                                : "text-gray-300 hover:text-brand-500"
                            }`}
                          >
                            <LuStar
                              className={isFavorite ? "fill-current" : ""}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-3 sm:mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setShowFilterMenu(false);
                    handleOpenNewChat();
                  }}
                  className="flex-1 py-2.5 sm:py-3 rounded-full brand-gradient text-white font-medium text-sm sm:text-base"
                >
                  + New Chat
                </button>

                <button
                  type="button"
                  onClick={() => openCreateGroup()}
                  title="New group"
                  className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-brand-100 bg-white shadow-md hover:shadow-lg hover:scale-105 transition flex items-center justify-center text-brand-600"
                >
                  <LuUsers className="text-lg sm:text-xl" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenAI}
                  title="Chat with Bubbles AI"
                  className="group relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-brand-100 bg-white shadow-md hover:shadow-lg hover:scale-105 transition flex items-center justify-center"
                >
                  <img
                    src={bubbleAI}
                    alt="Bubbles AI"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                  />
                </button>
              </div>
            </>
          ) : (
            <NewChatPanel
              conversations={conversations}
              onBack={handleBackToChats}
              onSelectUser={handleSelectUser}
              onCreateGroup={() => openCreateGroup()}
            />
          )}
        </div>

        <div
          className={`flex-1 flex overflow-hidden min-w-0 ${showMobileSidebar ? "hidden md:flex" : "flex"}`}
        >
          <div
            className={`flex-1 flex flex-col h-full min-w-0 ${chatThemeClass}`}
            style={{ background: activeWallpaper.background }}
          >
            {showAIChat ? (
              <AIChat
                onBack={handleBackToChats}
                onConversationUpdate={setAiChatSummary}
                onForwardMessage={handleOpenForwardAI}
              />
            ) : selectedChat ? (
              <>
                {/* `relative z-30` keeps the header (and its overflow menu)
                    painting above the positioned message list below it. */}
                <div className="relative z-30 brand-topbar px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between border-b border-brand-100/70 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleBackToChats}
                      className="md:hidden w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
                    >
                      <LuArrowLeft className="text-xl" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProfile(!showProfile)}
                      className="flex items-center gap-2 sm:gap-3 text-left cursor-pointer min-w-0"
                    >
                      <div className="relative shrink-0">
                        {selectedChat.isGroup ? (
                          <GroupAvatar
                            name={selectedChat.name}
                            src={selectedChat.profilePicture}
                            className="w-9 h-9 sm:w-10 sm:h-10"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden">
                            <img
                              src={
                                selectedChat.photoHidden
                                  ? defaultProfile
                                  : selectedChat.profilePicture ||
                                    defaultProfile
                              }
                              alt={selectedChat.name}
                              className="w-full h-full object-cover block"
                            />
                          </div>
                        )}

                        {!selectedChat.isGroup && selectedChat.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white dark:border-[#141418] rounded-full"></span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink truncate text-sm sm:text-base">
                          {selectedChat.name}
                        </h3>

                        <p
                          className={`text-[11px] sm:text-xs truncate ${
                            currentTypingUsers.length > 0 ||
                            currentRecordingUsers.length > 0
                              ? "text-brand-600 font-medium"
                              : "text-muted"
                          }`}
                        >
                          {currentTypingUsers.length > 0 ||
                          currentRecordingUsers.length > 0
                            ? getTypingText(selectedChat)
                            : selectedChat.isGroup
                              ? `${selectedChat.memberCount || 0} members`
                              : getPresenceLabel(selectedChat)}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="text-brand-600 flex items-center gap-0.5 sm:gap-2 text-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartCall("audio")}
                      disabled={!selectedChat.isGroup && isContactBlocked}
                      title="Voice call"
                      className="flex w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LuPhone />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartCall("video")}
                      disabled={!selectedChat.isGroup && isContactBlocked}
                      title="Video call"
                      className="flex w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LuVideo />
                    </button>

                    <button
                      type="button"
                      ref={chatMenuButtonRef}
                      onClick={handleToggleChatMenu}
                      title="More options"
                      aria-haspopup="menu"
                      aria-expanded={showChatMenu}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                        showChatMenu
                          ? "bg-brand-50 dark:bg-white/10"
                          : "hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <LuEllipsis className="text-xl" />
                    </button>
                  </div>
                </div>

                {showChatSearch && (
                  <div className="shrink-0 brand-topbar border-b border-brand-100/70 px-3 sm:px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-white/70 dark:bg-white/10 border border-brand-100 rounded-full px-3 py-2">
                        <LuSearch className="text-lg text-muted shrink-0" />

                        <input
                          autoFocus
                          type="text"
                          value={chatSearchQuery}
                          onChange={(event) =>
                            setChatSearchQuery(event.target.value)
                          }
                          placeholder="Search in this chat..."
                          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
                        />

                        {chatSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setChatSearchQuery("")}
                            title="Clear search"
                            className="shrink-0 text-muted hover:text-ink transition"
                          >
                            <LuX className="text-base" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={closeChatSearch}
                        title="Close search"
                        className="shrink-0 w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
                      >
                        <LuX className="text-lg" />
                      </button>
                    </div>

                    {chatSearchQuery.trim() && (
                      <div className="mt-2 max-h-56 overflow-y-auto scrollbar-brand rounded-xl border border-brand-100 bg-white/80 dark:bg-white/5">
                        {chatSearchResults.length === 0 ? (
                          <p className="text-xs text-muted px-3 py-3">
                            No messages found.
                          </p>
                        ) : (
                          chatSearchResults.map((foundMessage) => (
                            <button
                              key={foundMessage.id}
                              type="button"
                              onClick={() =>
                                scrollToReplyMessage(foundMessage.id)
                              }
                              className="w-full text-left px-3 py-2.5 border-b border-brand-100/60 last:border-b-0 hover:bg-brand-50/70 dark:hover:bg-white/5 transition"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-brand-600 truncate">
                                  {foundMessage.type === "sent"
                                    ? "You"
                                    : selectedChat.name}
                                </span>

                                <span className="text-[10px] text-muted shrink-0">
                                  {foundMessage.time}
                                </span>
                              </span>

                              <span className="block text-xs text-ink truncate mt-0.5">
                                {foundMessage.text}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {pinnedMessage && (
                  <button
                    type="button"
                    onClick={handlePinnedClick}
                    title={
                      pinnedMessages.length > 1
                        ? "Tap to see the next pinned message"
                        : "Go to pinned message"
                    }
                    className="shrink-0 w-full flex items-center gap-3 px-3 sm:px-5 py-2.5 brand-topbar border-b border-brand-100/70 text-left"
                  >
                    <span className="text-base shrink-0">📌</span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-brand-600 truncate">
                        Pinned by {pinnedMessage.pinnedByName || "someone"}
                      </p>

                      <p className="text-xs text-muted truncate">
                        {getMessagePreview(pinnedMessage) || "Attachment"}
                      </p>
                    </div>

                    {pinnedMessages.length > 1 && (
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {(pinnedIndex % pinnedMessages.length) + 1} of{" "}
                        {pinnedMessages.length}
                      </span>
                    )}
                  </button>
                )}

                {activeGroupCall && !call && (
                  <div className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2 brand-topbar border-b border-brand-100/70">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                    </span>

                    <p className="min-w-0 flex-1 truncate text-xs text-ink">
                      <span className="font-semibold">
                        {activeGroupCall.callType === "video"
                          ? "Video call"
                          : "Voice call"}
                      </span>{" "}
                      in progress · {activeGroupCall.participantCount} joined
                    </p>

                    <button
                      type="button"
                      onClick={handleJoinGroupCall}
                      className="shrink-0 rounded-full brand-gradient px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-105"
                    >
                      Join
                    </button>
                  </div>
                )}

                <div className="relative flex-1 min-h-0 flex flex-col">
                  <div
                    ref={messagesScrollRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 scrollbar-brand"
                  >
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-gray-400">
                        Loading messages...
                      </p>
                    </div>
                  ) : (
                    <div className="min-h-full flex flex-col justify-end">
                      {currentMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-2xl mb-4">
                            💬
                          </div>

                          <h3 className="font-semibold text-gray-700">
                            No messages yet
                          </h3>

                          <p className="text-sm text-gray-400 mt-1">
                            Send a message to start the conversation.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {currentMessages.map((chatMessage) => {
                            if (chatMessage.messageType === "system") {
                              return (
                                <div
                                  key={chatMessage.id}
                                  ref={(element) => {
                                    if (element) {
                                      messageRefs.current[
                                        String(chatMessage.id)
                                      ] = element;
                                    } else {
                                      delete messageRefs.current[
                                        String(chatMessage.id)
                                      ];
                                    }
                                  }}
                                  className="flex justify-center mb-3"
                                >
                                  <p className="max-w-[85%] text-center text-[11px] text-muted bg-white/70 dark:bg-white/10 border border-brand-100/60 rounded-full px-3 py-1">
                                    {chatMessage.text}
                                  </p>
                                </div>
                              );
                            }

                            return (
                            <div
                              key={chatMessage.id}
                              ref={(element) => {
                                if (element) {
                                  messageRefs.current[String(chatMessage.id)] =
                                    element;
                                } else {
                                  delete messageRefs.current[
                                    String(chatMessage.id)
                                  ];
                                }
                              }}
                              className={`group flex mb-3 sm:mb-4 items-center gap-1.5 ${chatMessage.type === "sent" ? "justify-end" : "justify-start"}`}
                            >
                              <div className="relative max-w-[85%] sm:max-w-[60%]">
                                <div
                                  className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition ${chatMessage.type === "sent" ? "bubble-sent shadow-glow" : "bubble-recv shadow-sm backdrop-blur-sm"} ${chatMessage.pending ? "opacity-70" : ""} ${chatMessage.isDeleted ? "italic opacity-80" : ""} ${failedMessageIds.includes(String(chatMessage.id)) ? "ring-1 ring-red-400" : ""} ${String(highlightedMessageId) === String(chatMessage.id) ? "ring-2 ring-brand-400 ring-offset-2" : ""}`}
                                >
                                  {chatMessage.isDeleted ? (
                                    <p className="text-sm sm:text-base">
                                      This message was deleted
                                    </p>
                                  ) : (
                                    <>
                                      {selectedChat?.isGroup &&
                                        chatMessage.type === "received" && (
                                          <p className="mb-1 text-[11px] font-semibold text-brand-600 truncate">
                                            {chatMessage.senderName ||
                                              "Unknown member"}
                                          </p>
                                        )}

                                      {chatMessage.isForwarded && (
                                        <p
                                          className={`mb-1 text-[10px] font-medium ${chatMessage.type === "sent" ? "text-white/70" : "text-brand-500"}`}
                                        >
                                          ↪ Forwarded
                                        </p>
                                      )}

                                      {chatMessage.replyTo && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            scrollToReplyMessage(
                                              chatMessage.replyTo.id,
                                            )
                                          }
                                          className={`w-full mb-2 rounded-lg border-l-2 px-2.5 py-1.5 text-left transition ${chatMessage.type === "sent" ? "border-white/70 bg-white/10 hover:bg-white/20" : "border-brand-400 bg-white hover:bg-brand-50"}`}
                                        >
                                          <p
                                            className={`text-[10px] font-medium ${chatMessage.type === "sent" ? "text-white/80" : "text-brand-600"}`}
                                          >
                                            {getReplySenderName(
                                              chatMessage.replyTo,
                                            )}
                                          </p>
                                          <p
                                            className={`text-xs truncate ${chatMessage.type === "sent" ? "text-white/80" : "text-muted"}`}
                                          >
                                            {chatMessage.replyTo.isDeleted
                                              ? "This message was deleted"
                                              : chatMessage.replyTo.text ||
                                                "Attachment"}
                                          </p>
                                        </button>
                                      )}

                                      {chatMessage.messageType === "call" && (
                                        <div className="flex items-center gap-2.5 py-0.5">
                                          <span
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                                              chatMessage.type === "sent"
                                                ? "bg-white/15"
                                                : "bg-brand-50 dark:bg-white/10 text-brand-600"
                                            }`}
                                          >
                                            {chatMessage.callInfo?.callType ===
                                            "video" ? (
                                              <LuVideo />
                                            ) : (
                                              <LuPhone />
                                            )}
                                          </span>

                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {getCallLabel(chatMessage)}
                                            </p>

                                            {chatMessage.callInfo?.status ===
                                              "completed" && (
                                              <p
                                                className={`text-[11px] ${chatMessage.type === "sent" ? "text-white/75" : "text-muted"}`}
                                              >
                                                {formatVoiceDuration(
                                                  chatMessage.callInfo
                                                    ?.duration || 0,
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {chatMessage.files?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {chatMessage.files.map((file, index) => {
                                            if (
                                              file.mimeType?.startsWith(
                                                "audio/",
                                              )
                                            ) {
                                              return (
                                                <AudioMessage
                                                  key={`${file.url || file.name}-${index}`}
                                                  file={file}
                                                  mine={
                                                    chatMessage.type === "sent"
                                                  }
                                                  pending={chatMessage.pending}
                                                />
                                              );
                                            }

                                            return (
                                              <a
                                                key={`${file.url || file.name}-${index}`}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`block max-w-full overflow-hidden rounded-lg ${chatMessage.type === "sent" ? "bg-white/15" : "bg-white border border-gray-200"}`}
                                              >
                                                {file.mimeType?.startsWith(
                                                  "image/",
                                                ) ? (
                                                  <img
                                                    src={file.url}
                                                    alt={
                                                      file.name ||
                                                      "Shared image"
                                                    }
                                                    loading="lazy"
                                                    className="max-h-64 max-w-full rounded-lg object-contain"
                                                  />
                                                ) : file.mimeType?.startsWith(
                                                    "video/",
                                                  ) ? (
                                                  <video
                                                    src={file.url}
                                                    controls
                                                    preload="metadata"
                                                    className="max-h-80 max-w-full rounded-lg"
                                                  >
                                                    Your browser cannot play
                                                    this video.
                                                  </video>
                                                ) : (
                                                  <div className="flex min-w-0 max-w-64 items-center gap-2 px-3 py-2">
                                                    <LuPaperclip className="shrink-0 text-lg" />
                                                    <div className="min-w-0">
                                                      <p className="truncate text-xs font-medium">
                                                        {file.name ||
                                                          "Download file"}
                                                      </p>
                                                      <p className="text-[10px] opacity-70">
                                                        {typeof file.size ===
                                                        "number"
                                                          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                                          : "Open file"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                )}
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {chatMessage.text && (
                                        <p
                                          className={`text-sm sm:text-base wrap-break-word ${chatMessage.files?.length > 0 ? "mt-2" : ""}`}
                                        >
                                          <LinkifiedText
                                            text={chatMessage.text}
                                            linkClassName={
                                              chatMessage.type === "sent"
                                                ? "text-white underline decoration-white/60 underline-offset-2 break-all hover:decoration-white"
                                                : "text-brand-600 underline decoration-brand-300/60 underline-offset-2 break-all hover:text-brand-700 dark:text-brand-300"
                                            }
                                          />
                                        </p>
                                      )}
                                    </>
                                  )}

                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span
                                      className={`text-[10px] sm:text-xs ${chatMessage.type === "sent" ? "text-white/70" : "text-gray-400"}`}
                                    >
                                      {chatMessage.isEdited &&
                                        !chatMessage.isDeleted && (
                                          <span
                                            className={`text-[10px] sm:text-xs ${chatMessage.type === "sent" ? "text-white/70" : "text-gray-400"}`}
                                          >
                                            edited
                                          </span>
                                        )}{" "}
                                      {chatMessage.time}
                                    </span>

                                    {chatMessage.type === "sent" &&
                                      !chatMessage.isDeleted && (
                                        <span
                                          className={`text-[10px] sm:text-xs ${chatMessage.isRead && readReceiptsEnabled && !selectedChat?.isGroup ? "text-blue-300" : "text-white/60"}`}
                                        >
                                          {chatMessage.isRead &&
                                          readReceiptsEnabled &&
                                          !selectedChat?.isGroup
                                            ? "✓✓"
                                            : chatMessage.isDelivered
                                              ? "✓✓"
                                              : "✓"}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) =>
                                  openMessageMenu(e, chatMessage.id)
                                }
                                className="w-7 h-7 rounded-full bg-white/95 border border-gray-200 text-muted flex items-center justify-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-sm"
                                title="Message options"
                              >
                                <LuChevronDown className="text-sm" />
                              </button>
                            </div>
                            );
                          })}

                          {(currentTypingUsers.length > 0 ||
                            currentRecordingUsers.length > 0) && (
                            <div className="flex justify-start mt-1 mb-1">
                              <div className="bg-white/90 border border-brand-100/70 rounded-2xl px-4 py-2 shadow-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-gray-400">
                                    {getTypingText(selectedChat)}
                                  </span>

                                  <span className="flex gap-0.5 ml-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:150ms]"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:300ms]"></span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {openMessageMenuId && messageMenuPosition && (
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => {
                        setOpenMessageMenuId(null);
                        setMessageMenuPosition(null);
                      }}
                    />
                  )}

                  {openMessageMenuId &&
                    messageMenuPosition &&
                    currentMessages.some(
                      (chatMessage) =>
                        String(chatMessage.id) === String(openMessageMenuId),
                    ) && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          top: messageMenuPosition.top,
                          left: messageMenuPosition.left,
                        }}
                        className="fixed z-[100] w-52 rounded-xl glass-strong border border-brand-100 shadow-soft py-1 overflow-hidden text-ink"
                      >
                        {selectedMenuMessage?.isDeleted ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteMessage(openMessageMenuId)
                            }
                            disabled={
                              String(deletingMessageId) ===
                              String(openMessageMenuId)
                            }
                            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            {String(deletingMessageId) ===
                            String(openMessageMenuId)
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMessageInfo(openMessageMenuId)
                              }
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                            >
                              Message info
                            </button>

                            {selectedMenuMessage?.type === "sent" &&
                              selectedMenuMessage?.messageType !== "call" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditMessage(openMessageMenuId)
                                  }
                                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                                >
                                  Edit
                                </button>
                              )}

                            {selectedMenuMessage?.messageType !== "call" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleReplyMessage(openMessageMenuId)
                                }
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                              >
                                Reply
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                handleCopyMessage(selectedMenuMessage);
                                setOpenMessageMenuId(null);
                                setMessageMenuPosition(null);
                              }}
                              disabled={!selectedMenuMessage?.text}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 disabled:opacity-50"
                            >
                              Copy
                            </button>

                            {selectedMenuMessage?.messageType !== "call" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setForwardTargetMessage(selectedMenuMessage);
                                  setShowForwardModal(true);
                                  setOpenMessageMenuId(null);
                                  setMessageMenuPosition(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                              >
                                Forward
                              </button>
                            )}

                            {selectedMenuMessage?.messageType !== "call" &&
                              (selectedMenuMessage?.isPinned &&
                              selectedMenuMessage?.pinnedBy &&
                              String(selectedMenuMessage?.pinnedBy) !==
                                currentUserId ? (
                                <div className="w-full px-4 py-2.5 text-left text-sm text-muted">
                                  Pinned by{" "}
                                  {selectedMenuMessage?.pinnedByName ||
                                    "someone"}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTogglePin(openMessageMenuId)
                                  }
                                  disabled={
                                    String(pinningMessageId) ===
                                    String(openMessageMenuId)
                                  }
                                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 disabled:opacity-50"
                                >
                                  {selectedMenuMessage?.isPinned
                                    ? "Unpin"
                                    : "Pin"}
                                </button>
                              ))}

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMessage(openMessageMenuId)
                              }
                              disabled={
                                String(deletingMessageId) ===
                                String(openMessageMenuId)
                              }
                              className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              {String(deletingMessageId) ===
                              String(openMessageMenuId)
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {showScrollToBottom && (
                    <button
                      type="button"
                      onClick={() => scrollToBottom()}
                      title="Jump to latest messages"
                      className="absolute bottom-4 right-4 z-30 w-10 h-10 rounded-full glass-strong border border-brand-100 shadow-soft text-brand-600 flex items-center justify-center hover:scale-105 transition"
                    >
                      <LuChevronDown className="text-xl" />
                    </button>
                  )}
                </div>

                {isContactBlocked && (
                  <div className="shrink-0 px-4 pb-2 text-center">
                    <p className="text-xs text-red-500">
                      You blocked this contact. Unblock them from their profile
                      to send messages.
                    </p>
                  </div>
                )}

                {!canPostInGroup && (
                  <div className="shrink-0 px-4 pb-2 text-center">
                    <p className="text-xs text-muted">
                      Only admins can send messages in this group.
                    </p>
                  </div>
                )}

                <div className="px-2 sm:px-4 md:px-6 lg:px-10 pb-3 pt-1 shrink-0">
                    {replyingToMessage && !editingMessageId && (
                      <div className="flex items-center justify-between mb-2 px-2">
                        <div className="min-w-0 border-l-2 border-brand-500 pl-2">
                          <p className="text-xs text-brand-600 font-medium">
                            {getReplySenderName(replyingToMessage)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {replyingToMessage.isDeleted
                              ? "This message was deleted"
                              : replyingToMessage.text || "Attachment"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelReply}
                          className="text-xs text-muted hover:text-gray-700 shrink-0 ml-3"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {editingMessageId && (
                      <div className="flex items-center justify-between mb-2 px-2">
                        <div className="min-w-0">
                          <p className="text-xs text-brand-600 font-medium">
                            Editing message
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {message}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-xs text-muted hover:text-gray-700 shrink-0 ml-3"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {selectedFiles.length > 0 && (
                      <div className="flex gap-3 mb-3 flex-wrap">
                        {selectedFiles.map((file, index) => {
                          const previewUrl = filePreviewUrls[index];

                          return (
                            <div key={index} className="relative">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl"
                                />
                              ) : file.type.startsWith("video/") ? (
                                <video
                                  src={previewUrl}
                                  controls
                                  preload="metadata"
                                  className="w-36 h-24 sm:w-44 sm:h-28 object-cover rounded-xl bg-black"
                                />
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                                  <LuPaperclip className="text-xl sm:text-2xl text-muted" />
                                  <span className="text-[10px] sm:text-xs text-muted mt-1 px-2 truncate max-w-full">
                                    {file.name}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFiles(
                                    selectedFiles.filter((_, i) => i !== index),
                                  )
                                }
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center"
                              >
                                <LuX className="text-sm" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isRecording ? (
                      <div className="composer-pill flex items-center gap-2 w-full rounded-full pl-2 pr-2 py-1.5 sm:py-2">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          title="Cancel recording"
                          className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-white/10 transition"
                        >
                          <LuTrash2 className="text-lg sm:text-xl" />
                        </button>

                        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />

                          <span className="shrink-0 text-sm tabular-nums text-ink">
                            {formatVoiceDuration(recordingSeconds)}
                          </span>

                          <LiveWaveform analyser={recorderAnalyser} />
                        </div>

                        <button
                          type="button"
                          onClick={stopRecording}
                          title="Send voice message"
                          className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full brand-gradient transition"
                        >
                          <LuSendHorizontal className="text-white text-lg sm:text-xl" />
                        </button>
                      </div>
                    ) : (
                    <div className="composer-pill flex items-center gap-1 sm:gap-2 w-full rounded-full pl-2 sm:pl-3 pr-2 py-1.5 sm:py-2">
                      <label
                        htmlFor="file-upload"
                        title="Attach files"
                        className="composer-icon text-lg sm:text-xl cursor-pointer p-1.5 sm:p-2 shrink-0 flex items-center"
                      >
                        <LuPaperclip />
                      </label>

                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const newFiles = Array.from(e.target.files);

                          setSelectedFiles([...selectedFiles, ...newFiles]);

                          e.target.value = "";
                        }}
                      />

                      <button
                        type="button"
                        ref={emojiButtonRef}
                        onClick={handleToggleEmojiPicker}
                        title="Emoji"
                        className="composer-icon text-lg sm:text-xl p-1.5 sm:p-2 shrink-0 flex items-center"
                      >
                        <LuSmile />
                      </button>

                      <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                          const value = e.target.value;

                          setMessage(value);
                          handleTyping(value);
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            settingsRef.current.enterToSend
                          ) {
                            e.preventDefault();

                            if (!sendingMessage) {
                              handleSendMessage();
                            }
                          }
                        }}
                        disabled={composerDisabled}
                        placeholder={
                          isContactBlocked
                            ? "You blocked this contact"
                            : !canPostInGroup
                              ? "Only admins can send messages"
                              : editingMessageId
                                ? "Edit your message..."
                                : replyingToMessage
                                  ? "Type a reply..."
                                  : "Type a message..."
                        }
                        className="flex-1 min-w-0 bg-transparent outline-none px-1 sm:px-2 py-2 text-sm sm:text-base text-ink placeholder:text-muted disabled:cursor-not-allowed"
                      />

                      {message.trim() || selectedFiles.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sendingMessage || composerDisabled}
                          title="Send"
                          className="brand-gradient rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 disabled:opacity-60 transition"
                        >
                          <LuSendHorizontal className="text-white text-lg sm:text-xl" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleToggleRecording}
                          disabled={composerDisabled}
                          title="Record a voice message"
                          className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-brand-600 hover:bg-brand-50 dark:hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LuMic className="text-lg sm:text-xl" />
                        </button>
                      )}
                    </div>
                    )}
                </div>

                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-[190]"
                      onClick={() => setShowEmojiPicker(false)}
                    />

                    <div
                      className="fixed z-[200]"
                      style={{
                        left: emojiPickerPos.left,
                        bottom: emojiPickerPos.bottom,
                      }}
                    >
                      <Suspense
                        fallback={
                          <div
                            style={{ width: emojiPickerPos.width }}
                            className="h-96 rounded-2xl brand-modal border border-brand-100 shadow-soft flex items-center justify-center text-sm text-muted"
                          >
                            Loading emojis...
                          </div>
                        }
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            const value = message + emojiData.emoji;

                            setMessage(value);
                            handleTyping(value);
                          }}
                          previewConfig={{ showPreview: false }}
                          theme={resolvedTheme}
                          skinTonesDisabled
                          width={emojiPickerPos.width}
                          height={400}
                          lazyLoadEmojis
                        />
                      </Suspense>
                    </div>
                  </>
                )}
              </>
            ) : loadingChats ? null : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-5">
                <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 text-3xl mb-5">
                  💬
                </div>

                <h2 className="text-xl font-semibold text-gray-700">
                  No conversation selected
                </h2>

                <p className="text-sm text-gray-400 mt-2">
                  Start a new chat to begin a conversation.
                </p>

                <button
                  type="button"
                  onClick={handleOpenNewChat}
                  className="mt-5 px-6 py-3 rounded-full brand-gradient text-white font-medium"
                >
                  Start a New Chat
                </button>
              </div>
            )}
          </div>

          <div
            className={`hidden lg:block transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${showProfile && !showAIChat ? "w-82.5" : "w-0"}`}
          >
            {!showAIChat && selectedChat?.isGroup && (
              <GroupPanel
                chat={selectedChat}
                messages={currentMessages}
                currentUserId={currentUserId}
                isMuted={mutedChatIds.some(
                  (mutedId) => String(mutedId) === String(selectedConversation),
                )}
                busyAction={profileAction}
                onToggleMute={() => toggleMuteChat(selectedConversation)}
                onAddMembers={() => setShowAddMembers(true)}
                onRemoveMember={handleRemoveMember}
                onToggleAdmin={handleToggleAdmin}
                onEditGroup={handleEditGroup}
                onUpdatePermissions={handleUpdatePermissions}
                onClearChat={handleClearChat}
                onReport={() =>
                  openReportDialog({
                    chatId: selectedConversation,
                    name: selectedChat.name,
                    isGroup: true,
                  })
                }
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteGroup}
                onMessageMember={handleMessageMember}
                onSearchInChat={openChatSearch}
                onClose={() => setShowProfile(false)}
              />
            )}

            {!showAIChat && selectedChat && !selectedChat.isGroup && (
              <ProfilePanel
                chat={selectedChat}
                messages={currentMessages}
                isMuted={mutedChatIds.some(
                  (mutedId) => String(mutedId) === String(selectedConversation),
                )}
                isBlocked={isContactBlocked}
                busyAction={profileAction}
                onToggleMute={() => toggleMuteChat(selectedConversation)}
                onToggleBlock={handleToggleBlock}
                onClearChat={handleClearChat}
                onDeleteChat={handleDeleteChat}
                onReport={() =>
                  openReportDialog({
                    userId: selectedChat?.userId,
                    name: selectedChat?.name,
                    chatId: selectedConversation,
                  })
                }
                onSearchInChat={openChatSearch}
                onAddToGroup={() => openAddToGroup(selectedChat)}
                onVoiceCall={() => handleStartCall("audio")}
                onVideoCall={() => handleStartCall("video")}
                onClose={() => setShowProfile(false)}
              />
            )}
          </div>

          {/* Small screens get the same panel as a slide-over sheet. */}
          {showProfile && !showAIChat && (
            <div className="lg:hidden fixed inset-0 z-[150]">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowProfile(false)}
              />

              <div className="absolute inset-y-0 right-0 w-full max-w-sm">
                {selectedChat?.isGroup ? (
                  <GroupPanel
                    chat={selectedChat}
                    messages={currentMessages}
                    currentUserId={currentUserId}
                    isMuted={mutedChatIds.some(
                      (mutedId) =>
                        String(mutedId) === String(selectedConversation),
                    )}
                    busyAction={profileAction}
                    onToggleMute={() => toggleMuteChat(selectedConversation)}
                    onAddMembers={() => setShowAddMembers(true)}
                    onRemoveMember={handleRemoveMember}
                    onToggleAdmin={handleToggleAdmin}
                    onEditGroup={handleEditGroup}
                    onUpdatePermissions={handleUpdatePermissions}
                    onClearChat={handleClearChat}
                    onReport={() =>
                      openReportDialog({
                        chatId: selectedConversation,
                        name: selectedChat.name,
                        isGroup: true,
                      })
                    }
                    onLeaveGroup={handleLeaveGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onMessageMember={handleMessageMember}
                    onSearchInChat={openChatSearch}
                    onClose={() => setShowProfile(false)}
                  />
                ) : (
                  <ProfilePanel
                    chat={selectedChat}
                    messages={currentMessages}
                    isMuted={mutedChatIds.some(
                      (mutedId) =>
                        String(mutedId) === String(selectedConversation),
                    )}
                    isBlocked={isContactBlocked}
                    busyAction={profileAction}
                    onToggleMute={() => toggleMuteChat(selectedConversation)}
                    onToggleBlock={handleToggleBlock}
                    onClearChat={handleClearChat}
                    onDeleteChat={handleDeleteChat}
                    onReport={() =>
                      openReportDialog({
                        userId: selectedChat?.userId,
                        name: selectedChat?.name,
                        chatId: selectedConversation,
                      })
                    }
                    onSearchInChat={openChatSearch}
                    onAddToGroup={() => openAddToGroup(selectedChat)}
                    onVoiceCall={() => handleStartCall("audio")}
                    onVideoCall={() => handleStartCall("video")}
                    onClose={() => setShowProfile(false)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showChatMenu && selectedChat && (
        <div
          ref={chatMenuRef}
          role="menu"
          style={{
            top: chatMenuPos.top,
            right: chatMenuPos.right,
            width: chatMenuPos.width,
          }}
          className="fixed z-[200] max-h-[70vh] overflow-y-auto scrollbar-brand rounded-2xl brand-modal border border-brand-100 shadow-soft py-1.5"
        >
          <ChatMenuAction
            icon={selectedChat.isGroup ? <LuUsers /> : <LuUserRound />}
            label={selectedChat.isGroup ? "Group info" : "User info"}
            onClick={() => {
              setShowChatMenu(false);
              setShowProfile(true);
            }}
          />

          {selectedChat.isGroup && canAddMembers && (
            <ChatMenuAction
              icon={<LuUserPlus />}
              label="Add members"
              onClick={() => {
                setShowChatMenu(false);
                setShowAddMembers(true);
              }}
            />
          )}

          {!selectedChat.isGroup && Boolean(selectedChat.userId) && (
            <ChatMenuAction
              icon={<LuUserPlus />}
              label="Add to group"
              onClick={() => {
                setShowChatMenu(false);
                openAddToGroup(selectedChat);
              }}
            />
          )}

          <ChatMenuAction
            icon={<LuSearch />}
            label="Search in chat"
            onClick={openChatSearch}
          />

          <div className="my-1 h-px bg-brand-100" />

          <ChatMenuAction
            icon={<LuStar className={isChatFavorite ? "fill-current" : ""} />}
            label={
              isChatFavorite ? "Remove from favourites" : "Add to favourites"
            }
            onClick={() => {
              setShowChatMenu(false);
              toggleFavorite(selectedConversation);
            }}
          />

          <ChatMenuAction
            icon={isChatPinned ? <LuPinOff /> : <LuPin />}
            label={isChatPinned ? "Unpin chat" : "Pin chat to top"}
            onClick={() => {
              setShowChatMenu(false);
              togglePinnedChat(selectedConversation);
            }}
          />

          <ChatMenuAction
            icon={isChatMuted ? <LuBellOff /> : <LuBell />}
            label={
              isChatMuted ? "Unmute notifications" : "Mute notifications"
            }
            onClick={() => {
              setShowChatMenu(false);
              toggleMuteChat(selectedConversation);
            }}
          />

          <div className="my-1 h-px bg-brand-100" />

          {!isGroupCreator && (
            <ChatMenuAction
              icon={<LuFlag />}
              label={selectedChat.isGroup ? "Report group" : "Report user"}
              onClick={() => {
                setShowChatMenu(false);
                openReportDialog({
                  userId: selectedChat.userId,
                  name: selectedChat.name,
                  chatId: selectedConversation,
                  isGroup: selectedChat.isGroup,
                });
              }}
            />
          )}

          {!selectedChat.isGroup && (
            <ChatMenuAction
              icon={<LuBan />}
              label={isContactBlocked ? "Unblock user" : "Block user"}
              onClick={() => {
                setShowChatMenu(false);
                handleToggleBlock();
              }}
              disabled={profileAction === "block"}
            />
          )}

          <div className="my-1 h-px bg-brand-100" />

          <ChatMenuAction
            icon={<LuEraser />}
            label="Clear chat"
            onClick={() => {
              setShowChatMenu(false);
              handleClearChat();
            }}
            disabled={profileAction === "clear"}
          />

          {selectedChat.isGroup && !isGroupCreator && (
            <ChatMenuAction
              icon={<LuLogOut />}
              label="Exit group"
              onClick={() => {
                setShowChatMenu(false);
                handleLeaveGroup();
              }}
              danger
              disabled={profileAction === "leave"}
            />
          )}

          {(!selectedChat.isGroup || isGroupCreator) && (
            <ChatMenuAction
              icon={<LuTrash2 />}
              label={
                selectedChat.isGroup
                  ? profileAction === "delete"
                    ? "Deleting..."
                    : "Delete group"
                  : "Delete chat"
              }
              onClick={() => {
                setShowChatMenu(false);

                if (selectedChat.isGroup) {
                  handleDeleteGroup();
                } else {
                  handleDeleteChat();
                }
              }}
              disabled={profileAction === "delete"}
              danger
            />
          )}
        </div>
      )}

      {chatContextMenu && contextChat && (
        <div
          ref={chatContextMenuRef}
          role="menu"
          style={{
            left: chatContextMenu.left,
            top: chatContextMenu.top,
          }}
          className="fixed z-[210] w-[232px] max-h-[calc(100dvh-16px)] overflow-y-auto scrollbar-brand rounded-2xl brand-modal border border-brand-100 shadow-soft py-1.5"
        >
          <p className="px-3.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted truncate">
            {contextChat.name}
          </p>

          <ChatMenuAction
            icon={
              contextChatArchived ? <LuArchiveRestore /> : <LuArchive />
            }
            label={
              contextChatArchived ? "Unarchive chat" : "Archive chat"
            }
            onClick={() => {
              setChatContextMenu(null);
              toggleArchivedChat(contextChat.id);
              toast.success(
                contextChatArchived
                  ? "Chat moved back to your inbox"
                  : "Chat archived",
              );
            }}
          />

          <ChatMenuAction
            icon={contextChatPinned ? <LuPinOff /> : <LuPin />}
            label={contextChatPinned ? "Unpin chat" : "Pin chat to top"}
            onClick={() => {
              setChatContextMenu(null);
              togglePinnedChat(contextChat.id);
            }}
          />

          <ChatMenuAction
            icon={
              <LuStar className={contextChatFavorite ? "fill-current" : ""} />
            }
            label={
              contextChatFavorite
                ? "Remove from favourites"
                : "Add to favourites"
            }
            onClick={() => {
              setChatContextMenu(null);
              toggleFavorite(contextChat.id);
            }}
          />

          <ChatMenuAction
            icon={contextChatMuted ? <LuBellOff /> : <LuBell />}
            label={
              contextChatMuted ? "Unmute notifications" : "Mute notifications"
            }
            onClick={() => {
              setChatContextMenu(null);
              toggleMuteChat(contextChat.id);
            }}
          />

          {!contextChat.isGroup && Boolean(contextChat.userId) && (
            <ChatMenuAction
              icon={<LuUserPlus />}
              label="Add to group"
              onClick={() => {
                setChatContextMenu(null);
                openAddToGroup(contextChat);
              }}
            />
          )}

          <div className="my-1 h-px bg-brand-100" />

          {contextChat.isAI ? (
            <ChatMenuAction
              icon={<LuEraser />}
              label="Clear AI chat"
              onClick={() => {
                setChatContextMenu(null);
                confirmClearAIConversation();
              }}
            />
          ) : (
            <>
              <ChatMenuAction
                icon={<LuEraser />}
                label="Clear chat"
                onClick={() => {
                  setChatContextMenu(null);
                  confirmClearChat(contextChat);
                }}
                disabled={profileAction === "clear"}
              />

              <ChatMenuAction
                icon={<LuTrash2 />}
                label={contextChat.isGroup ? "Delete group" : "Delete chat"}
                onClick={() => {
                  setChatContextMenu(null);

                  if (contextChat.isGroup) {
                    confirmDeleteGroup(contextChat);
                  } else {
                    confirmDeleteChat(contextChat);
                  }
                }}
                danger
              />
            </>
          )}
        </div>
      )}

      {showForwardModal && forwardTargetMessage && (
        <ForwardModal
          message={forwardTargetMessage}
          conversations={conversations}
          excludeChatId={showAIChat ? null : selectedConversation}
          onClose={() => {
            setShowForwardModal(false);
            setForwardTargetMessage(null);
          }}
          onForward={handleForwardMessages}
        />
      )}

      {showReportDialog && (
        <ReportDialog
          targetName={reportTarget?.name}
          busy={reportBusy}
          onClose={() => {
            setShowReportDialog(false);
            setReportTarget(null);
          }}
          onSubmit={handleSubmitReport}
        />
      )}

      <CreateGroupDialog
        key={createGroupKey}
        open={showCreateGroup}
        initialMembers={createGroupSeed}
        onClose={() => setShowCreateGroup(false)}
        onCreated={handleGroupCreated}
      />

      <AddMembersDialog
        open={showAddMembers && Boolean(selectedChat?.isGroup)}
        chat={selectedChat}
        onClose={() => setShowAddMembers(false)}
        onAdded={applyGroupChat}
      />

      <AddToGroupDialog
        open={showAddToGroup}
        contact={addToGroupContact}
        groups={conversations.filter((chat) => chat.isGroup)}
        currentUserId={currentUserId}
        onClose={() => {
          setShowAddToGroup(false);
          setAddToGroupContact(null);
        }}
        onAdded={() => loadMyChats({ silent: true })}
        onCreateGroup={() => {
          const contact = addToGroupContact;

          setShowAddToGroup(false);
          setAddToGroupContact(null);

          openCreateGroup(
            contact
              ? [
                  {
                    _id: contact.userId,
                    name: contact.name,
                    username: contact.username,
                    profilePicture: contact.profilePicture,
                  },
                ]
              : [],
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ""}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        busy={confirmBusy}
        onConfirm={runConfirmedAction}
        onCancel={closeConfirm}
      />

      {infoMessage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMessageInfoId(null)}
          />

          <div className="relative w-full max-w-sm brand-modal border border-brand-100 rounded-2xl shadow-soft p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Message info</h3>

              <button
                type="button"
                onClick={() => setMessageInfoId(null)}
                className="w-8 h-8 rounded-full hover:bg-brand-50 text-muted hover:text-ink transition flex items-center justify-center"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-brand-50/70 dark:bg-white/5 px-3 py-2.5">
              <p className="text-sm text-ink break-words">
                {infoMessage.isDeleted
                  ? "This message was deleted"
                  : infoMessage.text || "Attachment"}
              </p>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted">
                  {infoMessage.type === "sent" ? "Sent" : "Received"}
                </span>

                <span className="text-ink text-right">
                  {formatInfoTime(infoMessage.sentAt)}
                </span>
              </div>

              {infoMessage.type === "received" && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted">From</span>

                  <span className="text-ink text-right">
                    {infoMessage.senderName || "Unknown"}
                  </span>
                </div>
              )}

              {infoMessage.type === "sent" && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted">Delivered</span>

                  <span className="text-ink text-right">
                    {infoMessage.isDelivered
                      ? infoMessage.deliveredAt
                        ? formatInfoTime(infoMessage.deliveredAt)
                        : "Delivered"
                      : "Not delivered yet"}
                  </span>
                </div>
              )}

              {infoMessage.type === "sent" && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted">Read</span>

                  <span className="text-ink text-right">
                    {!readReceiptsEnabled
                      ? "Read receipts turned off"
                      : infoMessage.isRead
                        ? infoMessage.readAt
                          ? formatInfoTime(infoMessage.readAt)
                          : "Read"
                        : "Not read yet"}
                  </span>
                </div>
              )}

              {infoMessage.isPinned && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted">
                    Pinned by {infoMessage.pinnedByName || "someone"}
                  </span>

                  <span className="text-ink text-right">
                    {infoMessage.pinnedAt
                      ? formatInfoTime(infoMessage.pinnedAt)
                      : "Yes"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
