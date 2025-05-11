"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import { ApiService } from "@/app/api/apiService";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { ApplicationError } from "@/app/types/error";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import MovieDetailsModal from "@/components/ui/movie_details";
import MovieList from "@/components/ui/movie_list";
import { retry } from "src/utils/retry";
import { RefreshCw, Search, X, Plus } from "lucide-react";

// Define types for genres, actors, and directors
interface Genre {
  id: number;
  name: string;
}

interface Actor {
  actorId: number;
  actorName: string;
}

interface Director {
  directorId: number;
  directorName: string;
}

interface PersonSearchProps {
  type: 'actor' | 'director';
  onSelect: (person: Actor | Director) => void;
  selectedItems: (Actor | Director)[];
  onRemove: (id: number) => void;
  apiService: ApiService;
}

// Component for actor/director search dropdown
const PersonSearch: React.FC<PersonSearchProps> = ({ type, onSelect, selectedItems, onRemove, apiService }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<(Actor | Director)[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    const searchPeople = async () => {
      try {
        const endpoint = type === 'actor' ? '/movies/actors' : '/movies/directors';
        const paramName = type === 'actor' ? 'actorname' : 'directorname';

        const results = await retry(() =>
            apiService.get<(Actor | Director)[]>(`${endpoint}?${paramName}=${encodeURIComponent(searchQuery)}`)
        );

        setSearchResults(results || []);
      } catch {
        setError(`Failed to search ${type}s`);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPeople, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, type, apiService]);

  return (
      <div className="space-y-3">
        <input
            type="text"
            placeholder={`Search for ${type}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-[#3b3e88]/20 rounded-2xl text-[#3b3e88] placeholder-[#b9c0de] focus:ring-2 focus:ring-[#3b3e88]/30 focus:border-[#3b3e88]/50"
        />

        {isSearching && (
            <div className="text-sm text-[#b9c0de]">Searching...</div>
        )}

        {error && (
            <div className="text-sm text-rose-500">{error}</div>
        )}

        {searchResults.length > 0 && (
            <div className="border border-[#3b3e88]/20 rounded-2xl max-h-48 overflow-y-auto">
              {searchResults.map((person) => {
                const id = type === 'actor'
                    ? (person as Actor).actorId
                    : (person as Director).directorId;
                const name = type === 'actor'
                    ? (person as Actor).actorName
                    : (person as Director).directorName;

                return (
                    <div
                        key={id}
                        className="flex items-center justify-between p-3 hover:bg-[#ebefff] cursor-pointer transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                        onClick={() => {
                          onSelect(person);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                    >
                      <span className="text-[#3b3e88]">{name}</span>
                      <Plus size={16} className="text-[#3b3e88]" />
                    </div>
                );
              })}
            </div>
        )}

        {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedItems.map((item) => {
                const id = 'actorId' in item ? item.actorId : item.directorId;
                const name = 'actorName' in item ? item.actorName : item.directorName;

                return (
                    <div
                        key={id}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1.5 rounded-2xl text-sm"
                    >
                      <span>{name}</span>
                      <X
                          size={14}
                          className="cursor-pointer hover:text-white/80"
                          onClick={() => onRemove(id)}
                      />
                    </div>
                );
              })}
            </div>
        )}
      </div>
  );
};

// Component for genre selection
// Year selector component
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

  // Advanced search parameters
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedActors, setSelectedActors] = useState<Actor[]>([]);
  const [selectedDirectors, setSelectedDirectors] = useState<Director[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);

  // movie inspection
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // favorite movie selection
  const [isSelectingFavoriteMovie, setIsSelectingFavoriteMovie] = useState<boolean>(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // new state for recommendation loading
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

  // ANI CHANGE: Added a state to track ongoing movie addition to prevent simultaneous operations
  const [isAddingMovie, setIsAddingMovie] = useState<boolean>(false);

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

  // Fetch genres on component mount
  useEffect(() => {
    apiService.getGenres()
        .then(setAvailableGenres)
        .catch(() => {
          showMessage("Couldn't load movie genres right now.");
          setAvailableGenres([]);
        });
  }, [apiService]);

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

  // simple search movies - now only searching by title
  useEffect(() => {
    if (!searchQuery.trim() || showAdvancedSearch) {
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
  }, [searchQuery, apiService, showAdvancedSearch]);

  // Extract the recommendation function so it can be called separately
  const getRecommendedMovies = async () => {
    try {
      setIsLoadingRecommendations(true);
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
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Add a function to handle refreshing recommendations
  const handleRefreshRecommendations = async () => {
    if (!isSearching && !showAdvancedSearch) {
      const recommendations = await getRecommendedMovies();
      const uniqueRecommendations = Array.from(
          new Map(recommendations.map((movie) => [movie.movieId, movie]))
              .values(),
      );
      setDisplayMovies(uniqueRecommendations);
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

  // Handle genre selection
  const handleGenreChange = (genre: Genre) => {
    setSelectedGenres(prev => {
      const isSelected = prev.some(g => g.id === genre.id);
      if (isSelected) {
        return prev.filter(g => g.id !== genre.id);
      } else {
        return [...prev, genre];
      }
    });
  };

  // Handle actor selection
  const handleActorSelect = (actor: Actor | Director) => {
    const actorData = actor as Actor;
    if (!selectedActors.some(a => a.actorId === actorData.actorId)) {
      setSelectedActors([...selectedActors, actorData]);
    }
  };

  // Handle director selection
  const handleDirectorSelect = (director: Actor | Director) => {
    const directorData = director as Director;
    if (!selectedDirectors.some(d => d.directorId === directorData.directorId)) {
      setSelectedDirectors([...selectedDirectors, directorData]);
    }
  };

  // Remove selected actor
  const handleActorRemove = (actorId: number) => {
    setSelectedActors(selectedActors.filter(a => a.actorId !== actorId));
  };

  // Remove selected director
  const handleDirectorRemove = (directorId: number) => {
    setSelectedDirectors(selectedDirectors.filter(d => d.directorId !== directorId));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedActors([]);
    setSelectedDirectors([]);
    setSelectedYear(null);
  };

  // Perform advanced search with all parameters
  const performAdvancedSearch = async () => {
    if (!selectedGenres.length && !selectedActors.length && !selectedDirectors.length && !selectedYear) {
      showMessage('Please select at least one search parameter');
      return;
    }

    setIsSearching(true);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      // Add genres (use genre names)
      if (selectedGenres.length > 0) {
        selectedGenres.forEach(genre => {
          queryParams.append('genres', genre.name);
        });
      }

      // Add actors (use actor IDs)
      if (selectedActors.length > 0) {
        selectedActors.forEach(actor => {
          queryParams.append('actors', actor.actorId.toString());
        });
      }

      // Add directors (use director IDs)
      if (selectedDirectors.length > 0) {
        selectedDirectors.forEach(director => {
          queryParams.append('directors', director.directorId.toString());
        });
      }

      // Add year
      if (selectedYear) {
        queryParams.append('year', selectedYear.toString());
      }

      const results = await retry(() =>
          apiService.get<Movie[]>(`/movies?${queryParams.toString()}`)
      );

      if (Array.isArray(results)) {
        setSearchResults(results as Movie[]);
        showMessage(`Found ${results.length} movies`);
      } else {
        setSearchResults([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        if (appErr.status === 400) {
          showMessage("No movies found matching your criteria. Try adjusting your filters.");
        } else {
          showMessage("Search failed. Please try again.");
        }
      } else {
        showMessage("Search failed. Please try again.");
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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
    if (isAddingMovie) {
      showMessage("Please wait while the current operation completes");
      return;
    }

    if (isInWatchlist(movie)) {
      showMessage("Movie already in your watchlist");
      return;
    }

    try {
      setIsAddingMovie(true);

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
    } finally {
      setIsAddingMovie(false);
    }
  };

  const handleAddToSeenList = async (movie: Movie) => {
    if (isAddingMovie) {
      showMessage("Please wait while the current operation completes");
      return;
    }

    if (isInSeenList(movie)) {
      showMessage("Movie already in your seen list");
      return;
    }

    try {
      setIsAddingMovie(true);

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
    } finally {
      setIsAddingMovie(false);
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
    if (isSearching || (showAdvancedSearch && searchResults.length > 0)) {
      setDisplayMovies(searchResults);
    } else if (!showAdvancedSearch) {
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
  }, [isSearching, searchResults, showAdvancedSearch]);

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

  // Check if any filters are active
  const hasActiveFilters = selectedGenres.length > 0 || selectedActors.length > 0 ||
      selectedDirectors.length > 0 || selectedYear !== null;

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

          {/* Toggle between simple and advanced search */}
          <div className="mb-6">
            <Button
                variant="outline"
                className="text-[#3b3e88] border-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-xl px-6"
                onClick={() => {
                  setShowAdvancedSearch(!showAdvancedSearch);
                  clearSearch();
                  clearAllFilters();
                  setSearchResults([]);
                }}
            >
              {showAdvancedSearch ? 'Simple Search' : 'Advanced Search'}
            </Button>
          </div>

          {/* Simple search bar */}
          {!showAdvancedSearch && (
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="h-5 w-5 text-white/70" />
                </div>
                <input
                    type="text"
                    placeholder="Search for movie titles..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:outline-none"
                />
                {searchQuery && (
                    <button
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/70 hover:text-white"
                        onClick={clearSearch}
                    >
                      <X className="h-5 w-5" />
                    </button>
                )}
              </div>
          )}

          {/* Advanced search panel */}
          {showAdvancedSearch && (
              <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-[#3b3e88] mb-6">Advanced Movie Search</h2>

                {/* Genre selector */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#3b3e88] mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map((genre) => (
                        <button
                            key={`genre-${genre.id}`}
                            onClick={() => handleGenreChange(genre)}
                            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                                selectedGenres.some(g => g.id === genre.id)
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                                    : 'bg-[#ebefff] text-[#3b3e88] hover:bg-[#3b3e88]/10'
                            }`}
                        >
                          {genre.name}
                        </button>
                    ))}
                  </div>
                </div>

                {/* Year selector */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#3b3e88] mb-3">Release Year</h3>
                  <select
                      value={selectedYear || ''}
                      onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-3 border border-[#3b3e88]/20 rounded-2xl text-[#3b3e88] focus:ring-2 focus:ring-[#3b3e88]/30 focus:border-[#3b3e88]/50"
                  >
                    <option value="">Any year</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Actor search */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#3b3e88] mb-3">Actors</h3>
                  <PersonSearch
                      type="actor"
                      onSelect={handleActorSelect}
                      selectedItems={selectedActors}
                      onRemove={handleActorRemove}
                      apiService={apiService}
                  />
                </div>

                {/* Director search */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#3b3e88] mb-3">Directors</h3>
                  <PersonSearch
                      type="director"
                      onSelect={handleDirectorSelect}
                      selectedItems={selectedDirectors}
                      onRemove={handleDirectorRemove}
                      apiService={apiService}
                  />
                </div>

                {/* Search buttons */}
                <div className="flex gap-4">
                  <Button
                      onClick={performAdvancedSearch}
                      disabled={isSearching || !hasActiveFilters}
                      className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-2xl"
                  >
                    {isSearching ? (
                        <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Searching...
                </span>
                    ) : (
                        <span className="flex items-center gap-2">
                  <Search size={16} />
                  Search Movies
                </span>
                    )}
                  </Button>

                  <Button
                      onClick={clearAllFilters}
                      variant="outline"
                      disabled={!hasActiveFilters}
                      className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-2xl"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
          )}

          {/* favorite movie selection info */}
          {isSelectingFavoriteMovie && (
              <div className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-3xl p-6 mb-6 text-white">
                <h3 className="font-semibold mb-2">
                  Select your favorite movie
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Click on a movie to set it as your favorite. This will be
                  displayed on your profile.
                </p>
                <Button
                    variant="outline"
                    className="bg-white text-rose-500 hover:bg-white/90 border-white rounded-2xl"
                    onClick={() => router.push(`/users/${id}/edit_profile`)}
                >
                  Cancel
                </Button>
              </div>
          )}

          {/* content heading with refresh button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-medium text-[#3b3e88]">
              {isSearching || (showAdvancedSearch && searchResults.length > 0)
                  ? `Search Results (${searchResults.length})`
                  : "Browse movies based on your favorites"}
            </h2>

            {/* Add refresh button for recommendations */}
            {!isSearching && !showAdvancedSearch && (
                <Button
                    variant="outline"
                    className="flex items-center gap-2 text-[#3b3e88] border-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-2xl"
                    onClick={handleRefreshRecommendations}
                    disabled={isLoadingRecommendations}
                >
                  <RefreshCw
                      size={16}
                      className={isLoadingRecommendations ? "animate-spin" : ""}
                  />
                  Refresh Suggestions
                </Button>
            )}
          </div>

          {/* movie list component */}
          <MovieList
              movies={displayMovies}
              isLoading={isLoadingRecommendations}
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
              variant="outline"
              className="mt-6 border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 rounded-2xl"
              onClick={() => router.push(`/users/${id}/dashboard`)}
          >
            Back to Dashboard
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