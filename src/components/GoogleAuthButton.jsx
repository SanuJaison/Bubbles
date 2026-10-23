import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { googleAuthAPI } from "../service/api";
import { useAuth } from "../context/AuthContext";
import { getDeviceId } from "../utils/deviceId";

// Google renders its button inside a fixed-width iframe, so the width has to
// be measured in JS to keep it inside the auth card on small screens.
const GoogleAuthButton = () => {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  const [buttonWidth, setButtonWidth] = useState(() =>
    typeof window === "undefined"
      ? 350
      : Math.max(200, Math.min(350, window.innerWidth - 96)),
  );

  const [connecting, setConnecting] = useState(false);

  const navigate = useNavigate();

  const { login } = useAuth();

  useEffect(() => {
    const updateWidth = () => {
      setButtonWidth(Math.max(200, Math.min(350, window.innerWidth - 96)));
    };

    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (!clientId) {
    if (!import.meta.env.DEV) {
      return null;
    }

    return (
      <>
        <div className="flex items-center justify-center px-4 sm:px-20 py-5 gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-brand-200" />

          <span className="text-sm text-muted">or</span>

          <div className="h-px flex-1 bg-linear-to-l from-transparent to-brand-200" />
        </div>

        <p className="px-4 sm:px-20 pb-5 text-xs text-muted">
          Add VITE_GOOGLE_CLIENT_ID to frontend/.env to enable Google sign-in.
        </p>
      </>
    );
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential || connecting) {
      return;
    }

    try {
      setConnecting(true);

      const response = await googleAuthAPI({
        credential: credentialResponse.credential,
        deviceId: getDeviceId(),
      });

      if (response.status === 200) {
        const { token, user, message } = response.data;

        login(token, user);
        toast.success(message || "Signed in with Google");

        navigate(user.needsUsername ? "/choose-username" : "/", {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Google sign-in could not be completed",
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center px-4 sm:px-20 py-5 gap-4">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-brand-200" />

        <span className="text-sm text-muted">or</span>

        <div className="h-px flex-1 bg-linear-to-l from-transparent to-brand-200" />
      </div>

      <div className="flex flex-col items-center gap-2 pb-5">
        <div className={connecting ? "opacity-60 pointer-events-none" : ""}>
          <GoogleLogin
            width={buttonWidth}
            text="continue_with"
            shape="pill"
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error("Google sign-in could not be completed");
            }}
          />
        </div>

        {connecting ? (
          <p className="text-xs text-muted">Connecting to Google...</p>
        ) : null}
      </div>
    </>
  );
};

export default GoogleAuthButton;
