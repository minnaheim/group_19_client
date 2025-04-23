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
import { retry } from 'src/utils/retry';

const WatchList: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedMoviesToRemove, setSelectedMoviesToRemove] = useState<
      number[]
  >([]);

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

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");


  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Try to get the user data from the profile endpoint
        try {
          const userData = await retry(() => apiService.get(`/users/${id}/profile`));
          setUser(userData as User);
        } catch (apiError) {
          console.log("API error, using mock data:", apiError);

        }
        setLoading(false);
      } catch (error) {
        setError("Failed to load user data");
        if (error instanceof Error && "status" in error) {
          const applicationError = error as ApplicationError;
          alert(`Error: ${applicationError.message}`);
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, token, apiService]);

  // Filter movies based on search query - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const movies = user?.watchlist || [];
    const query = searchQuery.toLowerCase().trim();

    const filtered = movies.filter((movie) =>
        movie.title.toLowerCase().includes(query)
    );

    setFilteredMovies(filtered);
  }, [searchQuery, user?.watchlist]);

  const handleAddMovie = () => {
    if (userId === id) {
      router.push(`/users/${id}/movie_search`);
    } else {
      showMessage("You can only edit your own movie lists!");
    }
  };

  const handleEdit = () => {
    if (userId === id) {
      setIsEditing(true);
      setSearchQuery("");
      setIsSearching(false);
    } else {
      showMessage("You can only edit your own movie lists!");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedMoviesToRemove([]);
  };

  const handleMovieSelect = (movieId: number) => {
    if (selectedMoviesToRemove.includes(movieId)) {
      setSelectedMoviesToRemove(
          selectedMoviesToRemove.filter((id) => id !== movieId),
      );
    } else {
      setSelectedMoviesToRemove([...selectedMoviesToRemove, movieId]);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    // If in editing mode, select/deselect the movie
    if (isEditing) {
      handleMovieSelect(movie.movieId);
      return;
    }

    // Otherwise open the details modal
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Process each movie removal separately
      for (const movieId of selectedMoviesToRemove) {
        try {
          // Call the server API to remove the movie
          await apiService.delete(`/users/${id}/watchlist/${movieId}`, {});
        } catch (apiError) {
          console.error("Error removing movie from watchlist:", apiError);
        }
      }

      // After all removals, update local state
      if (user) {
        const updatedMovies = user.watchlist.filter(
            (movie) => !selectedMoviesToRemove.includes(movie.movieId),
        );

        setUser({
          ...user,
          watchlist: updatedMovies,
        });
      }

      showMessage(
          `Removed ${selectedMoviesToRemove.length} movie(s) from your watchlist`,
      );
      setIsEditing(false);
      setSelectedMoviesToRemove([]);
    } catch (error) {
      setError("Failed to update movie list");
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        showMessage(`Error: ${applicationError.message}`);
      }
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
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const isInSeenList = (movie: Movie) => {
    return user?.watchedMovies.some((m) => m.movieId === movie.movieId) ||
        false;
  };

  const handleMarkAsSeen = async (movie: Movie) => {
    if (isInSeenList(movie)) {
      showMessage("Movie already in your seen list");
      return;
    }

    try {
      await apiService.post(`/users/${id}/watchlist/${movie.movieId}`, {});

      // Update local state for now
      if (user) {
        setUser({
          ...user,
          watchedMovies: [...user.watchedMovies, movie],
          watchlist: user.watchlist.filter((m) => m.movieId !== movie.movieId),
        });
      }

      showMessage("Moved to your seen list");
    } catch (error) {
      setError("Failed to mark movie as seen");
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        showMessage(`Error: ${applicationError.message}`);
      }
    }
  };

  const handleRemoveFromWatchlist = (movie: Movie) => {
    setIsEditing(true);
    setSelectedMoviesToRemove([movie.movieId]);
    closeModal();
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
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
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  // Determine which movies to display
  const displayMovies = isSearching ? filteredMovies : (user?.watchlist || []);

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
        {/* Sidebar */}
        <Navigation userId={userId} activeItem="Watch List" />

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              Your Watchlist
            </h1>
            <p className="text-[#b9c0de] mt-2">
              Movies you want to watch in the future
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
              selectedMovieIds={selectedMoviesToRemove}
              onMovieClick={handleMovieClick}
              onMovieSelect={handleMovieSelect}
              onAddMovieClick={handleAddMovie}
              onClearSearch={clearSearch}
              emptyMessage="Your watchlist is empty"
              noResultsMessage="None of the movies on your watchlist match your search"
              isInSeenListFn={isInSeenList}
          />

          {/* Search Results Summary */}
          {searchQuery && !isEditing && displayMovies.length > 0 && (
              <div className="mt-4 text-[#3b3e88]">
                Found {displayMovies.length}{" "}
                movies matching &#34;{searchQuery}&#34; in title
              </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            {isEditing
                ? (
                    <>
                      <Button variant="destructive" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                          variant="secondary"
                          onClick={handleSaveChanges}
                          disabled={selectedMoviesToRemove.length === 0}
                      >
                        Remove {selectedMoviesToRemove.length} movie(s)
                      </Button>
                    </>
                )
                : (
                    <Button variant="secondary" onClick={handleEdit}>
                      Edit
                    </Button>
                )}
          </div>

          {/* Back button */}
          <Button
              variant="destructive"
              className="mt-4"
              onClick={() => router.push(`/users/${id}/dashboard`)}
          >
            Back to Dashboard
          </Button>

          {/* Movie Details Modal */}
          {selectedMovie && (
              <MovieDetailsModal
                  movie={selectedMovie}
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  isInWatchlist={true}
                  isInSeenList={isInSeenList(selectedMovie)}
                  onMarkAsSeen={handleMarkAsSeen}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
              />
          )}

          {/* Action Message */}
          <ActionMessage
              message={actionMessage}
              isVisible={showActionMessage}
              onHide={() => setShowActionMessage(false)}
          />
        </div>
      </div>
  );
};

export default WatchList;