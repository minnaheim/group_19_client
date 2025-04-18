import React from "react";
import { Search } from "lucide-react";
import { Input } from "./input";

interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearSearch: () => void;
    placeholder?: string;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 searchQuery,
                                                 onSearchChange,
                                                 onClearSearch,
                                                 placeholder = "Search titles...",
                                                 className = "",
                                             }) => {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;