"use client";

import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Added useEffect
import { useApi } from "@/app/hooks/useApi";
import { retry } from "src/utils/retry";
import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import { usePhaseCheck } from "@/app/hooks/usePhaseCheck";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import type { ApplicationError } from "@/app/types/error";
import ConfirmationDialog from "@/components/ui/confirmation_dialog";
import { User } from "@/app/types/user";

// Define interfaces for the data coming from the backend
interface MovieAverageRankDTO {
  movie: Movie;
  averageRank: number | null;
}

// Combined result from server
interface RankingResultsDTO {
  resultId: number;
  groupId: number;
  calculatedAt: string;
  winningMovie: Movie;
  numberOfVoters: number;
  detailedResults: MovieAverageRankDTO[];
}

// Define interface for watched movies without using any
interface WatchedMovieDTO {
  movieId: number;
  id?: number;
}

const Results: React.FC = () => {
  const params = useParams();
  let { id, groupId } = params as {
    id?: string | string[];
    groupId?: string | string[];
  };
  if (Array.isArray(id)) id = id[0];
  if (Array.isArray(groupId)) groupId = groupId[0];
  const {
    group: phaseGroup,
    phase: phaseFromHook,
    loading: phaseLoading,
    error: phaseError,
  } = useGroupPhase(groupId as string);

  // Check for phase changes in the background
  usePhaseCheck(groupId, phaseFromHook);

  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);
  const [rankingResult, setRankingResult] = useState<RankingResultsDTO | null>(
    null,
  );
  const [detailedResults, setDetailedResults] = useState<MovieAverageRankDTO[]>(
    [],
  );
  const [resultsLoading, setResultsLoading] = useState(true);
  const [winningMovieLoading, setWinningMovieLoading] = useState(true);
  const [isOverallLoading, setIsOverallLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // State for User Profile (watchlist/seenlist)
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  // State for Confirmation Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [confirmDialogMovie, setConfirmDialogMovie] = useState<Movie | null>(
    null,
  );
  const apiService = useApi();

  // Fetch current user's profile data
  useEffect(() => {
    if (userId) {
      setProfileLoading(true);
      const fetchProfile = async () => {
        try {
          const profileData = await retry(() =>
            apiService.get<User>(`/users/${userId}/profile`)
          );
          setCurrentUserProfile(profileData);
        } catch (err) {
          console.error("ResultsPage: Error fetching user profile:", err);
          setError(
            "Could not load your profile data. Some actions might be affected.",
          );
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    }
  }, [userId, apiService]);

  // ANI CHANGE: Added state to track adding movies to watched list
  const [isAddingToWatchedList, setIsAddingToWatchedList] = useState<boolean>(
    false,
  );
  // ANI CHANGE: Added state to track if movie was already added to watched list
  const [movieAddedToWatchedList, setMovieAddedToWatchedList] = useState<
    boolean
  >(false);

  // Full winning movie details (fetch for posterURL)
  const [fullWinningMovie, setFullWinningMovie] = useState<Movie | null>(null);
  useEffect(() => {
    // If we have results and a winning movie with an ID, fetch more details
    if (
      rankingResult && rankingResult.winningMovie &&
      rankingResult.winningMovie.movieId
    ) {
      setWinningMovieLoading(true);
      apiService
        .get<Movie>(`/movies/${rankingResult.winningMovie.movieId}`)
        .then((movie) => setFullWinningMovie(movie))
        .catch((err) => {
          console.error("Failed to fetch full movie data:", err);
          setError(
            "Failed to load details for the winning movie. Results might be incomplete.",
          );
        })
        .finally(() => setWinningMovieLoading(false));
    } else {
      // If we have results but no winning movie (e.g., no voters), ensure loading is set to false
      setWinningMovieLoading(false);
    }
  }, [apiService, rankingResult]);

  // Fetch combined results once RESULTS phase
  useEffect(() => {
    const fetchCombined = async () => {
      if (!groupId || !id || phaseFromHook !== "RESULTS") {
        return;
      }

      setResultsLoading(true);

      // Add a small delay to ensure consistent loading behavior
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const response = await retry(() =>
          apiService.get<RankingResultsDTO>(
            `/groups/${groupId}/rankings/results`,
          )
        );
        setRankingResult(response);
        setDetailedResults(response.detailedResults || []);
        setActionMessage("Results loaded successfully");
        setShowActionMessage(true);
        setError(""); // Clear error on success
      } catch (err: unknown) {
        console.error("Failed to fetch combined results:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 404) {
            // This may be because no one voted - still show results page but with a message
            // Create a placeholder empty movie object that conforms to the Movie type
            const emptyMovie: Movie = {
              movieId: 0,
              title: "No Movie Selected",
              posterURL: "",
              description: "No votes were cast during the voting phase.",
              genres: [],
              directors: [],
              actors: [],
              trailerURL: "",
              year: 0,
              originallanguage: "en",
            };

            setRankingResult({
              resultId: 0,
              groupId: parseInt(groupId as string),
              calculatedAt: new Date().toISOString(),
              winningMovie: emptyMovie,
              numberOfVoters: 0,
              detailedResults: [],
            });
            setDetailedResults([]);
            setError(
              "No votes were cast during the voting phase. You might want to restart the movie selection process.",
            );
          } else if (appErr.status === 409) {
            setError("Results can only be viewed after voting has ended.");
          } else {
            setError(
              "An error occurred while loading results. Please try again.",
            );
          }
        } else {
          setError(
            "An error occurred while loading results. Please try again.",
          );
        }
        setShowActionMessage(false); // Clear success on new error
        setActionMessage("");
      } finally {
        setResultsLoading(false);
        // setIsOverallLoading is now handled by the central useEffect
      }
    };

    // Only fetch results when we're in the RESULTS phase and phase data is loaded
    if (!phaseLoading && phaseFromHook === "RESULTS") {
      fetchCombined();
    }
  }, [id, groupId, phaseFromHook, apiService, phaseLoading]);

  // ANI CHANGE: useEffect to check if the movie is already in the watched list on load
  useEffect(() => {
    const checkIfMovieIsWatched = async () => {
      if (fullWinningMovie && userId && apiService) {
        try {
          const response = await apiService.get(`/users/${userId}/watched`);
          let watchedMoviesList: WatchedMovieDTO[] = [];
          if (Array.isArray(response)) {
            watchedMoviesList = response;
          } else if (
            response &&
            typeof response === "object" &&
            Array.isArray((response as { data: WatchedMovieDTO[] }).data)
          ) {
            watchedMoviesList = (response as { data: WatchedMovieDTO[] }).data;
          }

          if (fullWinningMovie.movieId) {
            const isWatched = watchedMoviesList.some(
              (movie: WatchedMovieDTO) =>
                movie.movieId === fullWinningMovie.movieId ||
                movie.id === fullWinningMovie.movieId, // Check both movieId and id just in case
            );
            if (isWatched) {
              setMovieAddedToWatchedList(true);
            }
          }
        } catch (err) {
          console.error("Error fetching watched movies:", err);
        }
      }
    };

    checkIfMovieIsWatched();
  }, [fullWinningMovie, userId, apiService]); // Dependencies for the useEffect hook

  // --- Confirmation Dialog Handlers ---
  const refreshUserProfile = async () => {
    if (userId) {
      try {
        const profileData = await retry(() =>
          apiService.get<User>(`/users/${userId}/profile`)
        );
        setCurrentUserProfile(profileData);
      } catch (err) {
        console.error("ResultsPage: Error refreshing user profile:", err);
      }
    }
  };

  const handleDialogConfirmKeep = async () => {
    if (!confirmDialogMovie || !userId) return;
    setIsAddingToWatchedList(true);
    try {
      await retry(() =>
        apiService.post(`/users/${userId}/seenMovies`, {
          movieId: confirmDialogMovie.movieId,
        })
      );
      setMovieAddedToWatchedList(true);
      setActionMessage(
        `'${confirmDialogMovie.title}' marked as seen and kept in watchlist.`,
      );
      setShowActionMessage(true);
      await refreshUserProfile();
    } catch (err) {
      console.error("Error in handleDialogConfirmKeep:", err);
      setActionMessage("Failed to update movie status.");
      setShowActionMessage(true);
    } finally {
      setIsAddingToWatchedList(false);
      setShowConfirmDialog(false);
      setConfirmDialogMovie(null);
    }
  };

  const handleDialogCancelRemove = async () => {
    if (!confirmDialogMovie || !userId) return;
    setIsAddingToWatchedList(true);
    try {
      await retry(() =>
        apiService.post(`/users/${userId}/seenMovies`, {
          movieId: confirmDialogMovie.movieId,
        })
      );
      await retry(() =>
        apiService.delete(
          `/users/${userId}/watchlist/${confirmDialogMovie.movieId}`,
        )
      );
      setMovieAddedToWatchedList(true);
      setActionMessage(
        `'${confirmDialogMovie.title}' marked as seen and removed from watchlist.`,
      );
      setShowActionMessage(true);
      await refreshUserProfile();
    } catch (err) {
      console.error("Error in handleDialogCancelRemove:", err);
      setActionMessage("Failed to update movie status.");
      setShowActionMessage(true);
    } finally {
      setIsAddingToWatchedList(false);
      setShowConfirmDialog(false);
      setConfirmDialogMovie(null);
    }
  };

  // ANI CHANGE: New function to add the winning movie to the current user's watched list
  const addToMyWatchedList = async () => {
    if (profileLoading || !fullWinningMovie || !currentUserProfile) {
      setActionMessage("Profile data is loading, please wait...");
      setShowActionMessage(true);
      return;
    }

    const movieInWatchlist = currentUserProfile.watchlist?.some((m: Movie) =>
      m.movieId === fullWinningMovie.movieId
    );
    const movieInSeenlist = currentUserProfile.watchedMovies?.some((m: Movie) =>
      m.movieId === fullWinningMovie.movieId
    );

    if (movieInWatchlist && !movieInSeenlist) {
      setConfirmDialogMovie(fullWinningMovie);
      setShowConfirmDialog(true);
      return;
    }

    if (!fullWinningMovie || isAddingToWatchedList || movieAddedToWatchedList) {
      return;
    }

    setIsAddingToWatchedList(true);
    setActionMessage("Marking movie as seen. Please wait...");
    setShowActionMessage(true);

    try {
      const movieId = fullWinningMovie.movieId;

      await apiService.post(`/users/${userId}/watched/${movieId}`, {});

      setActionMessage("Marked winning movie as seen!");
      setMovieAddedToWatchedList(true);
      setError("");
    } catch (error) {
      console.error("Error marking movie as seen:", error);

      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        if (appErr.status === 409) {
          setActionMessage(
            "This movie is already marked as seen in your profile page!",
          );
          setMovieAddedToWatchedList(true);
        } else {
          setError("Failed to mark movie as seen");
        }
      } else {
        setError("Failed to mark movie as seen");
      }
      setShowActionMessage(false);
      setActionMessage("");
    } finally {
      setIsAddingToWatchedList(false);
    }
  };

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setError(phaseError as string);

      setShowActionMessage(false); // Clear success on new error
      setActionMessage("");
      return;
    }
    if (phaseFromHook && phaseFromHook !== "RESULTS") {
      if (phaseFromHook === "POOLING") {
        router.replace(`/users/${userId}/groups/${groupId}/pool`);
      } else if (phaseFromHook === "VOTING") {
        router.replace(`/users/${userId}/groups/${groupId}/vote`);
      }
      return;
    }
    // Keep loading true until data is fetched
  }, [phaseFromHook, phaseLoading, phaseError, router, userId, groupId]);

  useEffect(() => {
    if (phaseError) {
      setError(phaseError as string);
      setShowActionMessage(false);
      setActionMessage("");
      // Also ensure loading is stopped
    }
  }, [phaseError]);

  // Helper function to get complete image URL
  useEffect(() => {
    if (
      phaseLoading || profileLoading || resultsLoading || winningMovieLoading
    ) {
      setIsOverallLoading(true);
    } else {
      setIsOverallLoading(false);
    }
  }, [phaseLoading, profileLoading, resultsLoading, winningMovieLoading]);

  const getFullPosterUrl = (posterPath?: string | null): string => {
    // No poster provided, use placeholder
    if (!posterPath) {
      return "https://via.placeholder.com/250x375?text=No+Image";
    }
    // If already a full URL, return as is
    if (posterPath.startsWith("http")) {
      return posterPath;
    }
    // Prefix TMDB base path for relative poster paths
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  // Helper function to format the average rank for display
  /* const formatAverageRank = (rank: number | null): string => {
    if (rank === null) return "N/A";
    return rank.toFixed(2);
  };*/

  // Helper function to render projector icons
  const renderProjectors = (count: number) => {
    return (
      <span>
        {Array.from({ length: count }).map((_, idx) => (
          <img
            key={idx}
            src="/Projector.png"
            alt="Projector"
            style={{
              display: "inline-block",
              width: 32,
              height: 32,
              marginRight: 4,
            }}
          />
        ))}
      </span>
    );
  };

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar Navigation - always visible even during loading */}
      <Navigation userId={userId} activeItem="Movie Groups" />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <div>
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {phaseGroup
                ? `Final Movie Ranking - ${phaseGroup.groupName}`
                : "Final Movie Ranking"}
            </h1>
            {
              /* <p className="text-[#b9c0de] mt-2">
              See what your group has chosen to watch
            </p> */
            }
          </div>
        </div>

        {/* Conditional rendering for loading state */}
        {isOverallLoading
          ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
              </div>
            </div>
          )
          : (
            <>
              {/* Error display - only shown AFTER overall loading is false */}
              {error && (
                <ErrorMessage
                  message={error}
                  onClose={() => setError("")}
                />
              )}

              {/* Success message box - also shown AFTER overall loading */}
              <ActionMessage
                message={actionMessage}
                isVisible={showActionMessage}
                onHide={() => setShowActionMessage(false)}
                className="bg-green-500"
              />

              {/* Winner Section */}
              <div className="flex flex-col items-center justify-center text-center mb-12">
                {phaseFromHook !== "RESULTS"
                  ? (
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                      <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                        Results Not Available Yet
                      </h2>
                      <p className="text-[#3b3e88]/60 mb-4">
                        The results will be available once the group enters the
                        RESULTS phase.
                      </p>
                      <p className="text-[#3b3e88]/60">
                        Please check back later!
                      </p>
                    </div>
                  )
                  : rankingResult
                  ? (
                    <>
                      <h2 className="font-semibold text-[#3b3e88] text-2xl mb-6">
                        And the winner is...
                      </h2>
                      <div className="relative w-[200px] h-[300px] md:w-[250px] md:h-[375px] rounded-lg shadow-lg overflow-hidden mb-4">
                        <img
                          src={getFullPosterUrl(
                            fullWinningMovie?.posterURL ??
                              rankingResult?.winningMovie?.posterURL,
                          )}
                          alt={fullWinningMovie?.title ||
                            rankingResult?.winningMovie?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h2 className="font-semibold text-[#3b3e88] text-2xl mt-4">
                        {fullWinningMovie?.title ||
                          rankingResult?.winningMovie?.title}
                      </h2>

                      {detailedResults.length > 0 && (
                        <p className="text-[#3b3e88] text-lg mt-2">
                          With a score of {renderProjectors(
                            detailedResults.findIndex(
                                (item) =>
                                  item.movie.movieId ===
                                    rankingResult.winningMovie.movieId,
                              ) !== -1
                              ? detailedResults.length -
                                detailedResults.findIndex(
                                  (item) =>
                                    item.movie.movieId ===
                                      rankingResult.winningMovie.movieId,
                                )
                              : 0,
                          )}
                          {
                            /*OLD:
                  With an average rank of{" "}
                  {formatAverageRank(
                    detailedResults.find(
                      (item) =>
                        item.movie.movieId ===
                          rankingResult?.winningMovie?.movieId
                    )?.averageRank || null
                  )}
                  */
                          }
                          !
                        </p>
                      )}

                      <p className="text-[#3b3e88]/60 mt-2">
                        Based on votes from {rankingResult.numberOfVoters}{" "}
                        group members
                      </p>

                      {/* ANI CHANGE: Added button to add winning movie to all members' watchedlists */}
                      <div className="mt-6">
                        <Button
                          onClick={addToMyWatchedList}
                          disabled={!fullWinningMovie ||
                            resultsLoading || // Changed from loading
                            isOverallLoading || // Also consider overall loading state
                            !!error ||
                            movieAddedToWatchedList ||
                            isAddingToWatchedList}
                          className="bg-[#7824ec] hover:bg-opacity-90"
                        >
                          {movieAddedToWatchedList
                            ? "Movie marked as seen ✓"
                            : "Mark movie as seen"}
                        </Button>
                      </div>
                    </>
                  )
                  : (
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                      <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                        No Results Available
                      </h2>
                      <p className="text-[#3b3e88]/60">
                        {`It looks like no one from the group "${phaseGroup?.groupName}" voted.`}
                      </p>
                      {
                        /* <p className="text-[#b9c0de]">
                Check back later to see the winning movie!
              </p> */
                      }
                    </div>
                  )}
              </div>

              {/* All Rankings Section (if we have detailed results) */}
              {detailedResults.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                    All Rankings
                  </h2>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-[#3b3e88]">
                            Rank
                          </th>
                          <th className="text-left py-2 text-[#3b3e88]">
                            Movie
                          </th>
                          <th className="text-right py-2 text-[#3b3e88]">
                            Final Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedResults.map((item, index) => (
                          <tr
                            key={item.movie.movieId}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 text-[#3b3e88]">{index + 1}</td>
                            <td className="py-2 text-[#3b3e88]">
                              {item.movie.title}
                            </td>
                            <td className="py-2 text-right text-[#3b3e88]">
                              {renderProjectors(detailedResults.length - index)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/users/${userId}/groups`)}
                >
                  Back to Group Overview
                </Button>
                <Button
                  onClick={() => router.push(`/users/${userId}/dashboard`)}
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}

        {/* Confirmation Dialog for marking movie in watchlist as seen */}
        {confirmDialogMovie && (
          <ConfirmationDialog
            isOpen={showConfirmDialog}
            onClose={() => {
              setShowConfirmDialog(false);
              setConfirmDialogMovie(null);
            }}
            onConfirm={handleDialogConfirmKeep} // Yes, keep it
            onCancel={handleDialogCancelRemove} // No, remove it
            title={`Mark '${confirmDialogMovie.title}' as seen:`}
            message={`'${confirmDialogMovie.title}' is already in your watchlist. Do you want to keep it there after marking it as seen?`}
            confirmText="Yes, keep in watchlist"
            cancelText="No, remove from watchlist"
          />
        )}
      </div>
    </div>
  );
};

export default Results;
