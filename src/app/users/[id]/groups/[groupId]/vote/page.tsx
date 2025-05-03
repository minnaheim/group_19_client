"use client";

import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Movie } from "@/app/types/movie";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import { Trash2 } from "lucide-react"; // Import icons
import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { VoteStateDTO } from "@/app/types/vote";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import type { ApplicationError } from "@/app/types/error";

// Define types to match backend DTOs
interface RankingSubmitDTO {
  movieId: number; // Must be a number, not a string
  rank: number; // Must be a positive integer
}

// History state for undo functionality
interface HistoryState {
  availableMovies: Movie[];
  rankings: (Movie | null)[];
}

// SortableItem Component
const SortableItem: React.FC<{
  id: string;
  children: React.ReactNode;
  onRemove?: () => void;
}> = ({ id, children, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-[120px] h-[180px] bg-white rounded-lg shadow-md flex flex-col items-center justify-center relative"
    >
      {children}
      {/* Only show remove button if onRemove is provided */}
      {onRemove && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-red-100"
          title="Remove from ranking"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      )}
    </div>
  );
};

const Vote: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { groupId } = useParams();
  const { group: phaseGroup, phase, loading: phaseLoading, error: phaseError } =
    useGroupPhase(groupId as string);
  const router = useRouter();
  const apiService = useApi();
  // PHASE GUARD: fetch and check phase
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [rankings, setRankings] = useState<(Movie | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setError(phaseError);
      return;
    }
    if (phase && phase !== "VOTING") {
      if (phase === "POOL") {
        router.replace(`/users/${userId}/groups/${groupId}/pool`);
      }
      if (phase === "RESULTS") {
        router.replace(`/users/${userId}/groups/${groupId}/results`);
      }
    }
  }, [phase, phaseLoading, phaseError, router, userId, groupId]);

  // Load vote state (pool + existing rankings)
  useEffect(() => {
    if (phase !== "VOTING" || !groupId || !userId) return;
    (async () => {
      let state: VoteStateDTO;
      try {
        state = await apiService.get<VoteStateDTO>(
          `/groups/${groupId}/vote-state`,
        );
      } catch (err: unknown) {
        if (err instanceof Error && "status" in err) {
          const appErr = err as ApplicationError;
          switch (appErr.status) {
            case 401:
              setError(
                "Your session has expired. Please log in again to view the vote state.",
              );
              break;
            case 404:
              setError("Could not find the group or you are not a member.");
              break;
            case 409:
              setError("Voting is not currently active for this group.");
              break;
            default:
              setError(
                "An error occurred while loading vote state. Please try again.",
              );
          }
        } else {
          setError(
            "An error occurred while loading vote state. Please try again.",
          );
        }
        return;
      }
      const movies = state.pool;
      const slots = Math.min(5, movies.length);
      const initial: (Movie | null)[] = Array(slots).fill(null);
      let pool = [...movies];
      if (state.rankings?.length) {
        state.rankings.forEach(({ movieId, rank }) => {
          const i = rank - 1;
          const found = movies.find((m) => m.movieId === movieId);
          if (found && i >= 0 && i < slots) {
            initial[i] = found;
            pool = pool.filter((m) => m.movieId !== movieId);
          }
        });
        setHasSubmitted(true);
      }
      setAvailableMovies(pool);
      setRankings(initial);
      setHistory([{ availableMovies: pool, rankings: initial }]);
    })();
  }, [phase, groupId, userId]);

  // Save current state to history before making changes
  const saveToHistory = () => {
    setHistory((prev) => [
      ...prev,
      {
        availableMovies: [...availableMovies],
        rankings: [...rankings],
      },
    ]);
  };

  // Handle direct removal of a movie from ranking
  const handleRemoveFromRanking = (rankIndex: number) => {
    console.log("remove from ranking slot", rankIndex, rankings[rankIndex]);
    saveToHistory();

    const movedMovie = rankings[rankIndex];
    if (!movedMovie) return;
    // Add back to pool using functional update
    setAvailableMovies((prev) => [...prev, movedMovie]);
    // Remove from ranking using functional update
    setRankings((prev) => prev.map((m, i) => (i === rankIndex ? null : m)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    // Save current state to history before making changes
    saveToHistory();

    // Movie pool item to ranking slot
    if (activeIdStr.startsWith("pool-") && overIdStr.startsWith("rank-")) {
      const movieIndex = parseInt(activeIdStr.replace("pool-", ""));
      const rankIndex = parseInt(overIdStr.replace("rank-", ""));

      if (rankings[rankIndex] === null) {
        // Copy the movie to ranking
        const newRankings = [...rankings];
        newRankings[rankIndex] = availableMovies[movieIndex];
        setRankings(newRankings);

        // Remove from available pool
        const newAvailableMovies = [...availableMovies];
        newAvailableMovies.splice(movieIndex, 1);
        setAvailableMovies(newAvailableMovies);
      } else {
        // If there's already a movie in the slot, swap with the pool movie
        const newRankings = [...rankings];
        const existingMovie = newRankings[rankIndex];
        newRankings[rankIndex] = availableMovies[movieIndex];

        // Remove the dragged movie from the pool
        const newAvailableMovies = [...availableMovies];
        newAvailableMovies.splice(movieIndex, 1);

        // Add the existing movie to the pool
        if (existingMovie) {
          newAvailableMovies.push(existingMovie);
        }

        setRankings(newRankings);
        setAvailableMovies(newAvailableMovies);
      }
    } // Ranking slot to movie pool (remove from ranking)
    else if (activeIdStr.startsWith("rank-") && overIdStr === "movie-pool") {
      const rankIndex = parseInt(activeIdStr.replace("rank-", ""));
      const movedMovie = rankings[rankIndex];

      if (movedMovie) {
        // Add back to pool
        setAvailableMovies([...availableMovies, movedMovie]);

        // Remove from ranking
        const newRankings = [...rankings];
        newRankings[rankIndex] = null;
        setRankings(newRankings);
      }
    } // Swap between ranking slots
    else if (activeIdStr.startsWith("rank-") && overIdStr.startsWith("rank-")) {
      const fromIndex = parseInt(activeIdStr.replace("rank-", ""));
      const toIndex = parseInt(overIdStr.replace("rank-", ""));

      if (fromIndex !== toIndex) {
        const newRankings = [...rankings];
        const temp = newRankings[fromIndex];
        newRankings[fromIndex] = newRankings[toIndex];
        newRankings[toIndex] = temp;
        setRankings(newRankings);
      }
    }
  };

  // Check if the user has ranked the minimum required movies
  const isSubmitEnabled = () => {
    const filledSlots = rankings.filter((movie) => movie !== null).length;
    const minRequired = Math.min(5, availableMovies.length + filledSlots);
    return filledSlots >= minRequired;
  };

  // Get the error message for ranking requirements
  const getRankingRequirementMessage = () => {
    const filledSlots = rankings.filter((movie) => movie !== null).length;
    const totalMovies = availableMovies.length + filledSlots;

    if (totalMovies < 5) {
      return `Please rank all ${totalMovies} available movies`;
    } else {
      return "Please rank at least 5 movies before submitting";
    }
  };

  const handleSubmitRanking = async () => {
    if (!isSubmitEnabled()) {
      setError(getRankingRequirementMessage());
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate that userId and groupId are valid numbers
      if (!userId || !groupId) {
        setError(
          "Missing user ID or group ID. Please go back to the main page.",
        );
        return;
      }

      // Convert our client-side ranking format to match the backend DTO format
      // Only include non-null rankings
      const validRankings = rankings.filter((movie) => movie !== null);

      const rankingSubmitDTOs: RankingSubmitDTO[] = validRankings.map(
        (movie, index) => {
          // Ensure movieId is a valid integer
          const movieId = movie && movie.movieId
            ? parseInt(String(movie.movieId), 10)
            : null;

          if (isNaN(movieId as number) || movieId === null) {
            throw new Error(`Invalid movie ID for rank ${index + 1}`);
          }

          return {
            movieId: movieId as number,
            rank: index + 1, // Ranks are 1-based (1, 2, 3)
          };
        },
      );

      console.log("Submitting rankings:", JSON.stringify(rankingSubmitDTOs));

      // Make sure the API endpoint is properly formatted
      const endpoint = `/groups/${groupId}/users/${userId}/rankings`;
      console.log(`Sending POST request to: ${endpoint}`, rankingSubmitDTOs);

      // Send the request with proper JSON content
      await apiService.post(endpoint, rankingSubmitDTOs);
      // Acknowledge submission visually
      setSuccessMessage(
        "Rankings submitted successfully! Please wait for results.",
      );
      setShowSuccessMessage(true);
      setHasSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 400:
            setError(
              "There was an issue with your submitted ranks. Please check and try again.",
            );
            break;
          case 404:
            setError(
              "We couldn't find the user or group for submitting ranks.",
            );
            break;
          case 409:
            setError(
              "Voting is not currently open for this group. Rankings cannot be submitted.",
            );
            break;
          default:
            setError(
              "An error occurred while submitting your rankings. Please try again.",
            );
        }
      } else {
        setError(
          "An error occurred while submitting your rankings. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get complete image URL
  const getFullPosterUrl = (posterPath: string) => {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  // Show remove icon only if ranking submitted = false
  const showRemove = (movie: Movie | null) => !!movie && !hasSubmitted;

  const [, setHistory] = useState<HistoryState[]>([]);

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem="Movie Groups" />
      {/* Error display */}
      {error && <ErrorMessage message={error} onClose={() => setError("")} />}
      <ActionMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onHide={() => setShowSuccessMessage(false)}
        className="bg-green-500"
      />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            {phaseGroup
              ? `${phaseGroup.groupName} - Vote for the Movie Night`
              : "Vote for the Movie Night"}
          </h1>
          <p className="text-[#b9c0de] mt-2">
            {availableMovies.length +
                  rankings.filter((m) => m !== null).length < 5
              ? `Please rank all ${
                availableMovies.length +
                rankings.filter((m) => m !== null).length
              } available movies`
              : `Please rank at least 5 movies`}
          </p>
        </div>

        <DndContext
          // sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
        >
          {/* Movie Pool Section */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">Movie Pool</h2>
            <div
              id="movie-pool"
              className="flex flex-wrap gap-4 overflow-x-auto mt-4 p-4 min-h-[200px] bg-[#d9e1ff] rounded-lg"
            >
              {availableMovies.map((movie, index) => (
                <SortableItem key={`pool-${index}`} id={`pool-${index}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-[100px] h-[150px] overflow-hidden rounded-md mb-2">
                      <img
                        src={getFullPosterUrl(movie.posterURL)}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </SortableItem>
              ))}
              {availableMovies.length === 0 && (
                <div className="flex items-center justify-center w-full h-full text-[#3b3e88]">
                  All movies have been ranked or no movies are available.
                </div>
              )}
            </div>
          </div>

          {/* Ranking Section */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">
              Your Ranking
            </h2>
            <div className="flex flex-wrap gap-4 mt-4">
              {rankings.map((movie, index) => (
                <SortableItem
                  key={`rank-${index}`}
                  id={`rank-${index}`}
                  onRemove={showRemove(movie)
                    ? () => handleRemoveFromRanking(index)
                    : undefined}
                >
                  {movie
                    ? (
                      <div className="flex flex-col items-center">
                        <div className="w-[100px] h-[150px] overflow-hidden rounded-md mb-2">
                          <img
                            src={getFullPosterUrl(movie.posterURL)}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="badge absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {index + 1}
                        </span>
                      </div>
                    )
                    : (
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[#b9c0de] text-lg font-semibold">
                          Rank #{index + 1}
                        </p>
                        <p className="text-[#b9c0de] text-sm">
                          Drop a movie here
                        </p>
                      </div>
                    )}
                </SortableItem>
              ))}
            </div>
          </div>
        </DndContext>

        {/* Buttons */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/users/${userId}/groups`)}
          >
            Back to group overview
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitRanking}
              disabled={isSubmitting || phase !== "VOTING" ||
                !isSubmitEnabled() || hasSubmitted}
            >
              {hasSubmitted
                ? "Submitted"
                : isSubmitting
                ? "Submitting..."
                : "Submit Rankings"}
            </Button>
            {phase === "VOTING" && phaseGroup &&
              String(phaseGroup.creatorId) === String(userId) && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await apiService.post(
                      `/groups/${groupId}/show-results`,
                      {},
                    );
                    setSuccessMessage(
                      "Voting ended, results are now available.",
                    );
                    setShowSuccessMessage(true);
                  } catch (err: unknown) {
                    if (err instanceof Error && "status" in err) {
                      const appErr = err as ApplicationError;
                      switch (appErr.status) {
                        case 403:
                          setError(
                            "Only the group creator can end voting and show results.",
                          );
                          break;
                        case 404:
                          setError("The specified group could not be found.");
                          break;
                        case 409:
                          setError(
                            "This action can only be performed when voting is active for this group.",
                          );
                          break;
                        default:
                          setError(
                            "An error occurred while ending voting. Please try again.",
                          );
                      }
                    } else {
                      setError(
                        "An error occurred while ending voting. Please try again.",
                      );
                    }
                    return;
                  }
                  router.replace(`/users/${userId}/groups/${groupId}/results`);
                }}
              >
                End Voting & Show Results
              </Button>
            )}
          </div>
        </div>

        {/* Ranking requirement message */}
        {!isSubmitEnabled() && (
          <p className="text-[#f97274] text-center mt-4">
            {availableMovies.length > 0 ? getRankingRequirementMessage() : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default Vote;
