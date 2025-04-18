"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { usePreferences } from "@/app/context/PreferencesContext";
import useLocalStorage from "@/app/hooks/useLocalStorage";

// Static genre list
const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

const GenrePreferences: React.FC = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const apiService = useApi();
  const router = useRouter();
  const { setSelectedGenre } = usePreferences();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: token } = useLocalStorage<string>("token", "");

  const toggleGenre = (genreName: string) => {
    setSelectedGenres((prev) => {
      // If this genre is already selected, deselect it
      if (prev.includes(genreName)) {
        return prev.filter(g => g !== genreName);
      }
      // Otherwise, select this genre (replacing any previously selected genre)
      else {
        // Return new selection immediately
        const newSelection = [genreName];

        // Update context after render is complete
        setTimeout(() => {
          setSelectedGenre(genreName);
        }, 0);

        return newSelection;
      }
    });
  };

  const handleNext = async () => {
    if (selectedGenres.length === 0) {
      setError("Please select a genre before proceeding.");
      return;
    }

    if (!userId) {
      setError("User ID not found. Please log in again.");
      router.push("/login");
      return;
    }

    if (!token || token === "no_token") {
      setError("You need to be logged in. Please log in again.");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use the exact endpoint from the UserPreferencesController
      const endpoint = `/api/users/${userId}/preferences/genres`;

      // Add explicit token in the headers
      const options = {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      };

      // Format expected by the controller
      await apiService.post(endpoint, {
        genreIds: selectedGenres
      }, options);

      // Navigate to movie preferences page
      router.push("/movie_preferences");
    } catch (error) {
      console.error("Failed to save preferences:", error);

      if (error instanceof Error) {
        setError(`Error: ${error.message}`);

        // For authentication errors, redirect to login
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
      } else {
        setError("An error occurred while saving your preferences. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div>
        <h3 className="text-center text-[#3C3F88] mb-6">
          Please select one genre as your favorite genre.
        </h3>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          {GENRES.map((genre) => (
              <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.name)}
                  className={`px-4 py-2 rounded-full border ${
                      selectedGenres.includes(genre.name)
                          ? "bg-[#AFB3FF] text-white"
                          : "bg-[#CDD1FF] text-white"
                  }`}
                  disabled={isLoading}
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
          <Button variant="destructive" onClick={() => router.push("/")} disabled={isLoading}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={isLoading || selectedGenres.length === 0}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
  );
};

export default GenrePreferences;