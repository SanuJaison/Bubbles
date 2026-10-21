import { LuSearch, LuCheck } from "react-icons/lu";
import defaultProfile from "../assets/profileImage.png";

// Shared searchable multi-select used by "New group" and "Add members".
const MemberPicker = ({
  users = [],
  selectedIds = [],
  onToggle,
  search,
  onSearchChange,
  loading = false,
  emptyLabel = "No contacts found.",
}) => {
  const query = search.trim().toLowerCase();

  const visibleUsers = users.filter((user) => {
    if (!query) {
      return true;
    }

    return (
      String(user.name || "")
        .toLowerCase()
        .includes(query) ||
      String(user.username || "")
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 bg-white/70 dark:bg-white/10 border border-brand-100 rounded-full px-3 py-2">
        <LuSearch className="text-lg text-muted shrink-0" />

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search people..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
        />
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto scrollbar-brand rounded-xl border border-brand-100/70 bg-white/60 dark:bg-white/5">
        {loading ? (
          <p className="text-xs text-muted px-3 py-4">Loading contacts...</p>
        ) : visibleUsers.length === 0 ? (
          <p className="text-xs text-muted px-3 py-4">{emptyLabel}</p>
        ) : (
          visibleUsers.map((user) => {
            const isSelected = selectedIds.includes(String(user._id));

            return (
              <button
                key={user._id}
                type="button"
                onClick={() => onToggle(user)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-brand-100/50 last:border-b-0 hover:bg-brand-50/70 dark:hover:bg-white/5 transition"
              >
                <img
                  src={user.profilePicture || defaultProfile}
                  alt={user.name || "Contact"}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink truncate">
                    {user.name || "Unknown"}
                  </span>

                  <span className="block text-[11px] text-muted truncate">
                    @{user.username || "user"}
                  </span>
                </span>

                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition ${
                    isSelected
                      ? "brand-gradient border-transparent text-white"
                      : "border-brand-200 text-transparent"
                  }`}
                >
                  <LuCheck className="text-sm" />
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MemberPicker;
