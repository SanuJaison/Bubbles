import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoader from "./components/PageLoader";
import { useCall } from "./context/CallContext";

// The public landing page stays in the initial bundle so it paints without a
// second round trip. Everything behind auth is split into its own chunk.
const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Feedback = lazy(() => import("./pages/Feedback"));
const ChooseUsername = lazy(() => import("./pages/ChooseUsername"));
const AdminApp = lazy(() => import("./pages/admin/AdminApp"));
const CallOverlay = lazy(() => import("./components/CallOverlay"));

const CallOverlayGate = () => {
  const { call } = useCall();

  if (!call) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CallOverlay />
    </Suspense>
  );
};

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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/choose-username" element={<ChooseUsername />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>

      <CallOverlayGate />
    </>
  );
}

export default App;
