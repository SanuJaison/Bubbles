import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAdminMeAPI } from "../service/adminAPI";

const AdminAuthContext = createContext(null);

const TOKEN_KEY = "bubbles_admin_token";
const ADMIN_KEY = "bubbles_admin_user";

const readStoredAdmin = () => {
  try {
    const saved = localStorage.getItem(ADMIN_KEY);

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [admin, setAdmin] = useState(readStoredAdmin);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    } catch {
      // Storage can be unavailable in private modes; state still clears.
    }

    setToken("");
    setAdmin(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;

    getAdminMeAPI({ Authorization: `Bearer ${token}` })
      .then((response) => {
        if (!active) {
          return;
        }

        const nextAdmin = response.data?.admin || null;

        setAdmin(nextAdmin);

        try {
          if (nextAdmin) {
            localStorage.setItem(ADMIN_KEY, JSON.stringify(nextAdmin));
          }
        } catch {
          // The in-memory session is still valid.
        }
      })
      .catch(() => {
        if (active) {
          logout();
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = useCallback((nextToken, nextAdmin) => {
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(nextAdmin));
    } catch {
      // The session still works for this tab.
    }

    setLoading(true);
    setToken(nextToken);
    setAdmin(nextAdmin);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token && admin),
      login,
      logout,
      authHeader: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    [admin, token, loading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
};
