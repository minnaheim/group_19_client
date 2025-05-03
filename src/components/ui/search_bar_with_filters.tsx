import React from "react";
import { ChevronDown, Search } from "lucide-react";
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
    //{ value: "director", label: "Director" },
    //{ value: "actors", label: "Actors" },
  ],
  placeholder = "Search movies...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-white/70" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full pl-12 pr-12 py-3 h-12 bg-gradient-to-r from-rose-400 to-rose-500 rounded-2xl border-0 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50 focus:outline-none"
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/70 hover:text-white"
            onClick={onClearSearch}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              >
              </path>
            </svg>
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={searchCategory}
          onChange={onCategoryChange}
          className="appearance-none w-full h-12 pl-4 pr-10 rounded-full border-none bg-gradient-to-r from-violet-600 to-indigo-900 text-white min-w-[140px] focus:ring-2 focus:ring-white/30 focus:outline-none"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-white/70" />
        </div>
      </div>

      {searchQuery && (
        <Button
          variant="destructive"
          onClick={onClearSearch}
          className="px-6 h-12 bg-rose-500 hover:bg-rose-600 rounded-full md:hidden"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
