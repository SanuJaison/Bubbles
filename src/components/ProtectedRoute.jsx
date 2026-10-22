import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({
  children,
  fallback = <Navigate to="/login" replace />,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-shell min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffffff] p-2 shadow-soft">
            <img
              src="/bubbles-logo.png"
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
          <p className="text-sm text-muted">Loading Bubbles...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback;
  }

  if (user.needsUsername) {
    return <Navigate to="/choose-username" replace />;
  }

  return children;
};

export default ProtectedRoute;
