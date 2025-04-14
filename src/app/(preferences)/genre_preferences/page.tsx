"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

const GenrePreferences: React.FC = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  // const apiService = useApi();
  const router = useRouter();
  // const { id } = useParams();

  // simulate genre which we would get from backend
  const mockGenres = [
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
  // const genres = await apiService.get("/movies/genres");

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      console.log(prev);
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre); // return genres which aren't currently selected?
      } else {
        if (prev.length >= 1) {
          // TODO: find better way to handle error
          alert("You can only select one favorite genre");
          return prev;
        }
        console.log([...prev, genre]);
        // setSelectedGenre(genre); // update selected genre to layout
        return [...prev, genre];
      }
    });
  };

  // const handleNext = async () => {
  //   if (selectedGenres.length === 0) {
  //     alert("Please select a genre before proceeding.");
  //     return;
  //   }

  //   try {
  //     await apiService.post(`/preferences/${id}`, {
  //       userId: id,
  //       favoriteGenres: selectedGenres,
  //     });

  //     router.push("/movie_preferences");
  //   } catch (error) {
  //     console.error("Failed to save preferences:", error);
  //     alert(
  //       "An error occurred while saving your preferences. Please try again."
  //     );
  //   }
  // };

  return (
    <div>
      <h3 className="text-center text-[#3C3F88] mb-6">
        Please select one genre as your favorite genre.
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {/* TODO: map not mockGenres but genres.title */}
        {mockGenres.map((genre) => (
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
      <br></br>
      <div className="flex justify-between">
        <Button variant="destructive" onClick={() => router.push("/")}>
          Back
        </Button>
        {/* TODO: figure out how to do next, dep on page currently on */}
        {/* onClick={handleNext} */}
        <Button onClick={() => router.push("/movie_preferences")}>Next</Button>
      </div>
    </div>
  );
};

export default GenrePreferences;
