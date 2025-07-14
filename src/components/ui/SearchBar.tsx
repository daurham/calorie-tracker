import { Search } from "lucide-react";
import { Input } from ".";

const SearchBar = (
  { searchQuery, setSearchQuery, placeholder, className }: { searchQuery: string, setSearchQuery: (value: string) => void, placeholder?: string, className?: string }) => {
    const placeholderText = placeholder || "Search...";
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholderText}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`pl-9 bg-white/50 dark:bg-slate-700/50 ${className}`}
      />
    </div>
  )
};

export default SearchBar;