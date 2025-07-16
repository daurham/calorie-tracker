import { Search } from "lucide-react";
import { Input } from ".";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  placeholder?: string;
  className?: string;
  isSticky?: boolean;
}
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  placeholder,
  className,
  isSticky = false,
}: SearchBarProps
) => {
  const placeholderText = placeholder || "Search...";

  const inputElement = (
    <div className="relative border-20 border-slate-200 dark:border-slate-700 rounded-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholderText}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`pl-9 bg-background ${className}`}
      />
    </div>
  );

  if (isSticky) {
    return (
      <div className="sticky top-0 z-10 pb-2 bg-background border-b border-border" style={{ top: '-1px' }}>
        {inputElement}
      </div>
    );
  }

  return inputElement;
};

export default SearchBar;