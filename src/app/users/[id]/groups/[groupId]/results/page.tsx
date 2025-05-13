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
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import type { ApplicationError } from "@/app/types/error";

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
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const [rankingResult, setRankingResult] = useState<RankingResultsDTO | null>(
    null
  );
  const [detailedResults, setDetailedResults] = useState<MovieAverageRankDTO[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const apiService = useApi();

  // ANI CHANGE: Added state to track adding movies to watched list
  const [isAddingToWatchedList, setIsAddingToWatchedList] =
    useState<boolean>(false);
  // ANI CHANGE: Added state to track if movie was already added to watched list
  const [movieAddedToWatchedList, setMovieAddedToWatchedList] =
    useState<boolean>(false);

  // Full winning movie details (fetch for posterURL)
  const [fullWinningMovie, setFullWinningMovie] = useState<Movie | null>(null);
  useEffect(() => {
    if (rankingResult) {
      apiService
        .get<Movie>(`/movies/${rankingResult.winningMovie.movieId}`)
        .then((movie) => setFullWinningMovie(movie))
        .catch((err) => console.error("Failed to fetch full movie data:", err));
    }
  }, [apiService, rankingResult]);

  // Fetch combined results once RESULTS phase
  useEffect(() => {
    const fetchCombined = async () => {
      if (!groupId || !id || phaseFromHook !== "RESULTS") return;
      try {
        setLoading(true);
        const response = await retry(() =>
          apiService.get<RankingResultsDTO>(
            `/groups/${groupId}/rankings/results`
          )
        );
        setRankingResult(response);
        setDetailedResults(response.detailedResults);
        setActionMessage("Results loaded successfully");
        setShowActionMessage(true);
        setError(""); // Clear error on success
      } catch (err: unknown) {
        console.error("Failed to fetch combined results:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 404) {
            setError(
              "Could not find the group or results are not yet available."
            );
          } else if (appErr.status === 409) {
            setError("Results can only be viewed after voting has ended.");
          } else {
            setError(
              "An error occurred while loading results. Please try again."
            );
          }
        } else {
          setError(
            "An error occurred while loading results. Please try again."
          );
        }
        setShowActionMessage(false); // Clear success on new error
        setActionMessage("");
      } finally {
        setLoading(false);
      }
    };
    fetchCombined();
  }, [apiService, groupId, id, phaseFromHook]);

  // ANI CHANGE: useEffect to check if the movie is already in the watched list on load
  useEffect(() => {
    const checkIfMovieIsWatched = async () => {
      if (fullWinningMovie && userId && apiService) {
        // Ensure apiService is defined
        try {
          // Assuming apiService.get returns the data directly or data wrapped in a response object
          // Adjust based on your apiService implementation
          const response = await apiService.get(`/users/${userId}/watched`);
          // ANI CHANGE: Refactor watchedMovies assignment to safely access response.data
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
                movie.id === fullWinningMovie.movieId // Check both movieId and id just in case
            );
            if (isWatched) {
              setMovieAddedToWatchedList(true);
            }
          }
        } catch (err) {
          console.error("Error fetching watched movies:", err);
          //setActionMessage("Could not verify watched status.");
          //setShowActionMessage(true);
        }
      }
    };

    checkIfMovieIsWatched();
  }, [fullWinningMovie, userId, apiService]); // Dependencies for the useEffect hook

  // ANI CHANGE: New function to add the winning movie to the current user's watched list
  const addToMyWatchedList = async () => {
    if (!fullWinningMovie || isAddingToWatchedList || movieAddedToWatchedList) {
      return;
    }

    setIsAddingToWatchedList(true);
    setActionMessage("Marking movie as seen. Please wait...");
    setShowActionMessage(true);

    try {
      const movieId = fullWinningMovie.movieId;

      // Add movie to user's watched list
      await apiService.post(`/users/${userId}/watched/${movieId}`, {});

      setActionMessage("Marked winning movie as seen!");
      setMovieAddedToWatchedList(true); // Mark as added to prevent duplicate additions
      setError(""); // Clear error on success
    } catch (error) {
      console.error("Error marking movie as seen:", error);

      // ANI CHANGE: Check for the specific error that indicates the movie is already in the watched list
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        if (appErr.status === 409) {
          setActionMessage(
            "This movie is already marked as seen in your profile page!"
          );
          setMovieAddedToWatchedList(true); // Mark as added since it's already there
        } else {
          setError("Failed to mark movie as seen");
        }
      } else {
        setError("Failed to mark movie as seen");
      }
      setShowActionMessage(false); // Clear success on new error
      setActionMessage("");
    } finally {
      setIsAddingToWatchedList(false);
      setShowActionMessage(true);
    }
  };

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setError(phaseError as string);
      setShowActionMessage(false); // Clear success on new error
      setActionMessage("");
      setLoading(false);
      return;
    }
    if (phaseFromHook && phaseFromHook !== "RESULTS") {
      if (phaseFromHook === "POOL") {
        router.replace(`/users/${userId}/groups/${groupId}/pool`);
      } else if (phaseFromHook === "VOTING") {
        router.replace(`/users/${userId}/groups/${groupId}/vote`);
      }
    }
  }, [phaseFromHook, phaseLoading, phaseError, router, userId, groupId]);

  useEffect(() => {
    if (phaseError) {
      setError(phaseError as string);
      setShowActionMessage(false);
      setActionMessage("");
      setLoading(false); // Also ensure loading is stopped
    }
  }, [phaseError]);

  // Helper function to get complete image URL
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
  const formatAverageRank = (rank: number | null): string => {
    if (rank === null) return "N/A";
    return rank.toFixed(2);
  };

  // Helper function to render projector icons
  const renderProjectors = (count: number) => {
    return (
      <span>
        {Array.from({ length: count }).map((_, idx) => (
          <img
            key={idx}
            src="/projector.png"
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
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem="Movie Groups" />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <div>
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {phaseGroup
                ? `${phaseGroup.groupName} - Final Movie Ranking`
                : "Final Movie Ranking"}
            </h1>
            {/* <p className="text-[#b9c0de] mt-2">
              See what your group has chosen to watch
            </p> */}
          </div>
        </div>

        {/* Error display */}
        {error && <ErrorMessage message={error} onClose={() => setError("")} />}

        {/* Success message box */}
        <ActionMessage
          message={actionMessage}
          isVisible={showActionMessage}
          onHide={() => setShowActionMessage(false)}
          className="bg-green-500"
        />

        {/* Winner Section */}
        <div className="flex flex-col items-center justify-center text-center mb-12">
          {phaseFromHook !== "RESULTS" ? (
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                Results Not Available Yet
              </h2>
              <p className="text-[#b9c0de] mb-4">
                The results will be available once the group enters the RESULTS
                phase.
              </p>
              <p className="text-[#b9c0de]">Please check back later!</p>
            </div>
          ) : loading ? (
            <p className="text-[#b9c0de] text-lg mt-2">Loading results...</p>
          ) : rankingResult ? (
            <>
              <h2 className="font-semibold text-[#3b3e88] text-2xl mb-6">
                And the winner is...
              </h2>
              <div className="relative w-[200px] h-[300px] md:w-[250px] md:h-[375px] rounded-lg shadow-lg overflow-hidden mb-4">
                <img
                  src={getFullPosterUrl(
                    fullWinningMovie?.posterURL ??
                      rankingResult.winningMovie.posterURL
                  )}
                  alt={
                    fullWinningMovie?.title || rankingResult.winningMovie.title
                  }
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-semibold text-[#3b3e88] text-2xl mt-4">
                {fullWinningMovie?.title || rankingResult.winningMovie.title}
              </h2>

              {detailedResults.length > 0 && (
                <p className="text-[#b9c0de] text-lg mt-2">
                  With an average rank of{" "}
                  {formatAverageRank(
                    detailedResults.find(
                      (item) =>
                        item.movie.movieId ===
                        rankingResult.winningMovie.movieId
                    )?.averageRank || null
                  )}
                  !
                </p>
              )}

              <p className="text-[#b9c0de] mt-2">
                Based on votes from {rankingResult.numberOfVoters} group members
              </p>

              {/* ANI CHANGE: Added button to add winning movie to all members' watchedlists */}
              <div className="mt-6">
                <Button
                  onClick={addToMyWatchedList}
                  disabled={
                    !fullWinningMovie ||
                    loading ||
                    !!error ||
                    movieAddedToWatchedList ||
                    isAddingToWatchedList
                  }
                  className="bg-[#7824ec] hover:bg-opacity-90"
                >
                  {movieAddedToWatchedList
                    ? "Movie marked as seen ✓"
                    : "Mark movie as seen"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                No Results Available Yet
              </h2>
              <p className="text-[#b9c0de] mb-4">
                It looks like the voting period is still ongoing or not enough
                members have voted yet.
              </p>
              <p className="text-[#b9c0de]">
                Check back later to see the winning movie!
              </p>
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
                    <th className="text-left py-2 text-[#3b3e88]">Rank</th>
                    <th className="text-left py-2 text-[#3b3e88]">Movie</th>
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
            Back to group overview
          </Button>
          <Button onClick={() => router.push(`/users/${userId}/dashboard`)}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
