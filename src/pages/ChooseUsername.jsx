import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuAtSign,
  LuLogOut,
  LuShieldCheck,
  LuSparkles,
} from "react-icons/lu";
import toast from "react-hot-toast";
import bubbles from "../assets/bubbles.png";
import defaultProfile from "../assets/profileImage.png";
import { chooseUsernameAPI } from "../service/api";
import { useAuth } from "../context/AuthContext";

const ChooseUsername = () => {
  const { user, token, loading, logout, updateUser } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.needsUsername) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9._]{3,32}$/.test(cleanUsername)) {
      toast.error(
        "Use 3-32 characters: letters, numbers, dots, or underscores only",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await chooseUsernameAPI(
        { username: cleanUsername },
        { Authorization: `Bearer ${token}` },
      );

      if (response.status === 200) {
        updateUser(response.data.user);
        toast.success("Username saved");
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "That username could not be saved",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUseAnotherAccount = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
        <div className="flex flex-col items-center justify-center p-5">
          <img width={140} src={bubbles} alt="" />

          <div className="relative mt-5">
            <img
              src={
                user.profilePicture && user.profilePicture.trim()
                  ? user.profilePicture
                  : defaultProfile
              }
              alt=""
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-soft"
            />

            <span className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full brand-gradient text-white flex items-center justify-center shadow-glow">
              <LuSparkles className="text-base" />
            </span>
          </div>

          <p className="text-2xl sm:text-3xl font-bold pt-4 text-ink">
            Choose your username
          </p>

          <p className="text-muted mt-2 max-w-sm">
            Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}. Pick the
            name your friends will use to find you on Bubbles.
          </p>

          <p className="text-xs text-muted mt-1 break-all">
            Signed in as {user.email}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full px-2 sm:px-20 py-5"
        >
          <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
            <LuAtSign className="text-lg shrink-0" />

            <input
              type="text"
              placeholder="your.username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={32}
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.replace(/\s/g, "").toLowerCase())
              }
              className="outline-none flex-1 bg-transparent text-ink min-w-0"
            />
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <LuShieldCheck className="text-base text-brand-600 shrink-0" />
            3-32 characters: letters, numbers, dots, or underscores
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition disabled:opacity-60"
          >
            {saving ? "Saving username..." : "Continue to Bubbles"}
            <LuArrowRight className="text-lg" />
          </button>

          <button
            type="button"
            onClick={handleUseAnotherAccount}
            className="text-sm text-muted hover:text-brand-600 transition flex items-center justify-center gap-2"
          >
            <LuLogOut className="text-base" /> Use a different account
          </button>

          <p className="text-xs text-muted">
            Need help?{" "}
            <Link to="/login" replace className="text-brand-600">
              Return to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChooseUsername;
