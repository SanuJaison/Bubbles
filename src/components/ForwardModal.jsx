import { useState } from "react";
import { LuCornerUpRight, LuCheck, LuX } from "react-icons/lu";
import defaultProfile from "../assets/profileImage.png";

const ForwardModal = ({ message, conversations, excludeChatId, onClose, onForward }) => {
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [forwarding, setForwarding] = useState(false);

  const forwardableChats = conversations.filter(
    (chat) => String(chat.id) !== String(excludeChatId),
  );

  const toggleChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId],
    );
  };

  const handleForward = async () => {
    if (selectedChatIds.length === 0) {
      return;
    }

    setForwarding(true);

    await onForward(selectedChatIds);

    setForwarding(false);
  };

  const messagePreview = message?.isDeleted
    ? "This message was deleted"
    : message?.text ||
      (message?.files?.length > 0
        ? message?.messageType === "image"
          ? "Photo"
          : message?.messageType === "audio"
            ? "Voice message"
            : "File"
        : "");

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] brand-modal rounded-3xl shadow-soft overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-100">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full brand-gradient-soft text-brand-600 flex items-center justify-center">
              <LuCornerUpRight className="text-lg" />
            </span>

            <h2 className="text-lg font-semibold text-ink">Forward message</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-brand-50 text-muted transition flex items-center justify-center"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-brand-100">
          <p className="text-xs text-muted">Forwarding</p>

          <p className="text-sm text-ink truncate mt-1">{messagePreview}</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-brand px-3 py-3">
          {forwardableChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-3">
                💬
              </div>

              <h3 className="font-medium text-ink">No conversations yet</h3>

              <p className="text-sm text-muted mt-1">
                Start a chat before forwarding messages.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {forwardableChats.map((chat) => {
                const isSelected = selectedChatIds.includes(chat.id);

                return (
                  <button
                    type="button"
                    key={chat.id}
                    onClick={() => toggleChat(chat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                      isSelected ? "bg-brand-50" : "hover:bg-brand-50/70"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-brand-100 shrink-0">
                      <img
                        src={chat.profilePicture || defaultProfile}
                        alt={chat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-ink truncate">
                        {chat.name}
                      </h3>

                      <p className="text-sm text-muted truncate">
                        @{chat.username || "user"}
                      </p>
                    </div>

                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "brand-gradient border-transparent text-white"
                          : "border-brand-200 text-transparent"
                      }`}
                    >
                      <LuCheck className="text-sm" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-brand-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={forwarding}
            className="w-1/2 py-3 rounded-xl bg-gray-100 text-ink font-medium hover:bg-gray-200 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleForward}
            disabled={forwarding || selectedChatIds.length === 0}
            className="w-1/2 py-3 rounded-xl brand-gradient text-white font-medium shadow-glow hover:opacity-90 transition disabled:opacity-50"
          >
            {forwarding
              ? "Forwarding..."
              : `Forward${selectedChatIds.length > 0 ? ` (${selectedChatIds.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
