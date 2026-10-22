import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const app = (
  <ThemeProvider>
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {app}
        </GoogleOAuthProvider>
      ) : (
        app
      )}
    </BrowserRouter>
  </StrictMode>,
);
