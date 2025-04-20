"use client";

import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useState, useEffect } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {useParams, useRouter} from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

// Define types to match backend DTOs
interface RankingSubmitDTO {
  movieId: number; // Must be a number, not a string
  rank: number;    // Must be a positive integer
}

// SortableItem Component
const SortableItem: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
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
          className="w-[120px] h-[180px] bg-white rounded-lg shadow-md flex items-center justify-center"
      >
        {children}
      </div>
  );
};

const Vote: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const {id, groupId} = useParams();
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [rankings, setRankings] = useState<(Movie | null)[]>([
    null,
    null,
    null,
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();

  const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5, // Minimum dragging distance to activate a drag
        },
      }),
      useSensor(KeyboardSensor)
  );

  // Fetch rankable movies - updated to match controller endpoint
  useEffect(() => {
    if (!id) { return; }
    const fetchRankableMovies = async () => {
      try {
        // Convert groupId to a number as the backend expects numeric IDs

        // Log the request to help with debugging
        console.log(`Fetching rankable movies for group ID: ${groupId}`);

        // Updated to match the endpoint from the controller: '/groups/{groupId}/movies/rankable'
        const response = await apiService.get<Movie[]>(
            `/groups/${groupId}/movies/rankable`
        );
        console.log("Received movies:", response);
        setAvailableMovies(response);
      } catch (error) {
        console.error("Failed to fetch rankable movies:", error);
        alert(
            "An error occurred while fetching the movies. Please try again."
        );
      }
    };

    if (groupId) {
      fetchRankableMovies();
    }
  }, [apiService, groupId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

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
      }
    }

    // Ranking slot to movie pool (remove from ranking)
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
    }

    // Swap between ranking slots
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

  const handleSubmitRanking = async () => {
    if (rankings.some((movie) => movie === null)) {
      alert("Please rank all 3 movies before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate that userId and groupId are valid numbers
      if (!userId || !groupId) {
        alert("Missing user ID or group ID. Please go back to the main page.");
        return;
      }

      // Convert our client-side ranking format to match the backend DTO format
      // Ensure all values are proper integers
      const rankingSubmitDTOs: RankingSubmitDTO[] = rankings.map((movie, index) => {
        // Ensure movieId is a valid integer
        const movieId = movie && movie.movieId ? parseInt(String(movie.movieId), 10) : null;

        if (isNaN(movieId as number) || movieId === null) {
          throw new Error(`Invalid movie ID for rank ${index + 1}`);
        }

        return {
          movieId: movieId as number,
          rank: index + 1, // Ranks are 1-based (1, 2, 3)
        };
      });

      console.log("Submitting rankings:", JSON.stringify(rankingSubmitDTOs));

      // Make sure the API endpoint is properly formatted
      const endpoint = `/groups/${groupId}/users/${userId}/rankings`;
      console.log(`Sending POST request to: ${endpoint}`, rankingSubmitDTOs);

      // Send the request with proper JSON content
      const response = await apiService.post(endpoint, rankingSubmitDTOs);
      console.log("Rankings submitted successfully", response);

      // Navigate to results page after successful submission
      router.push(`/users/${userId}/groups/${groupId}/results`);
    } catch (error) {
      console.error("Failed to submit rankings:", error);
      alert(
          "An error occurred while submitting your rankings. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get complete image URL
  const getFullPosterUrl = (posterPath: string) => {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation */}
        <Navigation userId={userId} activeItem=" Movie Groups" />

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              Vote for the Movie Night
            </h1>
            <p className="text-[#b9c0de] mt-2">Drag movies to rank them</p>
          </div>

          <DndContext
              sensors={sensors}
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
                        <p className="text-center text-[#3b3e88] font-bold text-sm px-2">
                          {movie.title}
                        </p>
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
                    <SortableItem key={`rank-${index}`} id={`rank-${index}`}>
                      {movie ? (
                          <div className="flex flex-col items-center">
                            <div className="w-[100px] h-[150px] overflow-hidden rounded-md mb-2">
                              <img
                                  src={getFullPosterUrl(movie.posterURL)}
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-center text-[#3b3e88] font-bold text-sm px-2">
                              {movie.title}
                            </p>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-[#b9c0de] text-lg font-semibold">Rank #{index + 1}</p>
                            <p className="text-[#b9c0de] text-sm">Drop a movie here</p>
                          </div>
                      )}
                    </SortableItem>
                ))}
              </div>
            </div>
          </DndContext>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <Button
                variant="outline"
                onClick={() => router.push(`/users/${userId}/groups/${groupId}/pool`)}
                disabled={isSubmitting}
            >
              Back to Pool
            </Button>
            <Button
                onClick={handleSubmitRanking}
                disabled={isSubmitting || rankings.some(movie => movie === null)}
            >
              {isSubmitting ? "Submitting..." : "Submit Rankings"}
            </Button>
          </div>
        </div>
      </div>
  );
};

export default Vote;