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
import { retry } from "src/utils/retry";

const WatchList: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const userData = await retry(() =>
          apiService.get(`/users/${id}/profile`)
        );
        setUser(userData as User);
      } catch (error: unknown) {
        if (
          error instanceof Error && "status" in error &&
          (error as ApplicationError).status === 404
        ) {
          showMessage("Oops! We couldn't find your profile details.");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, token, apiService]);

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
      await apiService.delete(`/users/${userId}/watchlist/${movieToRemove.movieId}`);
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
          prevFiltered.filter((movie) => movie.movieId !== movieToRemove.movieId)
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
    try {
      await apiService.post(`/users/${userId}/watchedMovies`, {
        movieId: movie.movieId,
      });
      await apiService.delete(`/users/${userId}/watchlist/${movie.movieId}`);

      setUser((prevUser) => {
        if (!prevUser) return null;
        const updatedWatchlist = prevUser.watchlist.filter(
          (m) => m.movieId !== movie.movieId
        );
        const updatedWatchedMovies = prevUser.watchedMovies ? [...prevUser.watchedMovies, movie] : [movie];
        
        return {
          ...prevUser,
          watchlist: updatedWatchlist,
          watchedMovies: updatedWatchedMovies,
        };
      });
      if (isSearching) {
        setFilteredMovies((prevFiltered) => 
          prevFiltered.filter((m) => m.movieId !== movie.movieId)
        );
      }
      showMessage(`'${movie.title}' marked as seen and removed from watchlist.`);
      closeModal();
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }

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
            Found {displayMovies.length}{" "}
            movies matching &#34;{searchQuery}&#34; in title
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          {isEditing
            ? (
              <Button variant="secondary" onClick={handleCancelEdit}>
                Done Editing
              </Button>
            )
            : (
              <Button variant="secondary" onClick={handleEdit}>
                Edit Watchlist
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

        {/* Display Action Error Message */}
        {actionError && (
          <ErrorMessage message={actionError} onClose={() => setActionError(null)} />
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
      </div>
    </div>
  );
};

export default WatchList;
