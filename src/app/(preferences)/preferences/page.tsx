"use client";

import { useState } from "react";

const Preferences: React.FC = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // simulate genre which we would get from backend
  const genres = [
    "Crime",
    "Mystery",
    "Rom-Com",
    "Horror",
    "Comedy",
    "Thriller",
    "Fantasy",
    "Drama",
    "Sci-Fi",
    "Western",
    "Musical",
    "Mythology",
    "Adventure",
    "Romance",
    "Documentary",
    "Dystopian",
    "Time Travel",
    "Noir",
    "Action",
    "Biopic",
    "Psychological Thriller",
    "Supernatural",
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => toggleGenre(genre)}
            className={`px-4 py-2 rounded-full border ${
              selectedGenres.includes(genre)
                ? "bg-[#AFB3FF] text-white" 
                : "bg-[#CDD1FF]  text-white"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
      <p className="text-center mt-4 text-sm text-[#3C3F88]">
        {selectedGenres.length} genres selected
      </p>
    </div>
  );
};

export default Preferences;
