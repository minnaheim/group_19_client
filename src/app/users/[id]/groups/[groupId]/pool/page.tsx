"use client";

import { useApi } from "@/app/hooks/useApi";
import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import { PoolEntry } from "@/app/types/poolEntry";
import type { ApplicationError } from "@/app/types/error"; // Re-added to handle typed errors

import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import { useEffect, useState } from "react";

import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import MovieCard from "@/components/ui/Movie_card";
import MovieDetailsModal from "@/components/ui/movie_details";
import { Trash2 } from "lucide-react";
import Timer from "@/components/ui/Timer";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useLocalStorage from "@/app/hooks/useLocalStorage";

const MoviePool = () => {
  const [selectedMovies] = useState<Movie[]>([]);
  const params = useParams();
  let groupId = params.groupId;
  if (Array.isArray(groupId)) groupId = groupId[0];
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const [moviePool, setMoviePool] = useState<PoolEntry[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<Movie[]>([]);
  const [userWatched, setUserWatched] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingWatchlist, setIsAddingWatchlist] = useState<boolean>(false);
  const [isOverallLoading, setIsOverallLoading] = useState<boolean>(true); // Renamed from dataLoading
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(true);
  const [poolLoading, setPoolLoading] = useState<boolean>(true);
  const {
    group: phaseGroup,
    phase,
    loading: phaseLoading,
    error: phaseError,
  } = useGroupPhase(groupId as string);

  useEffect(() => {
    if (phaseLoading || watchlistLoading || poolLoading) {
      setIsOverallLoading(true);
    } else {
      // Add a small delay before turning off loading to ensure all state updates are complete
      // This prevents momentary flashing of error messages or incomplete content
      const timer = setTimeout(() => {
        setIsOverallLoading(false);
      }, 100); // 100ms delay is barely noticeable but allows other state updates to settle

      // Clean up the timeout if the component unmounts or dependencies change
      return () => clearTimeout(timer);
    }
  }, [phaseLoading, watchlistLoading, poolLoading]);

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setSubmitError(phaseError as string);
      setShowSuccessMessage(false); // Clear success message on new error
      setSuccessMessage("");
      // setDataLoading(false); // isOverallLoading will handle this based on phaseLoading
      return;
    }
    if (phase && phase !== "POOLING") {
      if (phase === "VOTING") {
        router.replace(`/users/${userId}/groups/${groupId}/vote`);
      } else if (phase === "RESULTS") {
        router.replace(`/users/${userId}/groups/${groupId}/results`);
      }
      return;
    }
    // Keep loading true until data is fetched
  }, [phase, phaseLoading, phaseError, router, userId, groupId]);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Navigation function
  const navigateToMovieSearch = () => {
    router.push(`/users/${userId}/movie_search`);
  };

  // Fetch user's watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      setWatchlistLoading(true);
      if (!userId) return;

      try {
        const response = await apiService.get<User>(`/users/${userId}/profile`);
        // Clear previous error on successful fetch
        setSubmitError("");
        if (
          response &&
          typeof response === "object" &&
          "watchlist" in response
        ) {
          setUserWatchlist((response as User).watchlist);
          if ("watchedMovies" in response) {
            setUserWatched((response as User).watchedMovies);
          } else {
            setUserWatched([]);
          }
        } else {
          setUserWatchlist([]);
          setUserWatched([]);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch watchlist:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 404) {
            setSubmitError("User profile not found. Could not load watchlist.");
          } else if (appErr.status === 401) {
            setSubmitError(
              "Session expired. Please log in again to load watchlist.",
            );
          } else {
            setSubmitError(
              "Failed to load your watchlist. Please try refreshing.",
            );
          }
        } else {
          setSubmitError(
            "An unexpected error occurred while loading your watchlist.",
          );
        }
        setShowSuccessMessage(false); // Clear success message on new error
        setSuccessMessage("");
      } finally {
        setWatchlistLoading(false);
      }
    };

    // Only fetch watchlist when we're in the POOLING phase and phase data is loaded
    if (!phaseLoading && (phase === "POOLING")) {
      fetchWatchlist();
    }
  }, [userId, apiService, phaseLoading, phase]);

  // Fetch movie pool after getting watchlist and once group is in POOLING phase
  useEffect(() => {
    const fetchMoviePool = async () => {
      setPoolLoading(true);
      if (!groupId) return;

      try {
        // Clear previous error on successful fetch
        setSubmitError("");

        // Fetch movie pool
        const poolEntries = await apiService.get<PoolEntry[]>(
          `/groups/${groupId}/pool`,
        );
        if (Array.isArray(poolEntries)) {
          setMoviePool(poolEntries as PoolEntry[]);
        } else {
          setMoviePool([]);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch movie pool:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 401) {
            setSubmitError("Your session has expired. Please log in again.");
          } else if (appErr.status === 404) {
            setSubmitError("Could not find the group or you are not a member.");
          } else {
            setSubmitError(
              "An error occurred while loading the movie pool. Please try again.",
            );
          }
        } else {
          setSubmitError(
            "An error occurred while loading the movie pool. Please try again.",
          );
        }
        setShowSuccessMessage(false); // Clear success message on new error
        setSuccessMessage("");
      } finally {
        setPoolLoading(false);
      }
    };

    // Only fetch movie pool when we're in the POOLING phase and phase data is loaded
    if (!phaseLoading && (phase === "POOLING")) {
      fetchMoviePool();
    }
  }, [apiService, groupId, phase, phaseLoading]);

  // Modified to add movie directly to pool on click
  const handleAddToPool = async (movie: Movie) => {
    if (phase !== "POOLING") {
      setSubmitError("You can only add movies during the POOLING phase.");
      setShowSuccessMessage(false); // Clear success message on new error
      setSuccessMessage("");
      return;
    }

    setSubmitError("");
    setSuccessMessage("");
    setShowSuccessMessage(false);

    try {
      const response = await apiService.post<PoolEntry[]>(
        `/groups/${groupId}/pool/${movie.movieId}`,
        {},
      );
      if (response && Array.isArray(response)) {
        setMoviePool(response);
        setSuccessMessage(`Added '${movie.title}'`);
        setShowSuccessMessage(true);
        setSubmitError(""); // Clear error on success
      }
    } catch (err: unknown) {
      console.error(`Failed to add movie ${movie.movieId} to pool:`, err);
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        let specificError = "";
        switch (appErr.status) {
          case 403:
            specificError =
              `You have already added the maximum number of movies (2).`;
            break;
          case 404:
            specificError =
              `Movie with ID ${movie.movieId} not found or group not found.`;
            break;
          case 409:
            specificError =
              `Movie '${movie.title}' is already in the pool, or you can only add movies during the POOLING phase.`;
            break;
          default:
            specificError = `Failed to add '${movie.title}'.`;
        }
        setSubmitError(specificError);
      } else {
        setSubmitError(
          `An unknown error occurred while adding '${movie.title}'.`,
        );
      }
      setShowSuccessMessage(false); // Clear success message on new error
      setSuccessMessage("");
    }
  };

  // Function to remove movie from pool
  const handleRemoveFromPool = async (movieId: number) => {
    // Capture removed movie title for message
    const removedEntry = moviePool.find((e) => e.movie.movieId === movieId);
    const removedTitle = removedEntry?.movie.title;
    setSubmitError("");
    setSuccessMessage("");
    setShowSuccessMessage(false);

    try {
      await apiService.delete(`/groups/${groupId}/pool/${movieId}`);
      setMoviePool((prevPool) =>
        prevPool.filter((entry) => entry.movie.movieId !== movieId)
      );
      setSuccessMessage(
        removedTitle
          ? `Removed '${removedTitle}'`
          : "Movie removed successfully!",
      );
      setShowSuccessMessage(true);
      setSubmitError(""); // Clear error on success
    } catch (err: unknown) {
      console.error("Error removing movie from pool:", err);
      let errorMessage = "Failed to remove movie from pool. Please try again.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 403:
            errorMessage =
              "You can only remove movies that you added, or you are not a member, or it's not POOLING phase.";
            break;
          case 404:
            errorMessage = "Movie not found in the pool or group not found.";
            break;
          default:
            errorMessage = "Failed to remove movie.";
        }
      }
      setSubmitError(errorMessage);
      setShowSuccessMessage(false); // Clear success message on new error
      setSuccessMessage("");
    }
  };

  const handleMovieClick = async (movie: Movie) => {
    try {
      const detailed = await apiService.get<Movie>(`/movies/${movie.movieId}`);
      setSelectedMovie(
        detailed && typeof detailed === "object" ? (detailed as Movie) : movie,
      );
      setIsModalOpen(true);
    } catch {
      // fallback to basic
      setSelectedMovie(movie);
      setIsModalOpen(true);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (isAddingWatchlist) {
      setSuccessMessage("Please wait while current operation completes");
      setShowSuccessMessage(true);
      return;
    }
    if (userWatchlist.some((m) => m.movieId === movie.movieId)) {
      setSuccessMessage("Movie already in your watchlist");
      setShowSuccessMessage(true);
      return;
    }
    try {
      setIsAddingWatchlist(true);
      await apiService.post(`/users/${userId}/watchlist/${movie.movieId}`, {});
      setUserWatchlist((prev) => [...prev, movie]);
      setSuccessMessage("Movie added to your watchlist!");
      setShowSuccessMessage(true);
      setSubmitError(""); // Clear error on success
      setIsModalOpen(false);
    } catch {
      setSubmitError("Failed to add movie to watchlist.");
      setShowSuccessMessage(false); // Clear success message on new error
      setSuccessMessage("");
      // setIsModalOpen(false); // Optionally keep modal open on error
    } finally {
      setIsAddingWatchlist(false);
    }
  };

  return (
    <>
      {!isOverallLoading && submitError && (
        <ErrorMessage
          message={submitError}
          onClose={() => setSubmitError("")}
        />
      )}
      {/* Centered overlay for success messages */}
      {/* Consistent Success Message Display using ActionMessage */}
      {!isOverallLoading && showSuccessMessage && successMessage && (
        <ActionMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onHide={() => setShowSuccessMessage(false)}
          className="bg-green-500"
        />
      )}
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation - always visible even during loading */}
        <Navigation userId={userId} activeItem="Movie Groups" />

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {/* Page Title - Displayed during loading */}
          <div className="mb-6">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {phaseGroup
                ? `Movie Pool - ${phaseGroup.groupName}`
                : "Movie Pool"}
            </h1>
          </div>

          {isOverallLoading
            ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
                </div>
              </div>
            )
            : (
              <div>
                <div className="mb-8">
                  {
                    /* <p className="text-[#b9c0de] mt-2">
              Choose Movies to Vote and Watch
            </p> */
                  }
                  <div className="text-[#3b3e88]">
                    {phaseGroup?.groupId && (
                      <Timer groupId={phaseGroup?.groupId.toString()} />
                    )}
                  </div>
                </div>

                {/* Show User's Watchlist */}
                <div className="mb-8">
                  <h2 className="font-semibold text-[#3b3e88] text-xl">
                    Your Watchlist
                  </h2>
                  {userWatchlist.length > 0 && (
                    <p className="mt-1 text-sm text-[#3C3F88]">
                      Click on a movie to add it to the pool.
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto mb-8">
                  <MovieListHorizontal
                    movies={userWatchlist}
                    onMovieClick={handleAddToPool}
                    emptyMessage="Your watchlist is empty"
                    noResultsMessage="No movies match your search"
                    hasOuterContainer={false}
                    selectedMovieIds={selectedMovies.map((m) => m.movieId)}
                    onAddMovieClick={navigateToMovieSearch}
                  />
                </div>

                {/* Informational message for non-pool phase */}
                {phase !== "POOLING" && (
                  <div className="flex justify-center mt-4">
                    <ErrorMessage
                      message={`This group is currently in the ${phase} phase. You cannot modify the pool now.`}
                      onClose={() => setSubmitError("")}
                    />
                  </div>
                )}

                {/* Movie Pool */}
                <div className="mb-8">
                  <h2 className="mt-15 font-semibold text-[#3b3e88] text-xl">
                    Current Movie Pool
                  </h2>
                  {/* Always show added count; text is orange when full */}
                  <p
                    className={`text-sm ${
                      moviePool.filter(
                          (entry) => entry.addedBy === parseInt(userId || "0"),
                        ).length === 2
                        ? "text-orange-600"
                        : "text-[#3C3F88]"
                    }`}
                  >
                    You have added {moviePool.filter(
                      (entry) => entry.addedBy === parseInt(userId || "0"),
                    ).length}
                    /2 movies.
                  </p>
                </div>

                {/* Display movie pool or placeholder */}
                <div className="overflow-x-auto mb-8">
                  {moviePool.length === 0
                    ? (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded">
                        <p className="text-gray-500">
                          No movies in the pool yet.
                        </p>
                      </div>
                    )
                    : (
                      <div className="flex gap-4">
                        {moviePool.map((entry) => (
                          <div
                            key={entry.movie.movieId}
                            className="relative flex-shrink-0"
                          >
                            <MovieCard
                              movie={entry.movie}
                              onClick={handleMovieClick}
                            />
                            {phase === "POOLING" &&
                              entry.addedBy === parseInt(userId || "0") && (
                              <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() =>
                                  handleRemoveFromPool(entry.movie.movieId)}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-red-100"
                                title="Remove from pool"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-8 gap-2">
                  {/* Back to dashboard (left) */}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/users/${userId}/groups`)}
                  >
                    Back to Group Overview
                  </Button>
                  {/* Start Voting (creator only, right) */}
                  {phase === "POOLING" &&
                    phaseGroup &&
                    String(phaseGroup.creatorId) === String(userId) && (
                    <Button
                      variant="secondary"
                      disabled={moviePool.length < 2}
                      onClick={async () => {
                        try {
                          await apiService.post(
                            `/groups/${groupId}/start-voting`,
                            {},
                          );
                          setSuccessMessage("Voting started successfully!");
                          setShowSuccessMessage(true);
                          setSubmitError(""); // Clear error on success
                          router.replace(
                            `/users/${userId}/groups/${groupId}/vote`,
                          );
                        } catch (err: unknown) {
                          if (err instanceof Error && "status" in err) {
                            const appErr = err as ApplicationError;
                            switch (appErr.status) {
                              case 403:
                                setSubmitError(
                                  "Only the group creator can start the voting phase.",
                                );
                                break;
                              case 404:
                                setSubmitError(
                                  "The specified group could not be found.",
                                );
                                break;
                              case 409:
                                setSubmitError(
                                  "Voting can only be started when the group is in the 'Pool' phase.",
                                );
                                break;
                              default:
                                setSubmitError(
                                  "An error occurred while starting voting. Please try again.",
                                );
                            }
                          } else {
                            setSubmitError(
                              "An error occurred while starting voting. Please try again.",
                            );
                          }
                          setShowSuccessMessage(false); // Clear success message on new error
                          setSuccessMessage("");
                        }
                      }}
                    >
                      End Pooling & Start Voting
                    </Button>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
      {/* Movie details modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isInWatchlist={userWatchlist.some(
            (m) => m.movieId === selectedMovie.movieId,
          )}
          isInSeenList={userWatched.some(
            (m) => m.movieId === selectedMovie.movieId,
          )}
          onAddToWatchlist={handleAddToWatchlist}
        />
      )}
    </>
  );
};

export default MoviePool;
