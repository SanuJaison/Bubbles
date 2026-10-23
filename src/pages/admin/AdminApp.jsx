import { Navigate, Route, Routes } from "react-router-dom";
import AdminProtectedRoute from "../../components/admin/AdminProtectedRoute";
import { AdminAuthProvider } from "../../context/AdminAuthContext";
import AdminDashboard from "./AdminDashboard";
import AdminFeedback from "./AdminFeedback";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminUsers from "./AdminUsers";
import "./admin.css";

const AdminApp = () => (
  <AdminAuthProvider>
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="feedback" element={<AdminFeedback />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </AdminAuthProvider>
);

export default AdminApp;
