import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Utensils, Plus, Settings, Sparkles, Menu, X, Puzzle } from "lucide-react";
import { ThemeToggle } from ".";
import { Button } from "./ui";

const Navbar = ({
  setIsSettingsOpen,
  setIsMealsModalOpen,
  setIsIngredientsModalOpen,
  setIsLogModalOpen,
  setIsModSettingsOpen,
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  interface ButtonConfig {
    icon: React.ReactNode;
    onClick: () => void;
    label: string;
    className: string;
    variant: "outline" | "link" | "default" | "destructive" | "secondary" | "ghost";
  }
  const config = {
    title: "Caloric Tracker",
    subtitle: "Smart calorie tracking made simple",
    buttons: [
      {
        icon: <Settings className="h-4 w-4" />,
        onClick: () => setIsSettingsOpen(true),
        label: "User Settings",
        className: "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3",
        variant: "outline"
      },
      {
        icon: <Utensils className="h-4 w-4" />,
        onClick: () => setIsMealsModalOpen(true),
        label: "Meals",
        className: "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3",
        variant: "outline"
      },
      {
        icon: <ChefHat className="h-4 w-4" />,
        onClick: () => setIsIngredientsModalOpen(true),
        label: "Ingredients",
        className: "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950 px-2 sm:px-3",
        variant: "outline"
      },
      {
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setIsLogModalOpen(true),
        label: "Log Meal",
        className: "border-blue-200 hover:bg-blue-50 dark:border-blue-500 dark:hover:bg-blue-950 px-2 sm:px-3",
        variant: "outline"

      },
      {
        icon: <Sparkles className="h-4 w-4" />,
        onClick: () => navigate('/meal-plan-generator'),
        label: "AI Meal Plan",
        className: "border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-700 px-2 sm:px-3",
        variant: "outline"
      },
      {
        icon: <Puzzle className="h-4 w-4" />,
        onClick: () => setIsModSettingsOpen(true),
        label: "Mods",
        className: "border-orange-200 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-950 px-2 sm:px-3",
        variant: "outline"
      },

    ] as ButtonConfig[]
  };

  const handleMobileMenuClick = (onClick) => {
    onClick();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              {config.subtitle}
            </p>
          </div>

          {/* Desktop Navbar Buttons */}
          <div className="hidden md:flex gap-1 sm:gap-2">

            {config.buttons.map((button) => (
              <Button
                key={button.label}
                onClick={button.onClick}
                variant={button.variant as "outline" | "link" | "default" | "destructive" | "secondary" | "ghost"}
                size="sm"
                className={button.className}
              >
                {button.icon}
                <span className="hidden sm:inline ml-2">{button.label}</span>
              </Button>
            ))}

            <ThemeToggle />

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="outline"
              size="sm"
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-lg z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-2">
                {config.buttons.map((button) => (
                  <Button
                    key={button.label}
                    onClick={() => handleMobileMenuClick(button.onClick)}
                    variant={button.variant as "outline" | "link" | "default" | "destructive" | "secondary" | "ghost"}
                    size="sm"
                    className={`justify-start ${button.className}`}
                  >
                    {button.icon}
                    <span className="ml-3">{button.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;