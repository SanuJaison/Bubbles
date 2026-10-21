import { useEffect, useRef, useState } from "react";
import {
  LuPencil,
  LuSettings,
  LuChevronRight,
  LuX,
} from "react-icons/lu";
import defaultProfile from "../assets/profileImage.png";
import { editUserProfileAPI } from "../service/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ProfileModal = ({ onClose, onSettings }) => {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("Making conversation bubbles.");
  const [phone, setPhone] = useState("");

  const [profileImage, setProfileImage] = useState(defaultProfile);
  const [savedProfileImage, setSavedProfileImage] = useState(defaultProfile);

  const [profileImageFile, setProfileImageFile] = useState(null);

  const [imageSaving, setImageSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setUsername(user.username || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setAbout(user.bio || "Making conversation bubbles.");

    if (user.profilePicture) {
      setProfileImage(user.profilePicture);
      setSavedProfileImage(user.profilePicture);
    } else {
      setProfileImage(defaultProfile);
      setSavedProfileImage(defaultProfile);
    }

    setProfileImageFile(null);
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setProfileImageFile(file);

    const imageUrl = URL.createObjectURL(file);

    setProfileImage(imageUrl);

    e.target.value = "";
  };

  const handleSaveImage = async () => {
    if (!profileImageFile) {
      return;
    }

    try {
      setImageSaving(true);

      const formData = new FormData();

      formData.append("name", name);
      formData.append("username", username);
      formData.append("bio", about);
      formData.append("phone", phone);
      formData.append("profilePicture", profileImageFile);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await editUserProfileAPI(formData, reqHeader);

      if (response.status === 200) {
        const updatedUser = response.data.user;

        updateUser(updatedUser);

        if (updatedUser.profilePicture) {
          setProfileImage(updatedUser.profilePicture);
          setSavedProfileImage(updatedUser.profilePicture);
        }

        setProfileImageFile(null);

        toast.success("Profile picture updated successfully");
      }
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message || "Failed to update profile picture";

      toast.error(message);

      setProfileImage(savedProfileImage);

      setProfileImageFile(null);
    } finally {
      setImageSaving(false);
    }
  };

  const handleCancelImage = () => {
    setProfileImage(savedProfileImage);
    setProfileImageFile(null);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !username.trim()) {
      toast.error("Name and username are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", name);
      formData.append("username", username);
      formData.append("bio", about);
      formData.append("phone", phone);

      if (profileImageFile) {
        formData.append("profilePicture", profileImageFile);
      }

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${token}`,
      };

      const response = await editUserProfileAPI(formData, reqHeader);

      if (response.status === 200) {
        const updatedUser = response.data.user;

        updateUser(updatedUser);

        setName(updatedUser.name || "");
        setUsername(updatedUser.username || "");
        setEmail(updatedUser.email || "");
        setPhone(updatedUser.phone || "");

        setAbout(updatedUser.bio || "Making conversation bubbles.");

        if (updatedUser.profilePicture) {
          setProfileImage(updatedUser.profilePicture);

          setSavedProfileImage(updatedUser.profilePicture);
        } else {
          setProfileImage(defaultProfile);
          setSavedProfileImage(defaultProfile);
        }

        setProfileImageFile(null);
        setIsEditing(false);

        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message || "Failed to update profile";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileImageFile(null);

    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");

      setAbout(user.bio || "Making conversation bubbles.");

      if (user.profilePicture) {
        setProfileImage(user.profilePicture);
        setSavedProfileImage(user.profilePicture);
      } else {
        setProfileImage(defaultProfile);
        setSavedProfileImage(defaultProfile);
      }
    }
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
          <h2 className="text-lg font-semibold text-ink">Profile</h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-brand-50 text-muted transition flex items-center justify-center"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-none max-h-[calc(90vh-70px)]">
          <div className="flex flex-col items-center pt-8">
            <div className="relative">
              <img
                src={profileImage}
                alt={name}
                className="w-28 h-28 rounded-full object-cover border-4 border-brand-50"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleImageClick}
                disabled={imageSaving}
                className="absolute bottom-1 right-1 w-9 h-9 brand-gradient text-white rounded-full flex items-center justify-center shadow-glow hover:opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                <LuPencil className="text-lg" />
              </button>
            </div>

            {profileImageFile && (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCancelImage}
                  disabled={imageSaving}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-ink text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveImage}
                  disabled={imageSaving}
                  className="px-4 py-2 rounded-lg brand-gradient text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {imageSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}

            {!isEditing ? (
              <>
                <h2 className="text-xl font-semibold text-ink mt-4">
                  {name}
                </h2>

                <p className="text-sm text-muted">@{username}</p>

                <p className="text-sm text-green-500 mt-1">● Online</p>
              </>
            ) : (
              <div className="w-full px-6 mt-5 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-brand-100 rounded-xl outline-none focus:border-brand-400 text-sm text-ink"
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-3 border border-brand-100 rounded-xl outline-none focus:border-brand-400 text-sm text-ink"
                />
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="px-6 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 rounded-xl brand-gradient text-white font-medium flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition"
              >
                <LuPencil className="text-lg" />
                Edit Profile
              </button>
            </div>
          )}

          <div className="px-6 mt-8 space-y-5">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Personal Information
            </h3>

            <div>
              <p className="text-xs text-muted">About</p>

              {isEditing ? (
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows="3"
                  className="w-full mt-2 px-3 py-2 border border-brand-100 rounded-lg text-sm text-ink outline-none focus:border-brand-400 resize-none"
                />
              ) : (
                <p className="text-sm text-ink mt-1">{about}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted">Email</p>

              <p className="text-sm text-ink mt-1">{email}</p>
            </div>

            <div>
              <p className="text-xs text-muted">Phone</p>

              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Add phone number"
                  className="w-full mt-2 px-3 py-2 border border-brand-100 rounded-lg text-sm text-ink outline-none focus:border-brand-400"
                />
              ) : (
                <p className="text-sm text-ink mt-1">
                  {phone || "Not added"}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted">Date Joined</p>

              <p className="text-sm text-ink mt-1">August 2026</p>
            </div>
          </div>

          {!isEditing && (
            <div className="px-6 py-8">
              <button
                type="button"
                onClick={onSettings}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-brand-50/60 hover:bg-brand-50 transition"
              >
                <div className="flex items-center gap-3">
                  <LuSettings className="text-brand-600 text-xl shrink-0" />

                  <span className="font-medium text-ink">Settings</span>
                </div>

                <span className="text-muted">
                  <LuChevronRight className="text-lg" />
                </span>
              </button>
            </div>
          )}

          {isEditing && (
            <div className="px-6 py-8 flex gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="w-1/2 py-3 rounded-xl bg-gray-100 text-ink font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-1/2 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
