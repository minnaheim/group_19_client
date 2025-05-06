"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { ApplicationError } from "@/app/types/error";
import { Button } from "@/components/ui/button";
import ActionMessage from "@/components/ui/action_message";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { useFavorites } from "@/app/context/FavoritesContext";
import useLocalStorage from "@/app/hooks/useLocalStorage";

// Helper function to remove duplicate movies by movieId
const removeDuplicateMovies = (movies: Movie[]): Movie[] => {
  const uniqueMovies = new Map<number, Movie>();

  movies.forEach((movie) => {
    if (!uniqueMovies.has(movie.movieId)) {
      uniqueMovies.set(movie.movieId, movie);
    }
  });

  return Array.from(uniqueMovies.values());
};

const MovieFavorites: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();
  const { selectedGenres, favoriteMovieId, setFavoriteMovieId } =
    useFavorites();
  const { value: userId } = useLocalStorage<string>("userId", "");

  // Fetch movies based on selected genres
  useEffect(() => {
    const fetchMoviesByGenres = async () => {
      setIsLoading(true);
      try {
        if (selectedGenres && selectedGenres.length > 0) {
          // Join selected genres for query
          const genresParam = selectedGenres.map(encodeURIComponent).join(",");
          const response = await apiService.get<Movie[]>(
            `/movies?genres=${genresParam}`,
          );
          // Remove duplicates before setting state
          setGenreMovies(removeDuplicateMovies(response));
        } else {
          // If no genres are selected, show recent movies
          const currentYear = new Date().getFullYear();
          const response = await apiService.get<Movie[]>(
            `/movies?year=${currentYear}`,
          );
          // Remove duplicates before setting state
          setGenreMovies(removeDuplicateMovies(response));
        }
      } catch (err: unknown) {
        // Map errors for movie fetch by genres or recent fetch
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (selectedGenres && selectedGenres.length > 0) {
            // fetching by genres
            if (appErr.status === 400) {
              setError(
                "We couldn't find movies for the selected genres. Try different genres.",
              );
            } else {
              setError(
                "An error occurred while fetching movies. Please try again.",
              );
            }
          } else {
            // fetching recent movies
            if (appErr.status === 400) {
              setError("We couldn't fetch recent movies at this time.");
            } else {
              setError(
                "An error occurred while fetching movies. Please try again.",
              );
            }
          }
        } else {
          setError(
            "An error occurred while fetching movies. Please try again.",
          );
        }
        setGenreMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesByGenres();
  }, [selectedGenres, apiService]);

  // Search logic - search the entire database by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const searchMovies = async () => {
      try {
        // only search by title
        const queryString = `title=${encodeURIComponent(searchQuery.trim())}`;

        // make api call with title parameter only
        const results = await apiService.get<Movie[]>(`/movies?${queryString}`);
        if (Array.isArray(results)) {
          // Remove duplicates before setting state
          setSearchResults(removeDuplicateMovies(results));
        } else {
          setSearchResults([]);
        }
      } catch (err: unknown) {
        console.error("Search failed:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 400) {
            setError(
              "No movies found matching your search term. Try searching for something else.",
            );
          } else {
            setError("Failed to search movies");
          }
        } else {
          setError("Failed to search movies");
        }
      }
    };

    // debounce search to avoid too many api calls
    const debounceTimer = setTimeout(() => {
      searchMovies();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, apiService]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies([movie]);
    setFavoriteMovieId(movie.movieId);
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    const effectiveUserId = userId || id;

    try {
      if (favoriteMovieId !== null) {
        await apiService.saveFavoriteMovie(
          Number(effectiveUserId),
          favoriteMovieId,
        );
        setSuccessMessage("Favorite movie saved successfully");
        setShowSuccessMessage(true);
      }
      router.push(`/users/${effectiveUserId}/dashboard`);
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            setError(
              "Your session has expired. Please log in again to save your favorite movie.",
            );
            break;
          case 403:
            setError(
              "You don't have permission to change this favorite movie preference.",
            );
            break;
          case 404:
            setError(
              "We couldn't find your user account to save your favorite movie.",
            );
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
      setIsSubmitting(false);
    }
  };

  // Get the display movies and ensure no duplicates
  const displayMovies = isSearching ? searchResults : genreMovies;

  return (
    <div className="space-y-6">
      {/* Error and success messages */}
      {error && <ErrorMessage message={error} onClose={() => setError("")} />}
      {showSuccessMessage && (
        <ActionMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onHide={() => setShowSuccessMessage(false)}
          className="bg-green-500 text-white"
        />
      )}

      {/* No movies warning */}
      {genreMovies.length === 0 && !isLoading && !error && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-orange-500 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p>
              No movies found for your selected genre. Please go back and select
              a different genre.
            </p>
          </div>
        </div>
      )}

      {/* Customized search bar - keep existing component but with styling enhancements */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-[#b9c0de]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            >
            </path>
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-10 py-3 bg-[#ebefff]/50 border border-[#b9c0de]/30 rounded-xl text-[#3b3e88] placeholder-[#b9c0de] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Search for movie titles..."
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#b9c0de] hover:text-[#3b3e88]"
            onClick={clearSearch}
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
          </div>
          <p className="text-[#3b3e88] mt-4">
            Finding the perfect movies for you...
          </p>
        </div>
      )}

      {/* Movie List - keep functionality but style the container */}
      {!isLoading && (
        <div className="bg-[#ebefff]/30 rounded-xl p-4 shadow-inner overflow-x-auto">
          <MovieListHorizontal
            movies={displayMovies}
            onMovieClick={toggleMovie}
            emptyMessage={`No movies match your "${selectedGenres}" genre`}
            noResultsMessage="No movies match your search"
            hasOuterContainer={false}
            selectedMovieIds={selectedMovies.map((m) => m.movieId)}
          />
        </div>
      )}

      {/* Selected Movie Info */}
      {selectedMovies.length > 0
        ? (
          <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-400/20 to-rose-500/20 rounded-xl p-3">
            <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 shadow-sm">
              {selectedMovies[0].posterURL && (
                <img
                  src={selectedMovies[0].posterURL}
                  alt={selectedMovies[0].title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="font-medium text-[#3b3e88]">
              You selected: {selectedMovies[0].title}
            </p>
          </div>
        )
        : (
          <p className="text-center text-[#b9c0de] italic">
            Select a movie to continue
          </p>
        )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/genre_favorites")}
          className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-xl"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isSubmitting || selectedMovies.length === 0}
          className="bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200"
        >
          {isSubmitting
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

export default MovieFavorites;
