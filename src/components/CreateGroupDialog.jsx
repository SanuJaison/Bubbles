import { useEffect, useRef, useState } from "react";
import { LuCamera, LuX, LuCheck } from "react-icons/lu";
import toast from "react-hot-toast";
import { createGroupAPI, getAllUsersAPI } from "../service/api";
import MemberPicker from "./MemberPicker";
import GroupAvatar from "./GroupAvatar";

const CreateGroupDialog = ({
  open,
  onClose,
  onCreated,
  initialMembers = [],
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  // Remounted with a fresh `key` each time it opens, so a seeded member list
  // (from "Add to group") starts selected without an extra effect.
  const [selected, setSelected] = useState(() => initialMembers || []);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  const avatarInputRef = useRef(null);

  // Reset when the dialog closes rather than in an effect on `open`, so the
  // form is clean the next time it is opened without an extra render pass.
  const resetForm = () => {
    setName("");
    setDescription("");
    setAvatarFile(null);
    setAvatarPreview("");
    setSearch("");
    setSelected([]);
  };

  const handleClose = () => {
    if (creating) {
      return;
    }

    resetForm();
    onClose?.();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const token = localStorage.getItem("token");

        const response = await getAllUsersAPI({
          Authorization: `Bearer ${token}`,
        });

        if (!cancelled && response.status === 200) {
          setUsers(response.data.users || []);
        }
      } catch (error) {
        console.log("Error loading contacts:", error);
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleMember = (user) => {
    const userId = String(user._id);

    setSelected((prev) =>
      prev.some((member) => String(member._id) === userId)
        ? prev.filter((member) => String(member._id) !== userId)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Give your group a name");
      return;
    }

    if (selected.length === 0) {
      toast.error("Add at least one member");
      return;
    }

    try {
      setCreating(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("description", description.trim());
      formData.append(
        "participantIds",
        JSON.stringify(selected.map((member) => String(member._id))),
      );

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await createGroupAPI(formData, {
        Authorization: `Bearer ${token}`,
      });

      if (response.status === 201) {
        toast.success("Group created");
        onCreated?.(response.data.chat);
        resetForm();
        onClose?.();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not create the group",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={creating ? undefined : handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create group"
        className="relative w-full max-w-md brand-modal border border-brand-100 rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-100/70">
          <h3 className="min-w-0 flex-1 font-semibold text-ink truncate">
            New group
          </h3>

          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            title="Close"
            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-ink flex items-center justify-center transition disabled:opacity-50"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-brand">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              title="Add a group photo"
              className="relative"
            >
              <GroupAvatar
                name={name || "New group"}
                src={avatarPreview}
                className="w-20 h-20"
                textClassName="text-2xl"
              />

              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full brand-gradient text-white flex items-center justify-center shadow-glow">
                <LuCamera className="text-base" />
              </span>
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <p className="text-[11px] text-muted mt-3">
              Group photo is optional
            </p>
          </div>

          <label className="block mt-5">
            <span className="text-xs font-medium text-muted">Group name</span>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="e.g. Weekend plans"
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white/70 dark:bg-white/5 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-300 placeholder:text-muted"
            />
          </label>

          <label className="block mt-3">
            <span className="text-xs font-medium text-muted">
              Description (optional)
            </span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              maxLength={200}
              placeholder="What is this group about?"
              className="mt-1 w-full resize-none rounded-xl border border-brand-100 bg-white/70 dark:bg-white/5 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-300 placeholder:text-muted"
            />
          </label>

          {selected.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted mb-2">
                {selected.length} selected
              </p>

              <div className="flex flex-wrap gap-1.5">
                {selected.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleMember(member)}
                    title="Remove"
                    className="flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-white/10 pl-1 pr-2 py-1 text-xs text-ink"
                  >
                    <img
                      src={member.profilePicture}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />

                    <span className="max-w-28 truncate">{member.name}</span>

                    <LuX className="text-[10px] text-muted" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <MemberPicker
              users={users}
              selectedIds={selected.map((member) => String(member._id))}
              onToggle={toggleMember}
              search={search}
              onSearchChange={setSearch}
              loading={loadingUsers}
              emptyLabel="No contacts to add right now."
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-brand-100/70">
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl brand-gradient text-white font-medium disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            <LuCheck className="text-lg" />

            {creating
              ? "Creating..."
              : `Create group${selected.length > 0 ? ` · ${selected.length + 1} members` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupDialog;
