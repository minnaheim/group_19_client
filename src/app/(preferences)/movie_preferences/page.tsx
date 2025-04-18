"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import SearchBar from "@/components/ui/search_bar";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { usePreferences } from "@/app/context/PreferencesContext";

const MoviePreferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();
  const { selectedGenre } = usePreferences();

  // Fetch movies based on selected genre
  // Fetch movies based on selected genre
  useEffect(() => {
    const fetchMoviesByGenre = async () => {
      setIsLoading(true);
      try {
        if (selectedGenre) {
          // Pass genreList as a query parameter in the URL
          const response = await apiService.get<Movie[]>(
            `/movies?genreList=${encodeURIComponent(selectedGenre)}`
          );
          setGenreMovies(response);
        } else {
          // If no genre is selected, fetch all movies or handle accordingly
          const response = await apiService.get<Movie[]>("/movies");
          setGenreMovies(response);
        }
      } catch (error) {
        console.error("Failed to fetch movies by genre:", error);
        alert("An error occurred while fetching movies. Please try again.");
        setGenreMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesByGenre();
  }, [selectedGenre, apiService]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const query = searchQuery.toLowerCase().trim();
    const filtered = genreMovies.filter((movie) => {
      if (searchCategory === "title" || searchCategory === "all") {
        if (movie.title.toLowerCase().includes(query)) return true;
      }

      if (searchCategory === "genre" || searchCategory === "all") {
        if (movie.genres.some((g) => g.toLowerCase().includes(query))) {
          return true;
        }
      }

      return false;
    });

    setSearchResults(filtered);
  }, [searchQuery, searchCategory, genreMovies]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchCategory(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchCategory("all");
    setIsSearching(false);
    setSearchResults([]);
  };

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies((prev) => {
      if (prev.some((m) => m.movieId === movie.movieId)) {
        return prev.filter((m) => m.movieId !== movie.movieId);
      } else {
        if (prev.length >= 1) {
          alert("You can only select one favorite movie");
          return prev;
        }
        return [...prev, movie];
      }
    });
  };

  const handleNext = async () => {
    if (selectedMovies.length === 0) {
      alert("Please select a movie before proceeding.");
      return;
    }

    try {
      // Send the selected movie to the backend
      await apiService.post(`/preferences/${id}`, {
        userId: id,
        favoriteMovies: selectedMovies.map((movie) => movie.title), // Send movie titles
      });

      // Navigate to the profile page
      router.push(`/users/${id}/profile`);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert(
        "An error occurred while saving your preferences. Please try again."
      );
    }
  };

  const displayMovies = isSearching ? searchResults : genreMovies;

  return (
    <div>
      {/* Subheading with selected genre */}
      <h3 className="text-center text-[#3C3F88] mb-6">
        {selectedGenre
          ? `Based on your selected "${selectedGenre}" genre, select one favorite movie!`
          : "Select one favorite movie!"}
      </h3>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        searchCategory={searchCategory}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onClearSearch={clearSearch}
        placeholder="Search for movies..."
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
            emptyMessage={`No movies match your "${selectedGenre}" genre`}
            noResultsMessage="No movies match your search"
            hasOuterContainer={false}
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
