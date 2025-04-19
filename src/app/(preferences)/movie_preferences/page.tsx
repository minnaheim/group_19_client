"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import SearchBar from "@/components/ui/search_bar";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState<string>("");
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();
  const { selectedGenres, favoriteMovieId, setFavoriteMovieId } = usePreferences();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: token } = useLocalStorage<string>("token", "");

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
      } catch (err) {
        // Log error for debugging if needed
        if (err instanceof Error) {
          setError(err.message);
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
      } catch (err) {
        console.error("Search failed:", err);
        if (err instanceof Error) {
          setError(`Search failed: ${err.message}`);
        } else {
          setError("Failed to search movies");
        }
        setSearchResults([]);
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
      }
      router.push(`/users/${effectiveUserId}/profile`);
    } catch (err) {
      // Log error for debugging if needed

      if (err instanceof Error) {
        if (err.message.includes("400") && err.message.includes("not unique")) {
          setError("Error: The user account doesn't seem to be properly registered. Please log out and try registering again.");
        } else if (err.message.includes("409")) {
          router.push(`/users/${effectiveUserId}/profile`);
          return;
        } else {
          setError(`Error: ${err.message}`);
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
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
        )}

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