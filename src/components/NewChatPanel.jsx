import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuSearch,
  LuUserRound,
  LuUsers,
} from "react-icons/lu";
import { getAllUsersAPI } from "../service/api";
import defaultProfile from "../assets/profileImage.png";

const NewChatPanel = ({
  conversations = [],
  onBack,
  onSelectUser,
  onCreateGroup,
}) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAllUsers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await getAllUsersAPI(reqHeader);

      if (response.status === 200) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  const searchValue = search.toLowerCase().trim();

  // Privacy: the panel starts empty. People only appear once the user types a
  // search, so opening "New chat" never exposes the full member list.
  const matchesSearch = (user) =>
    Boolean(searchValue) &&
    (user.name?.toLowerCase().includes(searchValue) ||
      user.username?.toLowerCase().includes(searchValue));

  // People the user already has a conversation with, taken from the sidebar.
  const existingUsers = conversations
    .map((chat) => ({
      _id: chat.userId,
      name: chat.name,
      username: chat.username,
      bio: chat.bio,
      profilePicture: chat.profilePicture,
      isOnline: chat.online,
      photoHidden: chat.photoHidden,
      presenceHidden: chat.presenceHidden,
    }))
    .filter((user) => user._id)
    .filter(
      (user, index, array) =>
        array.findIndex((item) => String(item._id) === String(user._id)) ===
        index,
    );

  const existingResults = existingUsers.filter(matchesSearch);

  const otherResults = users.filter(
    (user) =>
      matchesSearch(user) &&
      !existingUsers.some(
        (existing) => String(existing._id) === String(user._id),
      ),
  );

  const hasResults = existingResults.length > 0 || otherResults.length > 0;

  const renderUser = (user) => {
    const isPhotoHidden =
      user.photoHidden ?? user.profilePhotoVisibility === "nobody";

    const isPresenceHidden =
      user.presenceHidden ?? user.onlineStatus === false;

    return (
      <button
        type="button"
        key={user._id}
        onClick={() => onSelectUser(user)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-left transition"
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center">
            <img
              src={
                isPhotoHidden
                  ? defaultProfile
                  : user.profilePicture || defaultProfile
              }
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          {user.isOnline && !isPresenceHidden && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#141418] rounded-full"></span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-medium text-ink truncate">{user.name}</h3>

          <p className="text-sm text-muted truncate">@{user.username}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-brand-50 text-muted transition"
        >
          <LuArrowLeft className="text-lg" />
        </button>

        <div>
          <h2 className="font-semibold text-ink">New Chat</h2>

          <p className="text-xs text-muted">
            Find someone to start a conversation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 glass-strong border border-brand-100 rounded-xl px-4 py-3 mb-6 focus-within:border-brand-400 transition">
        <LuSearch className="text-muted text-lg shrink-0" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full outline-none text-sm text-ink bg-transparent"
          autoFocus
        />
      </div>

      {onCreateGroup && !searchValue && (
        <button
          type="button"
          onClick={onCreateGroup}
          className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-brand-50/70 hover:bg-brand-50 border border-brand-100 text-left transition"
        >
          <div className="w-12 h-12 rounded-full brand-gradient text-white flex items-center justify-center shrink-0">
            <LuUsers className="text-xl" />
          </div>

          <div className="min-w-0">
            <h3 className="font-medium text-ink truncate">New group</h3>

            <p className="text-sm text-muted truncate">
              Bring a few people into one chat
            </p>
          </div>
        </button>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-brand min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <p className="text-sm text-muted">Loading users...</p>
          </div>
        ) : hasResults ? (
          <div className="space-y-4">
            {existingResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Chats
                </p>

                {existingResults.map(renderUser)}
              </div>
            )}

            {searchValue && otherResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  People
                </p>

                {otherResults.map(renderUser)}
              </div>
            )}
          </div>
        ) : searchValue ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 mb-3">
              <LuSearch className="text-xl" />
            </div>

            <h3 className="font-medium text-ink">No users found</h3>

            <p className="text-sm text-muted mt-1">
              Try another name or username.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-4">
              <LuUserRound className="text-2xl" />
            </div>

            <h3 className="font-semibold text-ink">Start a new conversation</h3>

            <p className="text-sm text-muted mt-1 max-w-60">
              Search for someone by their name or username to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChatPanel;
