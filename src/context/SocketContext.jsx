import { createContext, useContext, useEffect, useState } from "react";

import { io } from "socket.io-client";

import { useAuth } from "./AuthContext";

const socketURL = (
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000"
)
  .trim()
  .replace(/\/+$/, "");

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();

  const [socket, setSocket] = useState(null);

  // Only whether a user exists matters here — depending on the whole user
  // object re-opened the socket on every profile/settings change.
  const hasUser = Boolean(user);

  useEffect(() => {
    if (!token || !hasUser) {
      return;
    }

    console.log("Creating socket connection...");

    const newSocket = io(socketURL, {
      auth: {
        token,
      },
      transports: ["polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected from frontend:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.log("SOCKET CONNECT ERROR");
      console.log("Message:", error.message);
      console.log("Full error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected from frontend:", reason);
    });

    setSocket(newSocket);

    return () => {
      console.log("Closing socket connection...");

      // Announce the sign-out so the server flips presence to offline right
      // away; disconnect() below is the guaranteed fallback.
      newSocket.emit("goOffline");
      newSocket.disconnect();

      setSocket(null);
    };
  }, [token, hasUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
