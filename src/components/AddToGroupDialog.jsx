import { useMemo, useState } from "react";
import {
  LuCheck,
  LuSearch,
  LuUsers,
  LuUserPlus,
  LuX,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { addGroupMembersAPI } from "../service/api";
import ConfirmDialog from "./ConfirmDialog";
import GroupAvatar from "./GroupAvatar";

// Opens from a one-to-one chat: drop that person straight into a group, or
// spin up a new group that already contains them.
const AddToGroupDialog = ({
  open,
  contact,
  groups = [],
  currentUserId,
  onClose,
  onAdded,
  onCreateGroup,
}) => {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState(null);

  const query = search.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!query) {
      return groups;
    }

    return groups.filter((group) =>
      String(group.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [groups, query]);

  if (!open || !contact) {
    return null;
  }

  const contactId = String(contact.userId || contact._id || "");

  const isMember = (group) =>
    (group.members || []).some(
      (member) => String(member.id) === contactId,
    );

  const canAddTo = (group) =>
    !group.permissions ||
    group.permissions.addMembers !== "admins" ||
    (group.admins || []).some(
      (adminId) => String(adminId) === String(currentUserId),
    );

  const handleClose = () => {
    if (busyId) {
      return;
    }

    setSearch("");
    setPending(null);
    onClose?.();
  };

  const askAdd = (group) => {
    setPending({
      title: `Add ${contact.name} to "${group.name}"?`,
      message:
        "They'll join the group and be able to read every message in it.",
      confirmLabel: "Add to group",
      run: () => handleAdd(group),
    });
  };

  const askCreateGroup = () => {
    setPending({
      title: `Create a new group with ${contact.name}?`,
      message: "You'll choose a name, photo and any other members next.",
      confirmLabel: "Continue",
      run: () => onCreateGroup?.(),
    });
  };

  const handleAdd = async (group) => {
    if (isMember(group) || !canAddTo(group) || busyId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setBusyId(String(group.id));

    try {
      await addGroupMembersAPI(
        group.id,
        { participantIds: [contactId] },
        { Authorization: `Bearer ${token}` },
      );

      toast.success(`${contact.name} was added to ${group.name}`);
      onAdded?.();
      setSearch("");
      onClose?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't add them to that group",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[215] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${contact.name} to a group`}
        className="relative w-full max-w-md brand-modal border border-brand-100 rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-100/70">
          <h3 className="min-w-0 flex-1 font-semibold text-ink truncate">
            Add {contact.name} to a group
          </h3>

          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(busyId)}
            title="Close"
            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-ink flex items-center justify-center transition disabled:opacity-50"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 bg-white/70 dark:bg-white/10 border border-brand-100 rounded-full px-3 py-2">
            <LuSearch className="text-lg text-muted shrink-0" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your groups..."
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
            />
          </div>

          {onCreateGroup && (
            <button
              type="button"
              onClick={askCreateGroup}
              disabled={Boolean(busyId)}
              className="w-full flex items-center gap-3 p-3 mt-3 rounded-xl bg-brand-50/70 dark:bg-white/5 border border-brand-100 text-left hover:bg-brand-50 transition disabled:opacity-50"
            >
              <span className="w-10 h-10 rounded-full brand-gradient text-white flex items-center justify-center shrink-0">
                <LuUserPlus className="text-lg" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink truncate">
                  New group with {contact.name}
                </span>

                <span className="block text-xs text-muted truncate">
                  Pick more people and create it
                </span>
              </span>
            </button>
          )}

          <div className="mt-3 max-h-72 overflow-y-auto scrollbar-brand rounded-xl border border-brand-100/70 bg-white/60 dark:bg-white/5">
            {visibleGroups.length === 0 ? (
              <p className="text-xs text-muted px-3 py-4">
                {groups.length === 0
                  ? "You're not in any groups yet."
                  : "No groups match that search."}
              </p>
            ) : (
              visibleGroups.map((group) => {
                const alreadyMember = isMember(group);
                const allowed = canAddTo(group);
                const busy = String(busyId) === String(group.id);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => askAdd(group)}
                    disabled={alreadyMember || !allowed || Boolean(busyId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-brand-100/50 last:border-b-0 hover:bg-brand-50/70 dark:hover:bg-white/5 transition disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <GroupAvatar
                      name={group.name}
                      src={group.profilePicture}
                      className="w-9 h-9"
                      textClassName="text-sm"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink truncate">
                        {group.name}
                      </span>

                      <span className="block text-[11px] text-muted truncate">
                        {alreadyMember
                          ? "Already a member"
                          : allowed
                            ? `${group.memberCount || 0} members`
                            : "Only admins can add members"}
                      </span>
                    </span>

                    {busy ? (
                      <span className="text-[11px] text-brand-600 shrink-0">
                        Adding...
                      </span>
                    ) : alreadyMember ? (
                      <LuCheck className="text-brand-500 shrink-0" />
                    ) : (
                      <LuUsers className="text-muted shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title || ""}
        message={pending?.message}
        confirmLabel={pending?.confirmLabel}
        tone="primary"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const run = pending?.run;
          setPending(null);
          await run?.();
        }}
      />
    </div>
  );
};

export default AddToGroupDialog;
