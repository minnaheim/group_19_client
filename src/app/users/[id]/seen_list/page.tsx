"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { ApplicationError } from "@/app/types/error";
import SearchBar from "@/components/ui/search_bar";
import MovieList from "@/components/ui/movie_list";
import MovieDetailsModal from "@/components/ui/movie_details";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { retry } from "@/utils/retry"; // Assuming retry is in utils, adjust if needed

const SeenList: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // selectedMoviesToRemove state is removed

  // search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // movie inspection
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null); // Added state for action errors

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // fetch user
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const userData = await retry(() =>
          apiService.get(`/users/${id}/profile`)
        );
        setUser(userData as User);
        // showMessage("User profile loaded"); // Optional
      } catch (error: unknown) {
        if (
          error instanceof Error && "status" in error &&
          (error as ApplicationError).status === 404
        ) {
          setError("Oops! We couldn't find your profile details.");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, token, apiService]); // Removed showMessage from dependencies

  // filter movies based on search query - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setFilteredMovies(user?.watchedMovies || []);
      return;
    }

    setIsSearching(true);
    const movies = user?.watchedMovies || [];
    const query = searchQuery.toLowerCase().trim();

    const filtered = movies.filter((movie) =>
      movie.title.toLowerCase().includes(query)
    );

    setFilteredMovies(filtered);
  }, [searchQuery, user?.watchedMovies]);

  const handleAddMovie = () => {
    if (userId === id) {
      router.push(`/users/${id}/movie_search`);
    } else {
      setActionError("You can only edit your own movie lists!"); // Changed to setActionError
    }
  };

  const handleEdit = () => {
    if (userId === id) {
      setIsEditing(true);
      setSearchQuery("");
      setIsSearching(false);
    } else {
      setActionError("You can only edit your own movie lists!"); // Changed to setActionError
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // handleMovieSelect function is removed

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  // handleSaveChanges function is removed

  // New function for direct removal from MovieCard or Modal
  const handleDirectRemoveFromSeenList = async (movieToRemove: Movie) => {
    if (userId !== id) {
      setActionError("You can only edit your own seen list!"); // Changed to setActionError
      return;
    }
    try {
      // Corrected API endpoint
      await apiService.delete(
        `/users/${userId}/watched/${movieToRemove.movieId}`,
      );
      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          watchedMovies: prevUser.watchedMovies?.filter(
            (movie) => movie.movieId !== movieToRemove.movieId,
          ) || [],
        };
      });
      // Update filteredMovies as well if currently searching
      if (isSearching) {
        setFilteredMovies((prevFiltered) =>
          prevFiltered.filter((movie) =>
            movie.movieId !== movieToRemove.movieId
          )
        );
      }
      showMessage(
        `Successfully removed '${movieToRemove.title}' from seen list.`,
      ); // Success message
    } catch (error) {
      console.error("Failed to remove movie from seen list:", error);
      setActionError("Error removing movie from seen list. Please try again."); // Changed to setActionError
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setIsModalOpen(false);
  };

  const handleRemoveFromSeenlist = async (movie: Movie) => {
    // This function is called from the modal
    await handleDirectRemoveFromSeenList(movie);
    closeModal(); // Close modal after action
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setActionError(null); // Clear any previous error when a success message is shown
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }

  // Determine which movies to display
  const displayMovies = isSearching
    ? filteredMovies
    : (user?.watchedMovies || []);

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      {/* Sidebar */}
      <Navigation userId={userId} activeItem="Seen List" />{" "}
      {/* Corrected activeItem */}
      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            Already Seen
          </h1>
          <p className="text-[#b9c0de] mt-2">
            These movies will not be recommended to you in groups.
          </p>
        </div>

        {/* Search bar component - simplified version */}
        {!isEditing && (
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={clearSearch}
            placeholder="Search for movie titles..."
            className="mb-6"
          />
        )}

        {/* Movie list component */}
        <MovieList
          movies={displayMovies}
          isLoading={loading}
          isEditing={isEditing}
          isSearching={isSearching}
          // selectedMovieIds prop removed
          onMovieClick={handleMovieClick}
          // onMovieSelect prop removed
          onCardRemoveClick={handleDirectRemoveFromSeenList} // New prop for card remove button
          onAddMovieClick={handleAddMovie} // Retain if you want an "Add more to Seen List" type button (e.g. from search)
          onClearSearch={clearSearch}
          emptyMessage="Your seen list is empty"
          noResultsMessage="None of the movies on your seen list match your search"
        />

        {/* Search Results Summary */}
        {searchQuery && !isEditing && displayMovies.length > 0 && (
          <div className="mt-4 text-[#3b3e88]">
            Found {displayMovies.length}{" "}
            movies matching &#34;{searchQuery}&#34; in title
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          {/* Changed justify-between to justify-end */}
          {isEditing
            ? (
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Done Editing
              </Button>
              // Removed the bulk "Remove X movie(s)" button
            )
            : (
              <Button
                variant="secondary"
                onClick={handleEdit}
              >
                Edit Seen List
              </Button>
            )}
        </div>

        {/* Back button */}
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => router.push(`/users/${id}/profile`)}
        >
          Back to Profile Page
        </Button>

        {/* Display Action Error Message */}
        {actionError && (
          <ErrorMessage
            message={actionError}
            onClose={() => setActionError(null)}
          />
        )}

        {/* Movie Details Modal */}
        {selectedMovie && (
          <MovieDetailsModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={closeModal}
            isInSeenList={true} // Simplified: if it's in selectedMovie, it's from the seen list on this page
            onRemoveFromSeenList={handleRemoveFromSeenlist} // This now calls the direct removal logic
          />
        )}

        {/* Action Message */}
        <ActionMessage
          message={actionMessage}
          isVisible={showActionMessage}
          onHide={() => setShowActionMessage(false)}
          className="bg-green-500"
        />
      </div>
    </div>
  );
};

export default SeenList;
