"use client";

import { useState } from "react";
// TODO: change this so that there can only be 1 favorite genre per person

const genrePreferences: React.FC = () => {
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
  // TODO: make sure that exactly 1 genre is chosen before going to next
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      console.log(prev);
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre); // return genres which arent currently selected?
      } else {
        if (prev.length >= 1) {
          // TODO: find better way to handle error
          throw new Error("You can only select one favorite genre");
        }
        console.log([...prev, genre]);
        return [...prev, genre];
      }
    });
  };

  return (
    <div>
      <h3 className="text-center text-[#3C3F88] mb-6">
        Please select one genre as your favorite genre.
      </h3>
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

export default genrePreferences;
