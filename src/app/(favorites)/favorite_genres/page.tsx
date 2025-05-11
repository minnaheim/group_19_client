"use client";
import React, { useEffect, useState } from "react";
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
        setError(
          "We couldn't load movie genres right now. Please try again later.",
        );
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
      setError(
        "Your session has expired. Please log in again to save favorites.",
      );
      router.push("/login");
      return;
    }

    if (!token || token === "no_token") {
      setError(
        "Your session has expired. Please log in again to save favorites.",
      );
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
      if (error instanceof Error && "status" in error) {
        const appError = error as ApplicationError;
        switch (appError.status) {
          case 400:
            setError(
              "An invalid genre was selected. Please check your choices.",
            );
            break;
          case 401:
            setError(
              "Your session has expired. Please log in again to save favorites.",
            );
            break;
          case 403:
            setError("You don't have permission to change these favorites.");
            break;
          case 404:
            setError("We couldn't find your user account to save favorites.");
            break;
          default:
            setError(
              "An error occurred while saving your favorites. Please try again.",
            );
        }
      } else {
        setError(
          "An error occurred while saving your favorites. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <ErrorMessage message={error} onClose={() => setError("")} />}
      {showSuccessMessage && (
        <ActionMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onHide={() => setShowSuccessMessage(false)}
          className="bg-green-500 text-white"
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {genres.map((genre: { id: number; name: string }) => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedGenres.includes(genre.name)
                  ? "bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  : "bg-[#ebefff] text-[#3b3e88] hover:bg-[#3b3e88]/10"
              }`}
              disabled={isLoading}
            >
              {genre.name}
            </button>
          ))}
        </div>

        <p className="text-center text-[#b9c0de] text-sm">
          {selectedGenres.length} genres selected
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/register")}
          disabled={isLoading}
          className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-xl"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
        >
          {isLoading
            ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                  </circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  >
                  </path>
                </svg>
                Saving...
              </div>
            )
            : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default GenreFavorites;
