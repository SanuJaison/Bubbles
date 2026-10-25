import { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  LuArrowLeft,
  LuPaperclip,
  LuSmile,
  LuSendHorizontal,
  LuX,
  LuTrash2,
  LuCopy,
  LuMic,
  LuVolume2,
  LuVolumeX,
  LuChevronDown,
  LuGlobe,
  LuFileText,
  LuVideo,
} from "react-icons/lu";
import toast from "react-hot-toast";
import bubbleAI from "../assets/bubble-ai.png";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { resolveWallpaper } from "../constants/wallpapers";
import { getMessageThemeClass } from "../constants/messageThemes";
import { chatWithAIAPI, transcribeAudioAPI } from "../service/api";
import ConfirmDialog from "./ConfirmDialog";
import AudioMessage from "./AudioMessage";
import LiveWaveform from "./LiveWaveform";
import useVoiceRecorder from "../hooks/useVoiceRecorder";
import { extractWaveform, formatVoiceDuration } from "../utils/voice";
import {
  blobToDataUrl,
  extractVideoFrames,
  formatFileSize,
  makeImagePreview,
} from "../utils/aiAttachments";

// Code-split: the emoji library only loads when the picker is first opened.
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const MAX_FILES = 8;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_AUDIO_DATA_BYTES = 1.2 * 1024 * 1024;
const MAX_IMAGES = 3;

const FILE_ACCEPT =
  "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.sql,.yml,.yaml";

const formatClock = (date = new Date()) =>
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

let messageCounter = 0;

const createMessageId = () => {
  messageCounter += 1;

  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ai-${Date.now()}-${messageCounter}`;
};

const cleanAIText = (value) =>
  String(value || "")
    .replace(/【[^】]*】/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*[-*+•–—][ \t]+/gm, "")
    .replace(/^[ \t]*\d+[.)][ \t]+/gm, "")
    .replace(/\*(\S(?:[^*\n]*?\S)?)\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const cleanReplySnapshot = (replyTo) => {
  if (!replyTo || typeof replyTo !== "object") {
    return null;
  }

  return {
    ...replyTo,
    text:
      replyTo.type === "ai"
        ? cleanAIText(replyTo.text)
        : String(replyTo.text || ""),
  };
};

const createGreeting = (name) => [
  {
    id: "bubbles-ai-greeting",
    type: "ai",
    text: `Hi${name ? ` ${name}` : ""}! 👋 I'm Bubbles AI.`,
    time: "Now",
    greeting: true,
  },
  {
    id: "bubbles-ai-intro",
    type: "ai",
    text: "Ask me anything — I can help you write a message, plan a group chat, brainstorm ideas, understand an image or video, read a document, or search the web for something current.",
    time: "Now",
    greeting: true,
  },
];

const getStorageKey = (user) =>
  `bubblesAIHistory:${user?._id || user?.id || "guest"}`;

const loadMessages = (storageKey, name) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");

    if (Array.isArray(saved) && saved.length > 0) {
      const valid = saved
        .filter(
          (item) =>
            item &&
            (item.type === "user" || item.type === "ai") &&
            typeof item.text === "string",
        )
        .map((item) => ({
          ...item,
          text:
            item.type === "ai" ? cleanAIText(item.text) : String(item.text),
          sources: Array.isArray(item.sources) ? item.sources.slice(0, 5) : [],
          attachments: Array.isArray(item.attachments)
            ? item.attachments.filter(
                (attachment) =>
                  attachment && typeof attachment.name === "string",
              )
            : [],
          replyTo: cleanReplySnapshot(item.replyTo),
        }));

      if (valid.length > 0) {
        return valid.slice(-60);
      }
    }
  } catch {
    // A broken local cache should never stop the assistant from opening.
  }

  return createGreeting(name);
};

const serializeMessages = (messages) =>
  messages.slice(-60).map((message) => ({
    ...message,
    text:
      message.type === "ai" ? cleanAIText(message.text) : String(message.text),
    attachments: (message.attachments || []).map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      kind: attachment.kind,
      duration: attachment.duration,
      waveform: attachment.waveform,
      // Blob URLs die on reload; only keep self-contained data URLs.
      preview:
        typeof attachment.preview === "string" &&
        attachment.preview.startsWith("data:")
          ? attachment.preview
          : "",
      audio:
        typeof attachment.audio === "string" &&
        attachment.audio.startsWith("data:")
          ? attachment.audio
          : "",
    })),
    replyTo: cleanReplySnapshot(message.replyTo),
  }));

