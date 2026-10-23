import { Navigate } from "react-router-dom";
import { LuLoaderCircle } from "react-icons/lu";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center px-4">
        <div
          className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400"
          role="status"
          aria-live="polite"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
            <LuLoaderCircle className="animate-spin text-xl text-violet-600 dark:text-violet-400" />
          </span>
          <p className="text-sm">Checking admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
