import bubbles from "../assets/bubbles.png";
import {
  LuUser,
  LuLock,
  LuEye,
  LuEyeOff,
  LuArrowRight,
} from "react-icons/lu";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAPI } from "../service/api";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton";
import PublicFooter from "../components/PublicFooter";
import { getDeviceId } from "../utils/deviceId";
import toast from "react-hot-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const { login, loading, user } = useAuth();

  // The desktop app opens straight into the app, so send an already
  // authenticated visitor to their conversations instead of the login form.
  useEffect(() => {
    if (!loading && user) {
      navigate(user.needsUsername ? "/choose-username" : "/", {
        replace: true,
      });
    }
  }, [loading, navigate, user]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const { identifier, password } = loginData;

    if (!identifier || !password) {
      toast.error("Please enter your email/username and password");
      return;
    }

    try {
      const response = await loginAPI({
        ...loginData,
        deviceId: getDeviceId(),
      });

      if (response.status === 200) {
        const { token, user } = response.data;

        login(token, user);

        toast.success("Login successful");

        // Replace the login entry instead of stacking `/` on top of it, so
        // the browser Back button can never reveal the sign-in screen again.
        navigate(user.needsUsername ? "/choose-username" : "/", {
          replace: true,
        });
      }
    } catch (error) {
      const data = error.response?.data;
      const message = data?.message || "Login failed";

      if (data?.code === "EMAIL_NOT_VERIFIED") {
        toast.error(message);

        const email = data.email || (identifier.includes("@") ? identifier : "");

        navigate(
          `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`,
          { replace: true },
        );
        return;
      }

      toast.error(message);
    }
  };

  if (loading || user) {
    return null;
  }

  return (
    <>
      <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
        <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
          <div className="flex flex-col items-center justify-center p-5">
            <img width={160} src={bubbles} alt="" />

            <p className="text-3xl font-bold pt-4 text-ink">Welcome back 👋</p>

            <p className="text-muted">
              Login to continue your conversations
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5 w-full px-2 sm:px-20 py-5"
          >
            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuUser className="text-lg shrink-0" />

              <input
                type="text"
                placeholder="Enter your email or username"
                autoComplete="username"
                value={loginData.identifier}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    identifier: e.target.value,
                  })
                }
                className="outline-none flex-1 bg-transparent text-ink"
              />
            </div>

            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuLock className="text-lg shrink-0" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value,
                  })
                }
                className="outline-none flex-1 bg-transparent text-ink"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer shrink-0"
              >
                {showPassword ? (
                  <LuEyeOff className="text-lg" />
                ) : (
                  <LuEye className="text-lg" />
                )}
              </button>
            </div>

            <div className="flex justify-between text-sm pt-5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-brand-600 cursor-pointer"
                />

                <label className="text-ink">Remember me</label>
              </div>

              <Link to={"/forgot-password"} className="text-brand-600">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition"
            >
              Login <LuArrowRight className="text-lg" />
            </button>
          </form>

          <GoogleAuthButton />

          <p className="text-ink">
            Don't have an account?{" "}
            <Link to={"/register"} className="text-brand-600">
              Create Account
            </Link>
          </p>

          <PublicFooter />
        </div>
      </div>
    </>
  );
};

export default Login;
