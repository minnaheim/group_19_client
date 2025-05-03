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
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import MovieDetailsModal from "@/components/ui/movie_details";
import MovieList from "@/components/ui/movie_list";
import SearchBar from "@/components/ui/search_bar";
import { retry } from "src/utils/retry";

const SearchMovies: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // movie inspection
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // favorite movie selection
  const [isSelectingFavoriteMovie, setIsSelectingFavoriteMovie] = useState<
    boolean
  >(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      setLoading(true);
      let dataUser: User;
      let listWatch: Movie[] = [];
      let listWatched: Movie[] = [];

      // Profile
      try {
        dataUser = await retry(() =>
          apiService.get(`/users/${id}/profile`)
        ) as User;
        showMessage("User profile loaded");
      } catch (err: unknown) {
        if (
          err instanceof Error && "status" in err &&
          (err as ApplicationError).status === 404
        ) {
          showMessage("Oops! We couldn't find your profile details.");
        } else {
          setError("Failed to load user profile");
        }
        setLoading(false);
        return;
      }

      // Watchlist
      try {
        listWatch = await retry(() =>
          apiService.get(`/users/${id}/watchlist`)
        ) as Movie[];
        showMessage("Watchlist loaded");
      } catch (err: unknown) {
        const status = err instanceof Error && "status" in err
          ? (err as ApplicationError).status
          : null;
        if (status === 401) {
          showMessage(
            "Your session has expired. Please log in again to see your watchlist.",
          );
        } else if (status === 404) {
          showMessage("Could not find the watchlist for this user.");
        } else {
          setError("Failed to load watchlist");
        }
      }

      // Watched list
      try {
        listWatched = await retry(() =>
          apiService.get(`/users/${id}/watched`)
        ) as Movie[];
        showMessage("Watched list loaded");
      } catch (err: unknown) {
        const status = err instanceof Error && "status" in err
          ? (err as ApplicationError).status
          : null;
        if (status === 401) {
          showMessage(
            "Your session has expired. Please log in again to see your watched list.",
          );
        } else if (status === 404) {
          showMessage("Could not find the watched list for this user.");
        } else {
          setError("Failed to load watched list");
        }
      }

      setUser({
        ...dataUser,
        watchlist: listWatch,
        watchedMovies: listWatched,
      });
      setLoading(false);
    };

    fetchUserData();
  }, [id, token, apiService]);

  // check if we're selecting a favorite movie (from query params)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const selectFavorite = urlParams.get("selectFavorite");
      if (selectFavorite === "true") {
        setIsSelectingFavoriteMovie(true);
      }
    }
  }, []);

  // search movies - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const searchMovies = async () => {
      try {
        // only search by title now
        const queryString = `title=${encodeURIComponent(searchQuery)}`;

        // make api call with title parameter only
        const results = await retry(() =>
          apiService.get(`/movies?${queryString}`)
        );
        if (Array.isArray(results)) {
          setSearchResults(results as Movie[]);
          showMessage("Movie search results loaded");
        } else {
          setSearchResults([]);
        }
      } catch (error: unknown) {
        if (error instanceof Error && "status" in error) {
          const appErr = error as ApplicationError;
          if (appErr.status === 400) {
            showMessage(
              "No movies found matching your search. Try different keywords.",
            );
          } else {
            showMessage("Movie search failed. Please try again.");
          }
        } else {
          showMessage("Movie search failed. Please try again.");
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

  // get recommended movies based on user favorites
  const getRecommendedMovies = async () => {
    try {
      const recommendedMovies = await retry(() =>
        apiService.get(`/movies/suggestions/${id}`)
      );
      showMessage("Recommendations loaded");
      return Array.isArray(recommendedMovies)
        ? recommendedMovies as Movie[]
        : [];
    } catch (error: unknown) {
      if (
        error instanceof Error && "status" in error &&
        (error as ApplicationError).status === 404
      ) {
        showMessage("We couldn't fetch recommendations right now.");
      }
      return [];
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  const handleSelectFavoriteMovie = (movie: Movie) => {
    // store the selected movie in session storage for the edit profile page
    sessionStorage.setItem("selectedFavoriteMovie", JSON.stringify(movie));

    // navigate back to the edit profile page
    router.push(`/users/${id}/edit_profile`);
  };

  const handleMovieClick = async (movie: Movie) => {
    if (isSelectingFavoriteMovie) {
      handleSelectFavoriteMovie(movie);
      return;
    }

    try {
      const detailedMovie = await retry(() =>
        apiService.get(`/movies/${movie.movieId}`)
      );
      if (detailedMovie && typeof detailedMovie === "object") {
        setSelectedMovie(detailedMovie as Movie);
      } else {
        setSelectedMovie(movie);
      }
      setIsModalOpen(true);
      showMessage("Movie details loaded");
    } catch (error: unknown) {
      if (
        error instanceof Error && "status" in error &&
        (error as ApplicationError).status === 404
      ) {
        showMessage("Sorry, we couldn't find details for that movie.");
      } else {
        showMessage("Error loading movie details");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // delay to allow animation
  };

  const isInWatchlist = (movie: Movie) => {
    return user?.watchlist.some((m) => m.movieId === movie.movieId) || false;
  };

  const isInSeenList = (movie: Movie) => {
    return user?.watchedMovies.some((m) => m.movieId === movie.movieId) ||
      false;
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (isInWatchlist(movie)) {
      showMessage("Movie already in your watchlist");
      return;
    }

    try {
      await apiService.post(`/users/${id}/watchlist/${movie.movieId}`, {});

      // update local state
      if (user) {
        setUser({
          ...user,
          watchlist: [...user.watchlist, movie],
        });
      }

      showMessage("Added to watchlist");
    } catch (error) {
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
            showMessage(
              "Could not find the user or movie to add to the watchlist.",
            );
            break;
          case 409:
            showMessage("This movie is already on your watchlist.");
            break;
          default:
            showMessage("Failed to add movie to watchlist.");
        }
      } else {
        showMessage("Failed to add movie to watchlist.");
      }
    }
  };

  const handleAddToSeenList = async (movie: Movie) => {
    if (isInSeenList(movie)) {
      showMessage("Movie already in your seen list");
      return;
    }

    try {
      await apiService.post(`/users/${id}/watched/${movie.movieId}`, {});

      // update local state
      if (user) {
        setUser({
          ...user,
          watchedMovies: [...user.watchedMovies, movie],
        });
      }

      showMessage("Added to watched list");
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        switch (appErr.status) {
          case 401:
            showMessage(
              "Please log in again to add movies to your watched list.",
            );
            break;
          case 403:
            showMessage(
              "You don't have permission to modify this watched list.",
            );
            break;
          case 404:
            showMessage(
              "Could not find the user or movie to add to the watched list.",
            );
            break;
          case 409:
            showMessage("You've already marked this movie as watched.");
            break;
          default:
            showMessage("Failed to add movie to watched list.");
        }
      }
    }
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  // display recommendations if not searching, otherwise show search results
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (isSearching) {
      setDisplayMovies(searchResults);
    } else {
      const fetchRecommendations = async () => {
        const recommendations = await getRecommendedMovies();

        const uniqueRecommendations = Array.from(
          new Map(recommendations.map((movie) => [movie.movieId, movie]))
            .values(),
        );

        setDisplayMovies(uniqueRecommendations);
      };
      fetchRecommendations();
    }
  }, [isSearching, searchResults]);

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

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      {/* sidebar */}
      <Navigation userId={userId} activeItem="Search Movies" />
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            Search Movies
          </h1>
          <p className="text-[#b9c0de] mt-2">
            Find movies to add to your watchlist!
          </p>
        </div>

        {/* search bar component - simplified version */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
          placeholder="Search for movie titles..."
          className="mb-6"
        />

        {/* favorite movie selection info */}
        {isSelectingFavoriteMovie && (
          <div className="bg-[#f7f9ff] rounded-lg p-4 mb-6 border border-[#b9c0de]">
            <h3 className="text-[#3b3e88] font-medium mb-2">
              Select your favorite movie
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Click on a movie to set it as your favorite. This will be
              displayed on your profile.
            </p>
            <Button
              variant="outline"
              className="text-[#3b3e88] border-[#3b3e88]"
              onClick={() => router.push(`/users/${id}/edit_profile`)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* content heading */}
        <div className="mb-4">
          <h2 className="text-xl font-medium text-[#3b3e88]">
            {isSearching
              ? `Search Results (${searchResults.length})`
              : "Browse movies based on your favorites"}
          </h2>
        </div>

        {/* movie list component */}
        <MovieList
          movies={displayMovies}
          isLoading={false}
          isSearching={isSearching}
          onMovieClick={handleMovieClick}
          onClearSearch={clearSearch}
          emptyMessage="No recommended movies available"
          noResultsMessage="There are no movies that match your search"
          isInWatchlistFn={isInWatchlist}
          isInSeenListFn={isInSeenList}
          isSelectingFavorite={isSelectingFavoriteMovie}
        />

        {/* back button */}
        <Button
          variant="destructive"
          className="mt-6"
          onClick={() => router.push(`/users/${id}/dashboard`)}
        >
          back to dashboard
        </Button>

        {/* movie details modal component */}
        {selectedMovie && (
          <MovieDetailsModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={closeModal}
            isInWatchlist={isInWatchlist(selectedMovie)}
            isInSeenList={isInSeenList(selectedMovie)}
            onAddToWatchlist={handleAddToWatchlist}
            onMarkAsSeen={handleAddToSeenList}
          />
        )}

        {/* action message component */}
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

export default SearchMovies;
