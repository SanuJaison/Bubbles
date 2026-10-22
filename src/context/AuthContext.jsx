import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileAPI } from "../service/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      const reqHeader = {
        Authorization: `Bearer ${savedToken}`,
      };

      const response = await getUserProfileAPI(reqHeader);

      if (response.status === 200) {
        setToken(savedToken);
        setUser(response.data.user);

        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.log("Authentication failed");
      console.log(error);
      

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeChatId");

      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (loginToken, loginUser) => {
    localStorage.setItem("token", loginToken);
    localStorage.setItem("user", JSON.stringify(loginUser));

    setToken(loginToken);
    setUser(loginUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Don't let the next account restore a conversation that belonged to
    // the user who just signed out.
    localStorage.removeItem("activeChatId");

    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);

    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const updateToken = (nextToken) => {
    if (!nextToken) {
      return;
    }

    localStorage.setItem("token", nextToken);
    setToken(nextToken);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser, updateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
