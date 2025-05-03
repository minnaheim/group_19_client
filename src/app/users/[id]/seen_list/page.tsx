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
import { retry } from "@/utils/retry";

const SeenList: React.FC = () => {
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
        showMessage("User profile loaded");
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

  // filter movies based on search query - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
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
    // if in editing mode, select/deselect the movie
    if (isEditing) {
      handleMovieSelect(movie.movieId);
      return;
    }

    // else open the details modal
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    for (const movieId of selectedMoviesToRemove) {
      try {
        await apiService.delete(`/users/${id}/watched/${movieId}`, {});
        showMessage("Movie removed from watched list");
      } catch (error: unknown) {
        if (error instanceof Error && "status" in error) {
          const status = (error as ApplicationError).status;
          switch (status) {
            case 401:
              showMessage(
                "Please log in again to remove movies from your watched list.",
              );
              break;
            case 403:
              showMessage(
                "You don't have permission to modify this watched list.",
              );
              break;
            case 404:
              showMessage(
                "Could not find the user, movie, or watched list entry.",
              );
              break;
            default:
              showMessage("Failed to remove movie from watched list.");
          }
        } else {
          showMessage("Failed to remove movie from watched list.");
        }
      }
    }
    const updatedMovies = user.watchedMovies.filter(
      (movie) => !selectedMoviesToRemove.includes(movie.movieId),
    );
    setUser({ ...user, watchedMovies: updatedMovies });
    setIsEditing(false);
    setSelectedMoviesToRemove([]);
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

  const handleRemoveFromSeenlist = (movie: Movie) => {
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
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }

  // Determine which movies to display
  const displayMovies = isSearching
    ? filteredMovies
    : (user?.watchedMovies || []);

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      {/* Sidebar */}
      <Navigation userId={userId} activeItem="Profile Page" />
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            Already Seen
          </h1>
          <p className="text-[#b9c0de] mt-2">
            these movies will not be recommended to you
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
        <div className="mt-8 flex justify-between">
          {isEditing
            ? (
              <>
                <Button
                  variant="destructive"
                  onClick={handleCancelEdit}
                >
                  cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSaveChanges}
                  disabled={selectedMoviesToRemove.length === 0}
                >
                  remove {selectedMoviesToRemove.length} movie(s)
                </Button>
              </>
            )
            : (
              <Button
                variant="secondary"
                onClick={handleEdit}
              >
                edit
              </Button>
            )}
        </div>

        {/* Back button */}
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => router.push(`/users/${id}/profile`)}
        >
          back to profile page
        </Button>

        {/* Movie Details Modal */}
        {selectedMovie && (
          <MovieDetailsModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={closeModal}
            isInSeenList={true}
            onRemoveFromSeenList={handleRemoveFromSeenlist}
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
