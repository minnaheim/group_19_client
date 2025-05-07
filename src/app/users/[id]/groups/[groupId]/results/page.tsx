"use client";

import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/app/hooks/useApi";
import { retry } from "src/utils/retry";
import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import type { ApplicationError } from "@/app/types/error";
import { User } from "@/app/types/user"; // ANI CHANGE: Added User import

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

const Results: React.FC = () => {
  const params = useParams();
  let { id, groupId } = params as {
    id?: string | string[];
    groupId?: string | string[];
  };
  if (Array.isArray(id)) id = id[0];
  if (Array.isArray(groupId)) groupId = groupId[0];
  const { phase: phaseFromHook, loading: phaseLoading, error: phaseError } =
      useGroupPhase(groupId as string);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const [rankingResult, setRankingResult] = useState<
      RankingResultsDTO | null
  >(null);
  const [detailedResults, setDetailedResults] = useState<MovieAverageRankDTO[]>(
      [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const apiService = useApi();

  // ANI CHANGE: Added state to track adding movies to watchlists
  const [isAddingToWatchlists, setIsAddingToWatchlists] = useState<boolean>(false);

  // Full winning movie details (fetch for posterURL)
  const [fullWinningMovie, setFullWinningMovie] = useState<Movie | null>(null);
  useEffect(() => {
    if (rankingResult) {
      apiService.get<Movie>(`/movies/${rankingResult.winningMovie.movieId}`)
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
                `/groups/${groupId}/rankings/results`,
            )
        );
        setRankingResult(response);
        setDetailedResults(response.detailedResults);
        setActionMessage("Results loaded successfully");
        setShowActionMessage(true);
      } catch (err: unknown) {
        console.error("Failed to fetch combined results:", err);
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 404) {
            setError(
                "Could not find the group or results are not yet available.",
            );
          } else if (appErr.status === 409) {
            setError("Results can only be viewed after voting has ended.");
          } else {setError(
              "An error occurred while loading results. Please try again.",
          );}
        } else {
          setError(
              "An error occurred while loading results. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCombined();
  }, [apiService, groupId, id, phaseFromHook]);

  // ANI CHANGE: Added function to add movie to all members' watchlists
  const addMovieToAllMembersWatchlists = async () => {
    if (!fullWinningMovie || isAddingToWatchlists) return;

    setIsAddingToWatchlists(true);
    setActionMessage("Adding movie to all members' watchlists...");
    setShowActionMessage(true);

    try {
      // Get group members
      const members = await apiService.get<User[]>(`/groups/${groupId}/members`);
      const movieId = fullWinningMovie.movieId;
      let successCount = 0;

      // Add movie to each member's watchlist
      for (const member of members) {
        try {
          await apiService.post(`/users/${member.userId}/watchlist/${movieId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to add movie to ${member.username}'s watchlist:`, error);
        }
      }

      setActionMessage(`Added winning movie to ${successCount} of ${members.length} members' watchlists`);
    } catch (error) {
      console.error("Error adding movie to watchlists:", error);
      setActionMessage("Failed to add movie to members' watchlists");
    } finally {
      setIsAddingToWatchlists(false);
      setShowActionMessage(true);
    }
  };

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setError(phaseError);
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
                Movie Ranking Results
              </h1>
              <p className="text-[#b9c0de] mt-2">
                See what your group has chosen to watch
              </p>
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
            {phaseFromHook !== "RESULTS"
                ? (
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                      <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                        Results Not Available Yet
                      </h2>
                      <p className="text-[#b9c0de] mb-4">
                        The results will be available once the group enters the
                        RESULTS phase.
                      </p>
                      <p className="text-[#b9c0de]">
                        Please check back later!
                      </p>
                    </div>
                )
                : loading
                    ? <p className="text-[#b9c0de] text-lg mt-2">Loading results...</p>
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
                                        rankingResult.winningMovie.posterURL,
                                    )}
                                    alt={fullWinningMovie?.title ||
                                        rankingResult.winningMovie.title}
                                    className="w-full h-full object-cover"
                                />
                              </div>
                              <h2 className="font-semibold text-[#3b3e88] text-2xl mt-4">
                                {fullWinningMovie?.title || rankingResult.winningMovie.title}
                              </h2>

                              {detailedResults.length > 0 && (
                                  <p className="text-[#b9c0de] text-lg mt-2">
                                    With an average rank of {formatAverageRank(
                                      detailedResults.find((item) =>
                                          item.movie.movieId ===
                                          rankingResult.winningMovie.movieId
                                      )?.averageRank || null,
                                  )}!
                                  </p>
                              )}

                              <p className="text-[#b9c0de] mt-2">
                                Based on votes from {rankingResult.numberOfVoters}{" "}
                                group members
                              </p>

                              {/* ANI CHANGE: Added button to add winning movie to all members' watchlists */}
                              <div className="mt-6">
                                <Button
                                    onClick={addMovieToAllMembersWatchlists}
                                    disabled={isAddingToWatchlists}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  {isAddingToWatchlists
                                      ? "Adding to watchlists..."
                                      : "Add to all members' watchlists"}
                                </Button>
                              </div>
                            </>
                        )
                        : (
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
                        Average Score
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
                            {formatAverageRank(item.averageRank)}
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
