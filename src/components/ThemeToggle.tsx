import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Check system preference on mount
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!theme) {
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="sm"
      className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
