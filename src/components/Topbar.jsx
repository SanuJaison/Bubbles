import { useEffect, useRef, useState } from "react";
import bubbles from "../assets/bubbles.png";
import profileImage from "../assets/profileImage.png";
import {
  LuMonitor,
  LuMoon,
  LuSun,
  LuSearch,
  LuUser,
  LuSettings,
  LuLogOut,
} from "react-icons/lu";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const THEME_CYCLE = ["light", "dark", "system"];

const Topbar = () => {
  const profileMenuRef = useRef(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(
    () => window.history.state?.bubblesOverlay === "profile",
  );

  const [showSettingsModal, setShowSettingsModal] = useState(
    () => window.history.state?.bubblesOverlay === "settings",
  );

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, logout } = useAuth();

  const { theme, setTheme } = useTheme();

  const navigate = useNavigate();

  const handleCycleTheme = () => {
    const nextIndex = (THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length;

    setTheme(THEME_CYCLE[nextIndex]);
  };

  // Profile and Settings behave like real screens: each opens a history
  // entry, so the browser Back button closes them (and Forward re-opens them)
  // without leaving the chat list underneath.
  const pushOverlay = (overlay) => {
    if (window.history.state?.bubblesOverlay === overlay) {
      return;
    }

    window.history.pushState(
      {
        ...(window.history.state || {}),
        bubblesOverlay: overlay,
      },
      "",
      window.location.href,
    );
  };

  const replaceOverlay = (overlay) => {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        bubblesOverlay: overlay,
      },
      "",
      window.location.href,
    );
  };

  const closeOverlay = () => {
    if (window.history.state?.bubblesOverlay) {
      window.history.back();
      return;
    }

    setShowProfileMenu(false);
    setShowProfileModal(false);
    setShowSettingsModal(false);
  };

  const handleOpenProfile = () => {
    setShowProfileMenu(false);
    pushOverlay("profile");
    setShowProfileModal(true);
  };

  const handleOpenSettings = () => {
    setShowProfileMenu(false);
    pushOverlay("settings");
    setShowSettingsModal(true);
  };

  const handleCloseProfile = () => {
    closeOverlay();
  };

  const handleCloseSettings = () => {
    closeOverlay();
  };

  const handleSettingsBack = () => {
    replaceOverlay("profile");
    setShowSettingsModal(false);
    setShowProfileModal(true);
  };

  const handleProfileUpdated = () => {
    closeOverlay();
  };

  const openSettingsFromProfile = () => {
    pushOverlay("settings");
    setShowProfileModal(false);
    setShowSettingsModal(true);
  };

  const openProfileFromSettings = () => {
    pushOverlay("profile");
    setShowSettingsModal(false);
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!showProfileMenu) return undefined;

    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  // Browser Back/Forward should never leave an account/settings sheet
  // floating over a different screen. Home restores the chat view; this
  // listener restores whichever top-bar screen the history entry describes.
  useEffect(() => {
    const syncTopbarOverlays = (event) => {
      const overlay = event.state?.bubblesOverlay;

      setShowProfileMenu(false);
      setShowLogoutConfirm(false);
      setShowProfileModal(overlay === "profile");
      setShowSettingsModal(overlay === "settings");
    };

    window.addEventListener("popstate", syncTopbarOverlays);

    return () => {
      window.removeEventListener("popstate", syncTopbarOverlays);
    };
  }, []);

  return (
    <>
      <div className="brand-topbar border-b border-brand-100/70 w-full flex justify-between items-center gap-3 px-3 sm:px-5 py-2.5 sm:py-3 relative z-50">
        <div className="flex items-center shrink-0">
          <img
            src={bubbles}
            alt="Chat app logo"
            className="w-20 sm:w-25 h-auto"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 glass-strong border border-brand-100 shadow-sm rounded-full px-4 py-2 min-w-xs">
          <LuSearch className="text-lg text-muted shrink-0" />

          <input
            type="text"
            placeholder="Search messages or people..."
            className="outline-none w-full text-sm text-ink bg-transparent"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={handleCycleTheme}
            title={`Theme: ${theme}`}
            className="text-xl text-muted cursor-pointer hover:text-brand-600 transition"
          >
            {theme === "light" ? (
              <LuSun />
            ) : theme === "dark" ? (
              <LuMoon />
            ) : (
              <LuMonitor />
            )}
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative cursor-pointer"
            >
              <div className="w-10 h-10 min-w-10 min-h-10 aspect-square rounded-full overflow-hidden shadow-sm">
                <img
                  src={user?.profilePicture || profileImage}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover block"
                />
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-14 w-64 glass-strong border border-brand-100 rounded-2xl shadow-soft overflow-hidden">
                <div className="p-4 border-b border-brand-100">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 min-w-12 min-h-12 aspect-square rounded-full overflow-hidden">
                        <img
                          src={user?.profilePicture || profileImage}
                          alt={user?.name || "Profile"}
                          className="w-full h-full object-cover block"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink truncate">
                        {user?.name}
                      </h3>

                      <p className="text-sm text-muted truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-50 text-ink transition"
                  >
                    <LuUser className="text-lg shrink-0" />

                    <span className="text-sm font-medium">Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-50 text-ink transition"
                  >
                    <LuSettings className="text-lg shrink-0" />

                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-red-500 transition"
                  >
                    <LuLogOut className="text-lg shrink-0" />

                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          onClose={handleCloseProfile}
          onSettings={openSettingsFromProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={handleCloseSettings}
          onBack={handleSettingsBack}
          onEditProfile={openProfileFromSettings}
        />
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to get back to your chats."
        confirmLabel="Log out"
        tone="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Topbar;
