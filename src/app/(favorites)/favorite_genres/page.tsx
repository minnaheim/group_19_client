"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { useFavorites } from "@/app/context/FavoritesContext";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { ApplicationError } from "@/app/types/error";

const GenreFavorites: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const { selectedGenres, setSelectedGenres } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: token } = useLocalStorage<string>("token", "");

  useEffect(() => {
    apiService.getGenres()
      .then(setGenres)
      .catch(() => {
        setError("We couldn't load movie genres right now. Please try again later.");
        setGenres([]);
      });
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
      setError("Your session has expired. Please log in again to save favorites.");
      router.push("/login");
      return;
    }

    if (!token || token === "no_token") {
      setError("Your session has expired. Please log in again to save favorites.");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await apiService.saveUserGenres(Number(userId), selectedGenres);
      setSuccessMessage("Genre favorites saved successfully");
      setShowSuccessMessage(true);
      router.push("/favorite_movies");
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) {
        const appError = error as ApplicationError;
        switch (appError.status) {
          case 400:
            setError("An invalid genre was selected. Please check your choices.");
            break;
          case 401:
            setError("Your session has expired. Please log in again to save favorites.");
            break;
          case 403:
            setError("You don't have permission to change these favorites.");
            break;
          case 404:
            setError("We couldn't find your user account to save favorites.");
            break;
          default:
            setError("An error occurred while saving your favorites. Please try again.");
        }
      } else {
        setError("An error occurred while saving your favorites. Please try again.");
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

      <ErrorMessage message={error} onClose={() => setError("")} />
      <ActionMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onHide={() => setShowSuccessMessage(false)}
        className="bg-green-500"
      />

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

export default GenreFavorites;
