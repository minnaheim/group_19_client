"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import MovieDetailsModal from "@/components/ui/movie_details";
import MovieList from "@/components/ui/movie_list";
import SearchBar from "@/components/ui/search_bar";
import { retry } from "src/utils/retry";
import { ApplicationError } from "@/app/types/error";

const FriendWatchlist: React.FC = () => {
  const { friendId } = useParams();
  const apiService = useApi();
  const router = useRouter();

  // State
  const [friend, setFriend] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Movie details modal state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // Adding movie state (from search movies page)
  const [isAddingMovie, setIsAddingMovie] = useState<boolean>(false);

  const { value: userId } = useLocalStorage<string>("userId", "");

  // Fetch friend data and their watchlist
  useEffect(() => {
    const fetchData = async () => {
      if (!friendId || !userId) return;

      setLoading(true);
      setError(null);

      try {
        // First, let's get the friend's information from the friends list
        const friendsList = await retry(() =>
            apiService.get<User[]>("/friends")
        );

        // Find the friend in the list
        const friendData = friendsList.find(friend => friend.userId === parseInt(friendId as string));

        if (!friendData) {
          setError("Friend not found in your friends list.");
          setLoading(false);
          return;
        }

        // Fetch friend's watchlist - this endpoint should be accessible for friends
        const friendWatchlist = await retry(() =>
            apiService.get<Movie[]>(`/users/${friendId}/watchlist`)
        );

        // Fetch current user's lists
        const [userWatchlist, userWatched] = await Promise.all([
          retry(() => apiService.get<Movie[]>(`/users/${userId}/watchlist`)),
          retry(() => apiService.get<Movie[]>(`/users/${userId}/watched`))
        ]);

        setFriend(friendData);
        setWatchlist(friendWatchlist);
        setFilteredMovies(friendWatchlist);
        setCurrentUser({
          userId: parseInt(userId),
          username: "", // We don't need this for the current functionality
          watchlist: userWatchlist,
          watchedMovies: userWatched
        } as User);

      } catch (err: unknown) {
        console.error("Error fetching friend watchlist data:", err);
        if (err instanceof Error && "status" in err) {
          const status = (err as ApplicationError).status;
          if (status === 401) {
            setError("Your session has expired. Please log in again.");
          } else if (status === 403) {
            setError("You don't have permission to view this friend's watchlist.");
          } else if (status === 404) {
            setError("Friend or watchlist not found.");
          } else {
            setError("Failed to load friend's watchlist.");
          }
        } else {
          setError("Failed to load friend's watchlist.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [friendId, userId, apiService]);

  // Filter movies based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMovies(watchlist);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = watchlist.filter((movie) =>
        movie.title.toLowerCase().includes(query) ||
        (movie.genres && movie.genres.some(genre => genre.toLowerCase().includes(query)))
    );
    setFilteredMovies(filtered);
  }, [searchQuery, watchlist]);

  // Helper functions
  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  const isInWatchlist = (movie: Movie) => {
    return currentUser?.watchlist.some((m) => m.movieId === movie.movieId) || false;
  };

  const isInSeenList = (movie: Movie) => {
    return currentUser?.watchedMovies.some((m) => m.movieId === movie.movieId) || false;
  };

  // Movie actions
  const handleMovieClick = async (movie: Movie) => {
    try {
      const detailedMovie = await retry(() =>
          apiService.get<Movie>(`/movies/${movie.movieId}`)
      );
      setSelectedMovie(detailedMovie);
      setIsModalOpen(true);
    } catch (error: unknown) {
      console.error("Error fetching movie details:", error);
      showMessage("Error loading movie details");
      setSelectedMovie(movie); // Fall back to basic movie info
      setIsModalOpen(true);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (isAddingMovie || isInWatchlist(movie)) {
      if (isInWatchlist(movie)) {
        showMessage("Movie already in your watchlist");
      }
      return;
    }

    try {
      setIsAddingMovie(true);
      await apiService.post(`/users/${userId}/watchlist/${movie.movieId}`, {});

      // Update local state
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          watchlist: [...currentUser.watchlist, movie],
        });
      }

      showMessage("Added to your watchlist");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        switch (appErr.status) {
          case 401:
            showMessage("Please log in again to add movies to your watchlist.");
            break;
          case 403:
            showMessage("You don't have permission to modify this watchlist.");
            break;
          case 404:
            showMessage("Could not find the user or movie to add to the watchlist.");
            break;
          case 409:
            showMessage("This movie is already on your watchlist.");
            break;
          default:
            showMessage("Failed to add movie to watchlist.");
        }
      } else {
        showMessage("Failed to add movie to watchlist");
      }
    } finally {
      setIsAddingMovie(false);
    }
  };

  const handleAddToSeenList = async (movie: Movie) => {
    if (isAddingMovie || isInSeenList(movie)) {
      if (isInSeenList(movie)) {
        showMessage("Movie already in your seen list");
      }
      return;
    }

    try {
      setIsAddingMovie(true);
      await apiService.post(`/users/${userId}/watched/${movie.movieId}`, {});

      // Update local state
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          watchedMovies: [...currentUser.watchedMovies, movie],
        });
      }

      showMessage("Added to your watched list");
    } catch (error) {
      console.error("Error adding to seen list:", error);
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        switch (appErr.status) {
          case 401:
            showMessage("Please log in again to add movies to your watched list.");
            break;
          case 403:
            showMessage("You don't have permission to modify this watched list.");
            break;
          case 404:
            showMessage("Could not find the user or movie to add to the watched list.");
            break;
          case 409:
            showMessage("You've already marked this movie as watched.");
            break;
          default:
            showMessage("Failed to add movie to watched list.");
        }
      } else {
        showMessage("Failed to add movie to watched list");
      }
    } finally {
      setIsAddingMovie(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  // Loading state
  if (loading) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
          <Navigation userId={userId} activeItem="Your Friends" />
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </div>
        </div>
    );
  }

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        <Navigation userId={userId} activeItem="Your Friends" />

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto relative">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {friend?.username}&#39;s Watchlist
            </h1>
            <p className="text-[#b9c0de] mt-2">
              Browse movies your friend wants to watch
            </p>
          </div>

          {/* Friend Details Card */}
          {friend && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 mb-8 shadow-lg text-white">
                <div className="flex flex-col gap-6">
                  {/* Friend Header */}
                  <div className="border-b border-white/20 pb-4">
                    <h2 className="text-2xl font-bold mb-2">
                      {friend.username}
                    </h2>
                    {friend.bio && (
                        <p className="text-white/90 text-lg">{friend.bio}</p>
                    )}
                  </div>

                  {/* Favorites Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Favorite Movie */}
                    {friend.favoriteMovie && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                            Favorite Movie
                          </h3>
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-24 bg-white/20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                              <img
                                  src={friend.favoriteMovie.posterURL}
                                  alt={friend.favoriteMovie.title}
                                  className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-2">
                                {friend.favoriteMovie.title}
                              </p>
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Favorite Genres */}
                    {friend.favoriteGenres && friend.favoriteGenres.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Favorite Genres
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {friend.favoriteGenres.map((genre, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 rounded-full font-medium shadow-sm"
                                >
                          {genre}
                        </span>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Favorite Actors */}
                    {friend.favoriteActors && friend.favoriteActors.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Favorite Actors
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {friend.favoriteActors.map((actor, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-1.5 rounded-full font-medium shadow-sm"
                                >
                          {actor}
                        </span>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Favorite Directors */}
                    {friend.favoriteDirectors && friend.favoriteDirectors.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Favorite Directors
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {friend.favoriteDirectors.map((director, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 rounded-full font-medium shadow-sm"
                                >
                          {director}
                        </span>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{friend.watchlist?.length || 0}</p>
                      <p className="text-sm text-white/80">Movies in Watchlist</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{friend.watchedMovies?.length || 0}</p>
                      <p className="text-sm text-white/80">Movies Watched</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{friend.favoriteGenres?.length || 0}</p>
                      <p className="text-sm text-white/80">Favorite Genres</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {(friend.favoriteActors?.length || 0) + (friend.favoriteDirectors?.length || 0)}
                      </p>
                      <p className="text-sm text-white/80">Favorite People</p>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Search Bar */}
          <SearchBar
              searchQuery={searchQuery}
              onSearchChange={(e) => setSearchQuery(e.target.value)}
              onClearSearch={() => setSearchQuery("")}
              placeholder="Search watchlist..."
              className="mb-6"
          />

          {/* Movie List */}
          <MovieList
              movies={filteredMovies}
              isLoading={false}
              isSearching={searchQuery.length > 0}
              onMovieClick={handleMovieClick}
              onClearSearch={() => setSearchQuery("")}
              emptyMessage="No movies in watchlist"
              noResultsMessage="No movies match your search"
              isInWatchlistFn={isInWatchlist}
              isInSeenListFn={isInSeenList}
              isSelectingFavorite={false}
          />

          {/* Back Button */}
          <Button
              variant="destructive"
              className="mt-6"
              onClick={() => router.push(`/users/${userId}/friends`)}
          >
            Back to Friends
          </Button>

          {/* Movie Details Modal */}
          {selectedMovie && (
              <MovieDetailsModal
                  movie={selectedMovie}
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  isInWatchlist={isInWatchlist(selectedMovie)}
                  isInSeenList={isInSeenList(selectedMovie)}
                  onAddToWatchlist={handleAddToWatchlist}
                  onMarkAsSeen={handleAddToSeenList}
                  isAddingMovie={isAddingMovie}
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

export default FriendWatchlist;