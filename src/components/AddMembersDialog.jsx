import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import { addGroupMembersAPI, getAllUsersAPI } from "../service/api";
import ConfirmDialog from "./ConfirmDialog";
import MemberPicker from "./MemberPicker";

const AddMembersDialog = ({ open, chat, onClose, onAdded }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const existingIds = (chat?.members || []).map((member) =>
    String(member.id),
  );

  const resetForm = () => {
    setSearch("");
    setSelected([]);
    setConfirming(false);
  };

  const handleClose = () => {
    if (adding) {
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

  const availableUsers = users.filter(
    (user) => !existingIds.includes(String(user._id)),
  );

  const toggleMember = (user) => {
    const userId = String(user._id);

    setSelected((prev) =>
      prev.some((member) => String(member._id) === userId)
        ? prev.filter((member) => String(member._id) !== userId)
        : [...prev, user],
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) {
      return;
    }

    try {
      setAdding(true);

      const token = localStorage.getItem("token");

      const response = await addGroupMembersAPI(
        chat.id,
        {
          participantIds: selected.map((member) => String(member._id)),
        },
        {
          Authorization: `Bearer ${token}`,
        },
      );

      if (response.status === 200) {
        toast.success("Members added");
        onAdded?.(response.data.chat);
        resetForm();
        onClose?.();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not add those members",
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[215] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={adding ? undefined : handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add members"
        className="relative w-full max-w-md brand-modal border border-brand-100 rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-100/70">
          <h3 className="min-w-0 flex-1 font-semibold text-ink truncate">
            Add members
          </h3>

          <button
            type="button"
            onClick={handleClose}
            disabled={adding}
            title="Close"
            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-ink flex items-center justify-center transition disabled:opacity-50"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="p-4 max-h-[65vh] overflow-y-auto scrollbar-brand">
          <MemberPicker
            users={availableUsers}
            selectedIds={selected.map((member) => String(member._id))}
            onToggle={toggleMember}
            search={search}
            onSearchChange={setSearch}
            loading={loadingUsers}
            emptyLabel="Everyone you know is already in this group."
          />
        </div>

        <div className="px-4 py-3 border-t border-brand-100/70">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={adding || selected.length === 0}
            className="w-full py-3 rounded-xl brand-gradient text-white font-medium disabled:opacity-60 transition"
          >
            {adding
              ? "Adding..."
              : `Add ${selected.length || ""} member${selected.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Add ${selected.length} member${selected.length === 1 ? "" : "s"}?`}
        message={`They'll join "${chat?.name || "this group"}" and be able to read every message in it.`}
        confirmLabel="Add members"
        tone="primary"
        busy={adding}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          handleAdd();
        }}
      />
    </div>
  );
};

export default AddMembersDialog;
