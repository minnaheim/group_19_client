"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

const GenrePreferences: React.FC = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();

  // Fetch genres from the backend
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response =
          await apiService.get<{ id: number; name: string }[]>(
            "/movies/genres"
          );
        setGenres(response); // Store the genres in state
      } catch (error) {
        console.error("Failed to fetch genres:", error);
        alert("An error occurred while fetching genres. Please try again.");
      }
    };

    fetchGenres();
  }, [apiService]);

  // const genres = await apiService.get("/movies/genres");

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      console.log(prev);
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre); // return genres which aren't currently selected?
      } else {
        if (prev.length >= 1) {
          alert("You can only select one favorite genre");
          return prev;
        }
        console.log([...prev, genre]);
        return [...prev, genre];
      }
    });
  };

  const handleNext = async () => {
    if (selectedGenres.length === 0) {
      alert("Please select a genre before proceeding.");
      return;
    }

    try {
      await apiService.post(`/preferences/${id}`, {
        userId: id,
        favoriteGenres: selectedGenres,
      });

      // passing the selected genre to the next preference page
      router.push(`/movie_preferences?genre=${selectedGenres[0]}`);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert(
        "An error occurred while saving your preferences. Please try again."
      );
    }
    //   router.push("/movie_preferences");
    // } catch (error) {
    //   console.error("Failed to save preferences:", error);
    //   alert(
    //     "An error occurred while saving your preferences. Please try again."
    //   );
    // }
  };

  return (
    <div>
      <h3 className="text-center text-[#3C3F88] mb-6">
        Please select one genre as your favorite genre.
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {/* TODO: map not mockGenres but genres.title */}
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => toggleGenre(genre.name)}
            className={`px-4 py-2 rounded-full border ${
              selectedGenres.includes(genre.name)
                ? "bg-[#AFB3FF] text-white"
                : "bg-[#CDD1FF]  text-white"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
      <p className="text-center mt-4 text-sm text-[#3C3F88]">
        {selectedGenres.length} genres selected
      </p>
      <br />
      <div className="flex justify-between">
        <Button variant="destructive" onClick={() => router.push("/")}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default GenrePreferences;
