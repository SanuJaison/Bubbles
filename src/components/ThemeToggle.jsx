import { LuSun, LuMoon, LuMonitor } from "react-icons/lu";
import { useTheme } from "../context/ThemeContext";

const OPTIONS = [
  { id: "light", label: "Light", icon: <LuSun className="text-base" /> },
  { id: "dark", label: "Dark", icon: <LuMoon className="text-base" /> },
  { id: "system", label: "System", icon: <LuMonitor className="text-base" /> },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-brand-50/70 border border-brand-100">
      {OPTIONS.map((option) => {
        const isActive = theme === option.id;

        return (
          <button
            type="button"
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
              isActive
                ? "brand-gradient text-white shadow-glow"
                : "text-muted hover:text-brand-600"
            }`}
          >
            {option.icon}

            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
