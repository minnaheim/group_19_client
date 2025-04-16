"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import SearchBar from "@/components/ui/search_bar";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

const MoviePreferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const apiService = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre"); // Extract the genre from query parameters

  // Fetch movies based on the selected genre from the backend
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await apiService.get<Movie[]>(
          // TODO: get genre
          `/movies?genreList=${genre}`
        );
        setMovies(response); // Store the movies in state
      } catch (error) {
        console.error("Failed to fetch movies based on genre:", error);
        alert(
          "An error occurred while fetching movies based on genre. Please try again."
        );
      }
    };

    if (genre) {
      fetchMovies();
    }
  }, [apiService, genre]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const query = searchQuery.toLowerCase().trim();
    const filtered = movies.filter((movie) => {
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
  }, [searchQuery, searchCategory, movies]);

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

  const displayMovies = isSearching ? searchResults : movies;

  return (
    <div>
      {/* Subheading */}
      <h3 className="text-center text-[#3C3F88] mb-6">
        Based on the previous genre you have selected, select one favorite
        movie!
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

      {/* Movie List */}
      <div className="overflow-x-auto">
        <MovieListHorizontal
          movies={displayMovies}
          onMovieClick={toggleMovie}
          emptyMessage="No movies match your genre"
          noResultsMessage="No movies match your search"
          hasOuterContainer={false}
        />
      </div>

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
