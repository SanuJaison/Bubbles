import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_MESSAGE_THEME_ID } from "../constants/messageThemes";

const ThemeContext = createContext();

const getSystemTheme = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const [chatTheme, setChatThemeState] = useState(
    () => localStorage.getItem("chatTheme") || DEFAULT_MESSAGE_THEME_ID,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (value) => {
    setThemeState(value);
    localStorage.setItem("theme", value);
  };

  const setChatTheme = (value) => {
    setChatThemeState(value);
    localStorage.setItem("chatTheme", value);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      chatTheme,
      setChatTheme,
    }),
    [theme, resolvedTheme, chatTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
