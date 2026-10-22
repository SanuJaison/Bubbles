import bubbles from "../assets/bubbles.png";
import {
  LuUser,
  LuAtSign,
  LuMail,
  LuLock,
  LuEye,
  LuEyeOff,
  LuShieldCheck,
  LuArrowRight,
} from "react-icons/lu";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAPI } from "../service/api";
import GoogleAuthButton from "../components/GoogleAuthButton";
import toast from "react-hot-toast";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const { name, username, email, password } = userData;

    if (!name || !username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!/[a-z]/i.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must include at least one letter and one number");
      return;
    }

    try {
      const response = await registerAPI(userData);

      if (response.status === 201) {
        toast.success("Account created. Check your email to verify it.");
        setUserData({
          name: "",
          username: "",
          email: "",
          password: "",
        });
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          replace: true,
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";

      toast.error(message);
    }
  };

  return (
    <>
      <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
        <div className="glass-strong w-full max-w-xl rounded-3xl p-6 sm:p-10 text-center shadow-soft border border-brand-100/70">
          <div className="flex flex-col items-center justify-center p-5">
            <img width={160} src={bubbles} alt="" />
            <p className="text-3xl font-bold pt-4 text-ink">
              Create your account
            </p>
            <p className="text-muted">
              Join the conversation. It's quick and easy
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-5 w-full px-2 sm:px-20 py-5"
          >
            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuUser className="text-lg shrink-0" />
              <input
                type="text"
                placeholder="Name"
                autoComplete="off"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="outline-none flex-1 bg-transparent text-ink"
              />
            </div>

            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuAtSign className="text-lg shrink-0" />
              <input
                type="text"
                placeholder="Username"
                autoComplete="off"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                className="outline-none flex-1 bg-transparent text-ink"
              />
            </div>

            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuMail className="text-lg shrink-0" />
              <input
                type="email"
                placeholder="Email address"
                autoComplete="off"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="outline-none flex-1 bg-transparent text-ink"
              />
            </div>

            <div className="flex items-center px-5 py-3 border border-brand-200 outline-none rounded-xl gap-3 text-muted shadow-sm focus-within:border-brand-400 transition w-full">
              <LuLock className="text-lg shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={userData.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
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

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <LuShieldCheck className="text-base text-brand-600 shrink-0" />
              Use atleast 8 characters mix of letters and numbers
            </p>

            <p className="text-xs text-muted -mt-2">
              We&apos;ll email you a link to verify your address.
            </p>

            <button
              type="submit"
              className="w-full brand-gradient text-white font-medium py-3 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-glow cursor-pointer hover:opacity-95 transition"
            >
              Create Account <LuArrowRight className="text-lg" />
            </button>
          </form>

          <GoogleAuthButton />

          <p className="text-ink">
            Already have an account?{" "}
            <Link to={"/login"} className="text-brand-600">
              Log in
            </Link>
          </p>

          <p className="text-sm text-muted mt-2">
            Need to verify your email?{" "}
            <Link to={"/verify-email"} className="text-brand-600">
              Resend the link
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
