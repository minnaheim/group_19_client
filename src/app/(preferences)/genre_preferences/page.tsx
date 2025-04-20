"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { usePreferences } from "@/app/context/PreferencesContext";
import useLocalStorage from "@/app/hooks/useLocalStorage";

const GenrePreferences: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const { selectedGenres, setSelectedGenres } = usePreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: token } = useLocalStorage<string>("token", "");

  useEffect(() => {
    apiService.getGenres().then(setGenres).catch(() => setGenres([]));
  }, [apiService]);

  const toggleGenre = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleNext = async () => {


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
      await apiService.saveUserGenres(Number(userId), selectedGenres);
      router.push("/movie_preferences");
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
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
          Please select your favorite genres.
        </h3>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          {genres.map((genre: { id: number; name: string }) => (
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
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
  );
};

export default GenrePreferences;