"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import SearchBar from "@/components/ui/search_bar";
import ErrorMessage from "@/components/ui/ErrorMessage";
import type { ApplicationError } from "@/app/types/error";
import { Button } from "@/components/ui/button";
import ActionMessage from "@/components/ui/action_message";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { usePreferences } from "@/app/context/PreferencesContext";
import useLocalStorage from "@/app/hooks/useLocalStorage";

// Helper function to remove duplicate movies by movieId
const removeDuplicateMovies = (movies: Movie[]): Movie[] => {
  const uniqueMovies = new Map<number, Movie>();

  movies.forEach(movie => {
    if (!uniqueMovies.has(movie.movieId)) {
      uniqueMovies.set(movie.movieId, movie);
    }
  });

  return Array.from(uniqueMovies.values());
};

const MoviePreferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>(""); // error for all contexts
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();
  const { selectedGenres, favoriteMovieId, setFavoriteMovieId } = usePreferences();
  const { value: userId } = useLocalStorage<string>("userId", "");
  //const { value: token } = useLocalStorage<string>("token", "");

  // Fetch movies based on selected genres
  useEffect(() => {
    const fetchMoviesByGenres = async () => {
      setIsLoading(true);
      try {
        if (selectedGenres && selectedGenres.length > 0) {
          // Join selected genres for query
          const genresParam = selectedGenres.map(encodeURIComponent).join(",");
          const response = await apiService.get<Movie[]>(
            `/movies?genres=${genresParam}`
          );
          // Remove duplicates before setting state
          setGenreMovies(removeDuplicateMovies(response));
        } else {
          // If no genres are selected, show recent movies
          const currentYear = new Date().getFullYear();
          const response = await apiService.get<Movie[]>(`/movies?year=${currentYear}`);
          // Remove duplicates before setting state
          setGenreMovies(removeDuplicateMovies(response));
        }
      } catch (err: unknown) {
        // Map errors for movie fetch by genres or recent fetch
        if (err instanceof Error && 'status' in err) {
          const appErr = err as ApplicationError;
          if (selectedGenres && selectedGenres.length > 0) {
            // fetching by genres
            if (appErr.status === 400) {
              setError("We couldn't find movies for the selected genres. Try different genres.");
            } else {
              setError("An error occurred while fetching movies. Please try again.");
            }
          } else {
            // fetching recent movies
            if (appErr.status === 400) {
              setError("We couldn't fetch recent movies at this time.");
            } else {
              setError("An error occurred while fetching movies. Please try again.");
            }
          }
        } else {
          setError("An error occurred while fetching movies. Please try again.");
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
        if (err instanceof Error && 'status' in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 400) {
            setError("No movies found matching your search term. Try searching for something else.");
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
    const effectiveUserId = userId || id;

    try {
      if (favoriteMovieId !== null) {
        await apiService.saveFavoriteMovie(Number(effectiveUserId), favoriteMovieId);
        setSuccessMessage("Favorite movie saved successfully");
        setShowSuccessMessage(true);
      }
      router.push(`/users/${effectiveUserId}/dashboard`);
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            setError("Your session has expired. Please log in again to save your favorite movie.");
            break;
          case 403:
            setError("You don't have permission to change this favorite movie preference.");
            break;
          case 404:
            setError("We couldn't find your user account to save your favorite movie.");
            break;
          default:
            setError("An error occurred while saving your preferences. Please try again.");
        }
      } else {
        setError("An error occurred while saving your preferences. Please try again.");
      }
    }
  };

  // Get the display movies and ensure no duplicates
  const displayMovies = isSearching ? searchResults : genreMovies;

  return (
    <div>
      {/* Subheading with selected genres */}
      <h3 className="text-center text-[#3C3F88] mb-6">
        {selectedGenres && selectedGenres.length > 0
          ? `Based on your selected genres (${selectedGenres.join(", ")}), select your favorite movie!`
          : "Select your favorite movie!"}
      </h3>

        {/* Error display */}
        <ErrorMessage message={error} onClose={() => setError("")} />
        <ActionMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onHide={() => setShowSuccessMessage(false)}
          className="bg-green-500"
        />
        {genreMovies.length === 0 && !isLoading && !error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
              <p>No movies found for your selected genre. Please go back and select a different genre.</p>
            </div>
        )}

        {/* Search Bar - simplified version */}
        <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={clearSearch}
            placeholder="Search for movie titles..."
            className="mb-6"
        />

        {/* Loading State */}
        {isLoading && (
            <div className="text-center py-8">
              <p className="text-[#3C3F88]">Loading movies...</p>
            </div>
        )}

        {/* Movie List */}
        {!isLoading && (
            <div className="overflow-x-auto">
              <MovieListHorizontal
                  movies={displayMovies}
                  onMovieClick={toggleMovie}
                  emptyMessage={`No movies match your "${selectedGenres}" genre`}
                  noResultsMessage="No movies match your search"
                  hasOuterContainer={false}
                  selectedMovieIds={selectedMovies.map(m => m.movieId)}
              />
            </div>
        )}

        {/* Selected Movie Info */}
        <p className="text-center mt-4 text-sm text-[#3C3F88]">
          {selectedMovies.length > 0
              ? `You selected: ${selectedMovies[0].title}`
              : "No movie selected"}
        </p>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <Button
              variant="destructive"
              onClick={() => router.push("/genre_preferences")}
          >
            Back
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </div>
  );
};

export default MoviePreferences;