const getAttachmentKind = (file) => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "file";
};

const AIChat = ({ onBack, onConversationUpdate, onForwardMessage }) => {
  const { resolvedTheme, chatTheme } = useTheme();
  const { user } = useAuth();

  const storageKey = getStorageKey(user);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(() =>
    loadMessages(storageKey, user?.name),
  );
  const [isSending, setIsSending] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [emojiPickerPos, setEmojiPickerPos] = useState({
    left: 16,
    bottom: 96,
    width: 320,
  });

  const emojiButtonRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voiceCompleteRef = useRef(null);

  const {
    isRecording,
    seconds: recordingSeconds,
    error: recorderError,
    analyser: recorderAnalyser,
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
  } = useVoiceRecorder({
    onComplete: (payload) => voiceCompleteRef.current?.(payload),
  });

  const activeWallpaper = resolveWallpaper(
    user?.chatWallpaper,
    resolvedTheme === "dark",
  );

  const chatThemeClass = getMessageThemeClass(chatTheme);

  const hasConversation = messages.some((item) => !item.greeting);
  const isBusy = isSending || isPreparing || isTranscribing;

  useEffect(() => {
    const payload = JSON.stringify(serializeMessages(messages));

    try {
      localStorage.setItem(storageKey, payload);
    } catch {
      // If media previews filled the quota, keep the conversation text and
      // drop the heavier attachment data instead of losing the whole chat.
      try {
        const lightPayload = JSON.stringify(
          serializeMessages(messages).map((chatMessage) => ({
            ...chatMessage,
            attachments: chatMessage.attachments.map((attachment) => ({
              ...attachment,
              preview: "",
              audio: "",
            })),
          })),
        );

        localStorage.setItem(storageKey, lightPayload);
      } catch {
        // Storage can be blocked entirely — the chat still works this session.
      }
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  useEffect(() => {
    voiceCompleteRef.current = handleVoiceComplete;
  });

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  // Keep the chat list in sync with this local conversation. Once the user has
  // sent a real message, Home can show Bubbles AI as a normal chat row.
  useEffect(() => {
    const conversation = messages.filter(
      (item) =>
        !item.greeting &&
        !item.error &&
        typeof item.text === "string" &&
        item.text.trim(),
    );

    if (conversation.length === 0) {
      onConversationUpdate?.(null);
      return;
    }

    const last = conversation[conversation.length - 1];
    const preview = last.text.replace(/\s+/g, " ").trim();

    onConversationUpdate?.({
      hasConversation: true,
      lastMessage: last.type === "user" ? `You: ${preview}` : preview,
      time: last.time || "",
    });
  }, [messages, onConversationUpdate]);

  const buildApiMessages = (history) =>
    history
      .filter(
        (item) =>
          !item.greeting &&
          !item.error &&
          typeof item.text === "string" &&
          item.text.trim(),
      )
      .map((item) => ({
        role: item.type === "ai" ? "assistant" : "user",
        content: item.text,
      }))
      .slice(-24);

  const requestReply = async (formData) => {
    const token = localStorage.getItem("token");

    setIsSending(true);

    try {
      const response = await chatWithAIAPI(
        formData,
        token ? { Authorization: `Bearer ${token}` } : {},
      );

      const reply = cleanAIText(response.data?.reply || "");

      if (!reply) {
        throw new Error("Bubbles AI returned an empty reply.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          type: "ai",
          text: reply,
          time: formatClock(),
          sources: Array.isArray(response.data?.sources)
            ? response.data.sources.slice(0, 5)
            : [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          type: "ai",
          error: true,
          text:
            error?.response?.data?.message ||
            error?.message ||
            "Bubbles AI couldn't reply right now. Please try again.",
          time: formatClock(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const sendUserMessage = async ({ displayText, attachments = [], files = [] }) => {
    if (isSending) {
      return;
    }

    const replySnapshot = replyingTo;
    const userMessage = {
      id: createMessageId(),
      type: "user",
      text: displayText,
      time: formatClock(),
      attachments,
      replyTo: replySnapshot
        ? {
            id: replySnapshot.id,
            text: replySnapshot.text,
            type: replySnapshot.type,
          }
        : null,
    };

    const history = [...messages, userMessage];

    setMessages(history);
    setMessage("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);

    const formData = new FormData();

    formData.append("messages", JSON.stringify(buildApiMessages(history)));
    files.forEach((file) => formData.append("files", file, file.name));

    await requestReply(formData);
  };

  const handleSendMessage = async () => {
    if (isBusy) {
      return;
    }

    const text = message.trim();
    const pendingFiles = selectedFiles;

    if (!text && pendingFiles.length === 0) {
      return;
    }

    setIsPreparing(true);

    try {
      const attachments = [];
      const uploadFiles = [];
      let imageCount = 0;

      for (const item of pendingFiles) {
        const file = item.file;

        if (file.type.startsWith("image/")) {
          imageCount += 1;
          const preview = item.preview || (await makeImagePreview(file));

          attachments.push({
            kind: "image",
            name: file.name,
            type: file.type,
            size: file.size,
            preview,
          });
          uploadFiles.push(file);
          continue;
        }

        if (file.type.startsWith("video/")) {
          const frames = await extractVideoFrames(file, 3);

          if (frames.length === 0) {
            toast(
              "Couldn't sample frames from this video. Its audio will still be read if the file is under 25 MB.",
            );
          }

          attachments.push({
            kind: "video",
            name: file.name,
            type: file.type,
            size: file.size,
            preview: frames[0]?.dataUrl || item.preview || "",
          });

          if (file.size <= MAX_FILE_BYTES) {
            uploadFiles.push(file);
          } else {
            toast(
              "This video is over 25 MB, so only sampled frames will be analyzed — audio won't be transcribed.",
            );
          }

          frames.forEach((frame) => {
            uploadFiles.push(
              new File([frame.blob], frame.name, { type: "image/jpeg" }),
            );
          });
          continue;
        }

        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} is larger than 25 MB.`);
          continue;
        }

        if (file.type.startsWith("audio/")) {
          const waveform = await extractWaveform(file);

          attachments.push({
            kind: "audio",
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            waveform,
          });
          uploadFiles.push(file);
          continue;
        }

        attachments.push({
          kind: "file",
          name: file.name,
          type: file.type,
          size: file.size,
        });
        uploadFiles.push(file);
      }

      if (imageCount > MAX_IMAGES) {
        toast(
          `Only the first ${MAX_IMAGES} images can be analyzed in one message.`,
        );
      }

      if (uploadFiles.length === 0 && !text) {
        toast.error(
          "Nothing could be read from that attachment. Try a different file.",
        );
        setIsPreparing(false);
        return;
      }

      setIsPreparing(false);

      await sendUserMessage({
        displayText: text || "I've attached a file.",
        attachments,
        files: uploadFiles,
      });
    } finally {
      setIsPreparing(false);
    }
  };

  async function handleVoiceComplete({ blob, duration }) {
    if (!blob) {
      return;
    }

    setIsTranscribing(true);

    try {
      const extension = blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `voice-${Date.now()}.${extension}`, {
        type: blob.type || "audio/webm",
      });
      const formData = new FormData();

      formData.append("file", file);

      const response = await transcribeAudioAPI(
        formData,
        localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {},
      );

      const transcript = String(response.data?.text || "").trim();

      if (!transcript) {
        throw new Error("No speech was detected in that voice message.");
      }

      const [waveform, audioData] = await Promise.all([
        extractWaveform(blob),
        blob.size <= MAX_AUDIO_DATA_BYTES
          ? blobToDataUrl(blob)
          : Promise.resolve(""),
      ]);

      await sendUserMessage({
        displayText: transcript,
        attachments: [
          {
            kind: "audio",
            name: "Voice message",
            type: blob.type || "audio/webm",
            size: blob.size,
            duration,
            waveform,
            url: URL.createObjectURL(blob),
            audio: audioData,
          },
        ],
        files: [],
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Could not transcribe that voice message.",
      );
    } finally {
      setIsTranscribing(false);
    }
  }

  const handleToggleRecording = async () => {
    if (isBusy) {
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    setShowEmojiPicker(false);

    const started = await startRecording();

    if (!started) {
      toast.error(recorderError || "Microphone permission denied.");
    }
  };

  const handleFileSelect = async (event) => {
    const newFiles = Array.from(event.target.files || []);

    event.target.value = "";

    if (newFiles.length === 0) {
      return;
    }

    if (selectedFiles.length + newFiles.length > MAX_FILES) {
      toast.error(`You can attach up to ${MAX_FILES} files at once.`);
      return;
    }

    const additions = [];

    for (const file of newFiles) {
      const kind = getAttachmentKind(file);
      const limit =
        kind === "video" ? MAX_VIDEO_BYTES : kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;

      if (file.size > limit) {
        toast.error(
          `${file.name} is larger than ${kind === "video" ? "100 MB" : "25 MB"}.`,
        );
        continue;
      }

      let preview = "";

      if (kind === "image") {
        preview = await makeImagePreview(file);
      }

      additions.push({ file, kind, preview });
    }

    if (additions.length > 0) {
      setSelectedFiles((prev) => [...prev, ...additions]);
    }
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

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copied");
    } catch {
      toast.error("Couldn't copy the message");
    }
  };

  const closeMessageMenu = () => {
    setOpenMessageMenuId(null);
    setMessageMenuPosition(null);
  };

  const speakReply = (chatMessage) => {
    if (!window.speechSynthesis) {
      toast.error("Speech playback isn't supported in this browser.");
      return;
    }

    // The same speaker button doubles as a stop control while it is reading.
    if (speakingMessageId === chatMessage.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const messageId = chatMessage.id;
    const utterance = new SpeechSynthesisUtterance(cleanAIText(chatMessage.text));

    utterance.lang = navigator.language || "en-US";
    utterance.rate = 1.02;
    utterance.onend = () =>
      setSpeakingMessageId((current) =>
        current === messageId ? null : current,
      );
    utterance.onerror = () =>
      setSpeakingMessageId((current) =>
        current === messageId ? null : current,
      );

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const openMessageMenu = (event, chatMessage) => {
    event.stopPropagation();

    if (openMessageMenuId === chatMessage.id) {
      closeMessageMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    const menuHeight = 300;
    const spacing = 8;

    const left = Math.max(
      spacing,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - spacing),
    );

    let top = rect.bottom + 6;

    if (top + menuHeight > window.innerHeight - spacing) {
      top = Math.max(spacing, rect.top - menuHeight - 6);
    }

    setOpenMessageMenuId(chatMessage.id);
    setMessageMenuPosition({ top, left });
  };

  const handleReplyMessage = (chatMessage) => {
    closeMessageMenu();
    setReplyingTo(chatMessage);
  };

  const handleForwardMessage = (chatMessage) => {
    closeMessageMenu();
    onForwardMessage?.(chatMessage);
  };

  const handleDeleteMessage = (chatMessage) => {
    closeMessageMenu();
    setDeleteMessageTarget(chatMessage);
  };

  const confirmDeleteMessage = () => {
    if (!deleteMessageTarget) {
      return;
    }

    const messageId = deleteMessageTarget.id;

    setMessages((prev) =>
      prev.filter((chatMessage) => chatMessage.id !== messageId),
    );

    setDeleteMessageTarget(null);
    setReplyingTo((current) => (current?.id === messageId ? null : current));

    if (speakingMessageId === messageId) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
    }

    toast.success("Message deleted");
  };

  const showMessageInfo = (chatMessage) => {
    closeMessageMenu();
    toast(
      `${chatMessage.type === "ai" ? "Bubbles AI" : "You"} · ${
        chatMessage.time || "Now"
      }`,
      { icon: "ℹ️" },
    );
  };

  const clearAIChat = () => {
    cancelRecording();
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
    setReplyingTo(null);
    closeMessageMenu();
    setDeleteMessageTarget(null);
    setMessages(createGreeting(user?.name));
    setMessage("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setShowClearConfirm(false);
    toast.success("AI chat cleared");
  };

  const selectedMenuMessage =
    messages.find((chatMessage) => chatMessage.id === openMessageMenuId) || null;

  return (
    <div
      className={`flex flex-col h-full ${chatThemeClass}`}
      style={{ background: activeWallpaper.background }}
    >
      <div className="brand-topbar px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between gap-3 border-b border-brand-100/70 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Back to chats"
              aria-label="Back to chats"
              className="md:hidden w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-muted shrink-0 transition"
            >
              <LuArrowLeft className="text-xl" />
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={bubbleAI}
              alt="Bubbles AI"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover"
            />

            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#141418] rounded-full"></span>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-ink truncate">Bubbles AI</h3>

            <p
              className={`text-xs ${
                isBusy ? "text-brand-500" : "text-green-500"
              }`}
            >
              {isTranscribing
                ? "Transcribing voice..."
                : isPreparing
                  ? "Preparing files..."
                  : isSending
                    ? "Thinking..."
                    : "AI Assistant"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          disabled={!hasConversation || isBusy}
          title="Clear AI chat"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 transition"
        >
          <LuTrash2 />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-brand p-4 sm:p-5"
        onScroll={closeMessageMenu}
      >
        <div className="flex flex-col gap-4">
          {messages.map((chatMessage) => (
            <div
              key={chatMessage.id}
              className={`flex ${
                chatMessage.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[78%]">
                {chatMessage.type === "ai" && (
                  <img
                    src={bubbleAI}
                    alt="Bubbles AI"
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                )}

                <div
                  className={`px-4 py-3 rounded-2xl min-w-0 ${
                    chatMessage.type === "user"
                      ? "bubble-sent shadow-glow rounded-br-md"
                      : chatMessage.error
                        ? "bubble-recv border border-red-300/70 text-red-500 dark:border-red-500/40 dark:text-red-300"
                        : "bubble-recv shadow-sm backdrop-blur-sm rounded-bl-md"
                  }`}
                >
                  {chatMessage.replyTo && (
                    <div className="mb-2 rounded-lg border-l-2 border-white/70 bg-white/15 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold text-white/90">
                        {chatMessage.replyTo.type === "ai"
                          ? "Bubbles AI"
                          : "You"}
                      </p>
                      <p className="line-clamp-2 whitespace-pre-wrap break-words text-[11px] text-white/75">
                        {chatMessage.replyTo.text || "Attachment"}
                      </p>
                    </div>
                  )}

                  {chatMessage.attachments?.length > 0 && (
                    <div className="mb-2 flex flex-col gap-2">
                      {chatMessage.attachments.map((attachment, index) => {
                        if (attachment.kind === "audio") {
                          const audioUrl =
                            attachment.audio || attachment.url || "";

                          if (audioUrl) {
                            return (
                              <AudioMessage
                                key={`${attachment.name}-${index}`}
                                file={{
                                  url: audioUrl,
                                  duration: attachment.duration,
                                  waveform: attachment.waveform,
                                }}
                                mine={chatMessage.type === "user"}
                              />
                            );
                          }

                          return (
                            <div
                              key={`${attachment.name}-${index}`}
                              className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs"
                            >
                              <LuMic className="shrink-0" />
                              <span>Voice message</span>
                            </div>
                          );
                        }

                        if (
                          attachment.kind === "image" &&
                          attachment.preview
                        ) {
                          return (
                            <a
                              key={`${attachment.name}-${index}`}
                              href={attachment.preview}
                              target="_blank"
                              rel="noreferrer"
                              title={attachment.name}
                              className="block overflow-hidden rounded-xl"
                            >
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="max-h-52 w-auto max-w-full object-cover"
                              />
                            </a>
                          );
                        }

                        if (
                          attachment.kind === "video" &&
                          attachment.preview
                        ) {
                          return (
                            <div
                              key={`${attachment.name}-${index}`}
                              className="relative overflow-hidden rounded-xl"
                            >
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="max-h-52 w-auto max-w-full object-cover"
                              />

                              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                                  <LuVideo className="text-lg" />
                                </span>
                              </div>

                              <span className="absolute bottom-2 left-2 right-2 truncate rounded-lg bg-black/55 px-2 py-1 text-[11px] text-white">
                                {attachment.name}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${attachment.name}-${index}`}
                            className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs"
                          >
                            <LuFileText className="shrink-0" />

                            <span className="min-w-0 flex-1 truncate">
                              {attachment.name}
                            </span>

                            <span className="shrink-0 opacity-70">
                              {formatFileSize(attachment.size)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {chatMessage.text && (
                    <p className="text-sm leading-6 whitespace-pre-wrap break-words">
                      {chatMessage.text}
                    </p>
                  )}

                  {chatMessage.sources?.length > 0 && (
                    <div className="mt-2 border-t border-brand-100/60 pt-2 dark:border-white/10">
                      <p className="flex items-center gap-1 text-[11px] font-medium text-muted">
                        <LuGlobe />
                        Sources
                      </p>

                      <div className="mt-1 flex flex-col gap-1">
                        {chatMessage.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-1 text-[11px] text-brand-600 underline decoration-brand-300/60 underline-offset-2 hover:text-brand-700 dark:text-brand-300"
                          >
                            {source.title || source.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-xs mt-1 flex items-center gap-2 ${
                      chatMessage.type === "user"
                        ? "text-white/70"
                        : "text-muted"
                    }`}
                  >
                    {chatMessage.time}

                    {chatMessage.type === "ai" &&
                      !chatMessage.error &&
                      !chatMessage.greeting && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyMessage(chatMessage.text)}
                            title="Copy reply"
                            className="hover:text-brand-500 transition"
                          >
                            <LuCopy className="text-[11px]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => speakReply(chatMessage)}
                            title={
                              speakingMessageId === chatMessage.id
                                ? "Stop reading"
                                : "Listen to reply"
                            }
                            className={`transition ${
                              speakingMessageId === chatMessage.id
                                ? "text-brand-500 animate-pulse"
                                : "hover:text-brand-500"
                            }`}
                          >
                            {speakingMessageId === chatMessage.id ? (
                              <LuVolumeX className="text-[11px]" />
                            ) : (
                              <LuVolume2 className="text-[11px]" />
                            )}
                          </button>
                        </>
                      )}

                    {!chatMessage.greeting && (
                      <button
                        type="button"
                        onClick={(event) =>
                          openMessageMenu(event, chatMessage)
                        }
                        title="Message options"
                        aria-label="Message options"
                        className={`transition ${
                          chatMessage.type === "user"
                            ? "hover:text-white"
                            : "hover:text-brand-500"
                        }`}
                      >
                        <LuChevronDown className="text-[13px]" />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <img
                  src={bubbleAI}
                  alt="Bubbles AI"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />

                <div className="bubble-recv shadow-sm backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      style={{ animationDelay: `${dot * 140}ms` }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"
                    />
                  ))}

                  <span className="sr-only">Bubbles AI is typing</span>
                </div>
              </div>
            </div>
          )}

          {!hasConversation && !isBusy && (
            <div className="flex flex-wrap gap-2 pl-10">
              {[
                "Help me write a friendly message",
                "What happened in tech this week?",
                "Plan a group movie night",
                "Explain this photo",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className="rounded-full border border-brand-100 bg-white/60 px-3 py-1.5 text-xs text-muted hover:border-brand-200 hover:text-brand-600 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 sm:px-10 py-3 shrink-0">
        {recorderError && !isRecording && (
          <p className="mb-2 px-2 text-xs text-red-500">{recorderError}</p>
        )}

        {isTranscribing && (
          <p className="mb-2 flex items-center gap-2 px-2 text-xs text-brand-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Transcribing your voice message...
          </p>
        )}

        {replyingTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border-l-2 border-brand-500 bg-white/70 px-3 py-2 dark:bg-white/5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-600">
                Replying to{" "}
                {replyingTo.type === "ai" ? "Bubbles AI" : "You"}
              </p>
              <p className="truncate text-xs text-muted">
                {replyingTo.text || "Attachment"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              title="Cancel reply"
              className="shrink-0 text-xs text-muted hover:text-red-500"
            >
              Cancel
            </button>
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
          <div className="composer-pill w-full rounded-[28px] px-2 sm:px-3 py-1.5 sm:py-2">
            {selectedFiles.length > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">
                {selectedFiles.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="relative">
                    {item.kind === "image" && item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-brand-50 rounded-xl flex flex-col items-center justify-center px-1">
                        {item.kind === "video" ? (
                          <LuVideo className="text-2xl text-brand-500" />
                        ) : item.kind === "audio" ? (
                          <LuMic className="text-2xl text-brand-500" />
                        ) : (
                          <LuPaperclip className="text-2xl text-brand-500" />
                        )}

                        <span className="text-[10px] text-muted mt-1 px-1 truncate max-w-full">
                          {item.file.name}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-white text-xs flex items-center justify-center"
                    >
                      <LuX className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="composer-icon text-lg sm:text-xl p-1.5 sm:p-2 shrink-0 flex items-center cursor-pointer">
                <label
                  htmlFor="ai-file-upload"
                  className="cursor-pointer flex items-center"
                  title="Attach photos, videos, or files"
                >
                  <LuPaperclip />
                </label>

                <input
                  id="ai-file-upload"
                  type="file"
                  multiple
                  accept={FILE_ACCEPT}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

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
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && user?.enterToSend !== false) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isRecording}
                placeholder={
                  isTranscribing ? "Transcribing voice..." : "Ask Bubbles AI..."
                }
                className="flex-1 min-w-0 bg-transparent outline-none px-1 sm:px-2 py-2 text-sm sm:text-base text-ink placeholder:text-muted"
              />

              {message.trim() || selectedFiles.length > 0 ? (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isBusy}
                  title="Send"
                  className="brand-gradient rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 shadow-glow hover:opacity-90 disabled:opacity-60 transition"
                >
                  <LuSendHorizontal className="text-white text-lg sm:text-xl" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isBusy}
                  title="Record a voice message"
                  className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-brand-600 hover:bg-brand-50 dark:hover:bg-white/10 transition disabled:opacity-50"
                >
                  <LuMic className="text-lg sm:text-xl" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {openMessageMenuId && messageMenuPosition && selectedMenuMessage && (
        <>
          <div className="fixed inset-0 z-[205]" onClick={closeMessageMenu} />

          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              top: messageMenuPosition.top,
              left: messageMenuPosition.left,
            }}
            className="fixed z-[210] w-52 max-h-[calc(100dvh-16px)] overflow-y-auto scrollbar-brand rounded-xl glass-strong border border-brand-100 shadow-soft py-1 text-ink"
          >
            <button
              type="button"
              onClick={() => showMessageInfo(selectedMenuMessage)}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
            >
              Message info
            </button>

            <button
              type="button"
              onClick={() => {
                closeMessageMenu();
                copyMessage(selectedMenuMessage.text);
              }}
              disabled={!selectedMenuMessage.text}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 disabled:opacity-50"
            >
              Copy
            </button>

            {selectedMenuMessage.type === "ai" &&
              !selectedMenuMessage.error && (
                <button
                  type="button"
                  onClick={() => {
                    closeMessageMenu();
                    speakReply(selectedMenuMessage);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                >
                  {speakingMessageId === selectedMenuMessage.id
                    ? "Stop reading"
                    : "Listen to reply"}
                </button>
              )}

            <button
              type="button"
              onClick={() => handleReplyMessage(selectedMenuMessage)}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
            >
              Reply
            </button>

            {!selectedMenuMessage.error && (
              <button
                type="button"
                onClick={() => handleForwardMessage(selectedMenuMessage)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50"
              >
                Forward
              </button>
            )}

            <div className="my-1 h-px bg-brand-100" />

            <button
              type="button"
              onClick={() => handleDeleteMessage(selectedMenuMessage)}
              className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-[190]"
            onClick={() => setShowEmojiPicker(false)}
          />

          <div
            className="fixed z-[200]"
            style={{ left: emojiPickerPos.left, bottom: emojiPickerPos.bottom }}
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
                  setMessage((prev) => prev + emojiData.emoji);
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

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear AI chat?"
        message="This removes your Bubbles AI conversation from this device. Your regular chats are not affected."
        confirmLabel="Clear chat"
        tone="danger"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={clearAIChat}
      />

      <ConfirmDialog
        open={Boolean(deleteMessageTarget)}
        title="Delete message?"
        message="This removes the message from your Bubbles AI conversation on this device."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleteMessageTarget(null)}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
};

export default AIChat;
