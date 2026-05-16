import { IconMoon, IconSun } from "@tabler/icons-react";
import { useAppStore } from "../stores/appStore";

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  return (
    <button className="theme-toggle" onClick={() => setTheme(theme === "night" ? "light" : "night")} aria-label="Toggle theme">
      {theme === "night" ? <IconMoon size={16} /> : <IconSun size={16} />}
      <span>{theme.toUpperCase()}</span>
    </button>
  );
}
