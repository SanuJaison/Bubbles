import { useState } from "react";
import {
  LuUser,
  LuLock,
  LuBell,
  LuEye,
  LuArrowLeft,
  LuImage,
  LuLogOut,
  LuPalette,
  LuChevronRight,
  LuX,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import WallpaperPicker from "./WallpaperPicker";
import MessageThemePicker from "./MessageThemePicker";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import {
  changePasswordAPI,
  updateUserSettingsAPI,
} from "../service/api";
import toast from "react-hot-toast";

const Toggle = ({ enabled, onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition ${
        enabled ? "brand-gradient" : "bg-gray-300"
      } ${disabled ? "opacity-60 cursor-default" : ""}`}
    >
      <span
        className={`block w-5 h-5 bg-[#fff] rounded-full shadow transform transition ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

const SettingsModal = ({ onClose, onBack, onEditProfile }) => {
  const [view, setView] = useState("main");

  const [savingKey, setSavingKey] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, logout, updateUser } = useAuth();

  const navigate = useNavigate();

  const enterToSend = user?.enterToSend !== false;

  const messageNotifications = user?.messageNotifications !== false;

  const notificationSound = user?.notificationSound !== false;

  const readReceipts = user?.readReceipts !== false;

  const onlineStatus = user?.onlineStatus !== false;

  const profilePhotoVisibility = user?.profilePhotoVisibility || "everyone";

  const lastSeen = user?.lastSeenVisibility || "everyone";

  const updateSetting = async (field, value) => {
    if (!user) {
      return;
    }

    const previousUser = user;

    updateUser({ ...user, [field]: value });
    setSavingKey(field);

    if (
      field === "messageNotifications" &&
      value &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      try {
        const permission = Notification.requestPermission();

        if (permission && typeof permission.catch === "function") {
          permission.catch(() => {});
        }
      } catch (error) {
        console.log("Notification permission request failed:", error);
      }
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        updateUser(previousUser);
        toast.error("Authentication required");
        return;
      }

      const response = await updateUserSettingsAPI(
        { [field]: value },
        { Authorization: `Bearer ${token}` },
      );

      if (response.status === 200) {
        updateUser(response.data.user);
      }
    } catch (error) {
      console.log(error);

      updateUser(previousUser);

      toast.error(
        error.response?.data?.message || "Failed to update setting",
      );
    } finally {
      setSavingKey(null);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);

      const token = localStorage.getItem("token");

      const response = await changePasswordAPI(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { Authorization: `Bearer ${token}` },
      );

      if (response.status === 200) {
        toast.success("Password updated");

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setView("main");
      }
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Failed to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const viewTitle =
    view === "wallpaper"
      ? "Chat Wallpaper"
      : view === "messageTheme"
        ? "Message Theme"
        : view === "password"
          ? "Change Password"
          : "Settings";

  const handleBack = () => {
    if (view !== "main") {
      setView("main");
      return;
    }

    onBack();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] brand-modal rounded-3xl shadow-soft overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-full hover:bg-brand-50 flex items-center justify-center text-muted transition"
            >
              <LuArrowLeft className="text-lg" />
            </button>

            <h2 className="text-lg font-semibold text-ink">{viewTitle}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-brand-50 text-muted transition flex items-center justify-center"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-none max-h-[calc(90vh-70px)] px-6 py-6">
          {view === "wallpaper" ? (
            <WallpaperPicker onBack={() => setView("main")} />
          ) : view === "messageTheme" ? (
            <MessageThemePicker onBack={() => setView("main")} />
          ) : view === "password" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-ink mb-1">
                  Current password
                </label>

                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  className="w-full border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink outline-none bg-white focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm text-ink mb-1">
                  New password
                </label>

                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="At least 6 characters"
                  className="w-full border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink outline-none bg-white focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm text-ink mb-1">
                  Confirm new password
                </label>

                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Repeat new password"
                  className="w-full border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink outline-none bg-white focus:border-brand-400"
                />
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="w-full py-3 rounded-xl brand-gradient text-white font-medium shadow-glow hover:opacity-90 transition disabled:opacity-50"
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Account
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-50 text-left transition"
                  >
                    <LuUser className="text-lg text-brand-600" />

                    <span className="text-sm text-ink">Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("password")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-50 text-left transition"
                  >
                    <LuLock className="text-lg text-brand-600" />

                    <span className="text-sm text-ink">Change Password</span>
                  </button>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Appearance
                </h3>

                <div className="px-4 py-3 rounded-xl bg-brand-50/60">
                  <p className="text-sm text-ink mb-3">Theme</p>

                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  onClick={() => setView("wallpaper")}
                  className="w-full mt-2 flex items-center justify-between px-4 py-3 rounded-xl hover:bg-brand-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <LuImage className="text-lg text-brand-600" />

                    <span className="text-sm text-ink">Set Chat Wallpaper</span>
                  </div>

                  <span className="text-muted">
                    <LuChevronRight className="text-lg" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("messageTheme")}
                  className="w-full mt-2 flex items-center justify-between px-4 py-3 rounded-xl hover:bg-brand-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <LuPalette className="text-lg text-brand-600" />

                    <span className="text-sm text-ink">Message Theme</span>
                  </div>

                  <span className="text-muted">
                    <LuChevronRight className="text-lg" />
                  </span>
                </button>
              </div>

              <div className="mt-7">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Chat
                </h3>

                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50/60">
                  <div>
                    <p className="text-sm text-ink">Enter key sends message</p>

                    <p className="text-xs text-muted mt-1">
                      Press Enter to send instead of a new line
                    </p>
                  </div>

                  <Toggle
                    enabled={enterToSend}
                    disabled={savingKey === "enterToSend"}
                    onClick={() => updateSetting("enterToSend", !enterToSend)}
                  />
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Notifications
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50/60">
                    <div className="flex items-center gap-3">
                      <LuBell className="text-lg text-brand-600" />

                      <span className="text-sm text-ink">
                        Message notifications
                      </span>
                    </div>

                    <Toggle
                      enabled={messageNotifications}
                      disabled={savingKey === "messageNotifications"}
                      onClick={() =>
                        updateSetting(
                          "messageNotifications",
                          !messageNotifications,
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50/60">
                    <span className="text-sm text-ink">
                      Notification sound
                    </span>

                    <Toggle
                      enabled={notificationSound}
                      disabled={savingKey === "notificationSound"}
                      onClick={() =>
                        updateSetting("notificationSound", !notificationSound)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Privacy
                </h3>

                <div className="space-y-3">
                  <div className="px-4 py-3 rounded-xl bg-brand-50/60">
                    <div className="flex items-center gap-3 mb-2">
                      <LuEye className="text-lg text-brand-600" />

                      <span className="text-sm font-medium text-ink">
                        Profile photo visibility
                      </span>
                    </div>

                    <select
                      value={profilePhotoVisibility}
                      disabled={savingKey === "profilePhotoVisibility"}
                      onChange={(e) =>
                        updateSetting("profilePhotoVisibility", e.target.value)
                      }
                      className="w-full mt-1 border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink outline-none bg-white focus:border-brand-400"
                    >
                      <option value="everyone">Everyone</option>

                      <option value="contacts">My Contacts</option>

                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-brand-50/60">
                    <div className="flex items-center gap-3 mb-2">
                      <LuEye className="text-lg text-brand-600" />

                      <span className="text-sm font-medium text-ink">
                        Last seen
                      </span>
                    </div>

                    <select
                      value={lastSeen}
                      disabled={savingKey === "lastSeenVisibility"}
                      onChange={(e) =>
                        updateSetting("lastSeenVisibility", e.target.value)
                      }
                      className="w-full mt-1 border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink outline-none bg-white focus:border-brand-400"
                    >
                      <option value="everyone">Everyone</option>

                      <option value="contacts">My Contacts</option>

                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50/60">
                    <span className="text-sm text-ink">Online status</span>

                    <Toggle
                      enabled={onlineStatus}
                      disabled={savingKey === "onlineStatus"}
                      onClick={() =>
                        updateSetting("onlineStatus", !onlineStatus)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-50/60">
                    <div>
                      <p className="text-sm text-ink">Read receipts</p>

                      <p className="text-xs text-muted mt-1">
                        Allow others to see when messages are read
                      </p>
                    </div>

                    <Toggle
                      enabled={readReceipts}
                      disabled={savingKey === "readReceipts"}
                      onClick={() =>
                        updateSetting("readReceipts", !readReceipts)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pb-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                >
                  <LuLogOut className="text-lg" />

                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div onClick={(event) => event.stopPropagation()}>
        <ConfirmDialog
          open={showLogoutConfirm}
          title="Log out?"
          message="You'll need to sign in again to get back to your chats."
          confirmLabel="Log out"
          tone="danger"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </div>
    </div>
  );
};

export default SettingsModal;
