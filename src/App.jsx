import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ChooseUsername from "./pages/ChooseUsername";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import CallOverlay from "./components/CallOverlay";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          // Toasts sit outside the normal card styles, so theme them with the
          // same tokens the rest of the app uses. Without this they stay white
          // and the light `text-ink` copy disappears in dark mode.
          style: {
            background: "var(--color-brand-50)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-brand-100)",
            boxShadow: "var(--shadow-soft)",
            borderRadius: "16px",
            fontSize: "14px",
            maxWidth: "360px",
          },
          success: {
            iconTheme: {
              primary: "var(--color-brand-600)",
              secondary: "var(--color-brand-50)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "var(--color-brand-50)",
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute fallback={<Landing />}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/choose-username" element={<ChooseUsername />} />
      </Routes>

      <CallOverlay />
    </>
  );
}

export default App;
