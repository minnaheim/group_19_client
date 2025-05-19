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
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/search_bar";
import MovieList from "@/components/ui/movie_list";
import MovieDetailsModal from "@/components/ui/movie_details";
import ActionMessage from "@/components/ui/action_message";
import ConfirmationDialog from "@/components/ui/confirmation_dialog";
import { retry } from "src/utils/retry";

const WatchList: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger re-fetch

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
  const [actionError, setActionError] = useState<string | null>(null);

  // confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [confirmDialogMovie, setConfirmDialogMovie] = useState<Movie | null>(
    null
  );

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // Fetch user data - now also depends on refreshTrigger
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        setLoading(false);
        setUser(null);
        // Optionally set an error if ID is crucial and missing
        // setError("User ID missing from URL.");
        return;
      }

      setLoading(true);
      try {
        console.log(
          `Watchlist (trigger: ${refreshTrigger}): Fetching user data for ID: ${id}`
        ); // Diagnostic log
        const userData = await retry(() =>
          apiService.get(`/users/${id}/profile`)
        );
        setUser(userData as User);
        setError(null); // Clear previous errors on success
      } catch (error: unknown) {
        console.error("Watchlist: Error loading user data:", error); // Diagnostic log
        setUser(null); // Clear user data on error
        if (
          error instanceof Error &&
          "status" in error &&
          (error as ApplicationError).status === 404
        ) {
          setError("Oops! We couldn't find your profile details.");
        } else {
          setError("Failed to load user data. Please try again. Redirecting to login page...");
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          setTimeout(() => {
          router.push("/login");
        }, 1500);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, token, apiService, refreshTrigger]); // Added refreshTrigger to dependencies

  // Re-fetch data when the window gains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("Watchlist page focused, triggering data refresh."); // Diagnostic log
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // Empty dependency array, so it sets up and cleans up once

  // Filter movies based on search query - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setFilteredMovies(user?.watchlist || []);
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
      setActionError("You can only edit your own movie lists!");
    }
  };

  const handleEdit = () => {
    if (userId === id) {
      setIsEditing(true);
      setSearchQuery("");
      setIsSearching(false);
    } else {
      setActionError("You can only edit your own movie lists!");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleDirectRemoveFromWatchlist = async (movieToRemove: Movie) => {
    if (userId !== id) {
      setActionError("You can only edit your own watchlist!");
      return;
    }
    try {
      await apiService.delete(
        `/users/${userId}/watchlist/${movieToRemove.movieId}`
      );
      setUser((prevUser) => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          watchlist: prevUser.watchlist.filter(
            (movie) => movie.movieId !== movieToRemove.movieId
          ),
        };
      });
      if (isSearching) {
        setFilteredMovies((prevFiltered) =>
          prevFiltered.filter(
            (movie) => movie.movieId !== movieToRemove.movieId
          )
        );
      }
      showMessage(`'${movieToRemove.title}' removed from watchlist.`);
    } catch (error) {
      console.error("Failed to remove movie from watchlist:", error);
      setActionError("Error removing movie from watchlist. Please try again.");
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

  const isInSeenList = (movie: Movie): boolean => {
    return !!user?.watchedMovies?.find((m) => m.movieId === movie.movieId);
  };

  const handleMarkAsSeen = async (movie: Movie) => {
    if (userId !== id) {
      setActionError("You can only modify your own lists!");
      return;
    }

    const movieIsInWatchlist = user?.watchlist.some(
      (m) => m.movieId === movie.movieId
    );

    // If the movie is in the watchlist, show confirmation dialog
    if (movieIsInWatchlist) {
      setConfirmDialogMovie(movie);
      setShowConfirmDialog(true);
    } else {
      // Not in watchlist, just mark as seen
      try {
        // Not in watchlist, just mark as seen with default parameter
        await apiService.post(`/users/${userId}/watched/${movie.movieId}`, {});

        updateUserAfterMarkAsSeen(movie, false, false);
        showMessage(`'${movie.title}' marked as seen.`);
        closeModal();
      } catch (error) {
        console.error("Failed to mark movie as seen:", error);
        setActionError("Error marking movie as seen. Please try again.");
      }
    }
  };

  // Handle confirmation dialog responses
  const handleKeepInWatchlist = async () => {
    if (!confirmDialogMovie) return;

    try {
      await completeMarkAsSeen(confirmDialogMovie, true);
    } catch (error) {
      console.error("Failed to mark movie as seen:", error);
      setActionError("Error marking movie as seen. Please try again.");
    } finally {
      setShowConfirmDialog(false);
      setConfirmDialogMovie(null);
    }
  };

  const handleRemoveFromWatchlistAfterSeen = async () => {
    if (!confirmDialogMovie) return;

    try {
      await completeMarkAsSeen(confirmDialogMovie, false);
    } catch (error) {
      console.error("Failed to mark movie as seen:", error);
      setActionError("Error marking movie as seen. Please try again.");
    } finally {
      setShowConfirmDialog(false);
      setConfirmDialogMovie(null);
    }
  };

  const completeMarkAsSeen = async (movie: Movie, keepInWatchlist: boolean) => {
    // Pass the keepInWatchlist parameter to the API
    await apiService.post(
      `/users/${userId}/watched/${movie.movieId}?keepInWatchlist=${keepInWatchlist}`,
      {}
    );

    // Update local state and show message
    updateUserAfterMarkAsSeen(movie, true, keepInWatchlist);

    if (keepInWatchlist) {
      showMessage(`'${movie.title}' marked as seen and kept in watchlist.`);
    } else {
      showMessage(
        `'${movie.title}' marked as seen and removed from watchlist.`
      );
    }
    closeModal();
  };

  const updateUserAfterMarkAsSeen = (
    movie: Movie,
    movieIsInWatchlist: boolean,
    keepInWatchlist: boolean
  ) => {
    try {
      // Update local state to reflect the changes that happened on the server
      setUser((prevUser) => {
        if (!prevUser) return null;

        // Add to watched movies if not already there
        const alreadyWatched = prevUser.watchedMovies.some(
          (m) => m.movieId === movie.movieId
        );
        const updatedWatchedMovies = alreadyWatched
          ? prevUser.watchedMovies
          : [...prevUser.watchedMovies, movie];

        // If we chose not to keep in watchlist, update local watchlist state
        let updatedWatchlist = prevUser.watchlist;
        if (movieIsInWatchlist && !keepInWatchlist) {
          updatedWatchlist = prevUser.watchlist.filter(
            (m) => m.movieId !== movie.movieId
          );

          // Also update filtered movies if searching
          if (isSearching) {
            setFilteredMovies((prevFiltered) =>
              prevFiltered.filter((m) => m.movieId !== movie.movieId)
            );
          }
        }

        return {
          ...prevUser,
          watchlist: updatedWatchlist,
          watchedMovies: updatedWatchedMovies,
        };
      });
    } catch (error) {
      console.error("Failed to mark movie as seen:", error);
      setActionError("Error marking movie as seen. Please try again.");
    }
  };

  const handleRemoveFromWatchlist = async (movie: Movie) => {
    await handleDirectRemoveFromWatchlist(movie);
    closeModal();
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setActionError(null);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }

  const displayMovies = isSearching ? filteredMovies : user?.watchlist || [];

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
          <p className="text-[#3b3e88]/60 mt-2">
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
          onMovieClick={handleMovieClick}
          onCardRemoveClick={handleDirectRemoveFromWatchlist}
          onAddMovieClick={handleAddMovie}
          onClearSearch={clearSearch}
          emptyMessage="Your watchlist is empty"
          noResultsMessage="None of the movies on your watchlist match your search"
          isInSeenListFn={isInSeenList}
        />

        {/* Search Results Summary */}
        {searchQuery && !isEditing && displayMovies.length > 0 && (
          <div className="mt-4 text-[#3b3e88]">
            Found {displayMovies.length} movies matching &#34;{searchQuery}&#34;
            in title
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          {/* Back button on the left */}
          <Button
            variant="destructive"
            className="order-1 sm:order-none"
            onClick={() => router.push(`/users/${id}/dashboard`)}
          >
            Back to Dashboard
          </Button>
          {/* Edit/Done Editing button on the right */}
          {isEditing ? (
            <Button
              variant="secondary"
              className="order-2 sm:order-none"
              onClick={handleCancelEdit}
            >
              Done Editing
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="order-2 sm:order-none"
              onClick={handleEdit}
            >
              Edit Watchlist
            </Button>
          )}
        </div>

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
          className="bg-green-500"
        />

        {/* Confirmation Dialog */}
        {confirmDialogMovie && (
          <ConfirmationDialog
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            onConfirm={handleKeepInWatchlist}
            onCancel={handleRemoveFromWatchlistAfterSeen}
            title={`Mark '${confirmDialogMovie?.title}' as seen:`}
            message={`Do you want to keep '${confirmDialogMovie?.title}' in your watchlist?`}
            confirmText="Yes, I want to watch it again"
            cancelText="No, I won't watch it again"
          />
        )}
      </div>
    </div>
  );
};

export default WatchList;
