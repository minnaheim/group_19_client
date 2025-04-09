import React from "react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface SearchBarProps {
  searchQuery: string;
  searchCategory: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearSearch: () => void;
  categories?: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  searchCategory,
  onSearchChange,
  onCategoryChange,
  onClearSearch,
  categories = [
    { value: "all", label: "All" },
    { value: "title", label: "Title" },
    { value: "genre", label: "Genre" },
    { value: "director", label: "Director" },
    { value: "actors", label: "Actors" },
  ],
  placeholder = "Search movies...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-10 py-2 w-full rounded-md bg-white"
        />
      </div>
      <select
        value={searchCategory}
        onChange={onCategoryChange}
        className="p-2 rounded-[30px] border-none bg-[#3b3e88] text-white min-w-[120px] focus:ring-2 focus:ring-[#6266b6] focus:outline-none"
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      {searchQuery && (
        <Button
          variant="destructive"
          onClick={onClearSearch}
          className="px-4"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
