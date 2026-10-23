import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PageLoader from "./PageLoader";

const ProtectedRoute = ({
  children,
  fallback = <Navigate to="/login" replace />,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
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
