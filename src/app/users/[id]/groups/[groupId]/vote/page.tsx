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
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

interface MoviePoolEntry {
  userId: number;
  movie: Movie;
}

const Vote: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  const [availableMovies, setAvailableMovies] = useState<MoviePoolEntry[]>([]);
  const [rankings, setRankings] = useState<(Movie | null)[]>([
    null,
    null,
    null,
  ]);
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

  // Fetch movie pool
  useEffect(() => {
    const fetchMoviePool = async () => {
      try {
        const response = await apiService.get<MoviePoolEntry[]>(
          `/groups/${groupId}/pool`
        );
        setAvailableMovies(response);
      } catch (error) {
        console.error("Failed to fetch movie pool:", error);
        alert(
          "An error occurred while fetching the movie pool. Please try again."
        );
      }
    };
    fetchMoviePool();
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
        newRankings[rankIndex] = availableMovies[movieIndex].movie;
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
        setAvailableMovies([
          ...availableMovies,
          { userId: 1, movie: movedMovie },
        ]);

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

    try {
      const rankedMovies = rankings.map((movie, index) => ({
        movieId: movie?.movieId,
        rank: index + 1,
      }));

      await apiService.post(`/groups/${groupId}/vote`, {
        userId,
        rankings: rankedMovies,
      });

      router.push(`/users/${userId}/groups/${groupId}/results`);
    } catch (error) {
      console.error("Failed to submit rankings:", error);
      alert(
        "An error occurred while submitting your rankings. Please try again."
      );
    }
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
              {availableMovies.map((entry, index) => {
                const {
                  attributes,
                  listeners,
                  setNodeRef,
                  transform,
                  transition,
                } = useSortable({ id: `pool-${index}` });

                const style = {
                  transform: CSS.Transform.toString(transform),
                  transition,
                };

                return (
                  <div
                    key={`pool-${index}`}
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    {...listeners}
                    className="w-[120px] h-[180px] bg-white rounded-lg shadow-md flex items-center justify-center"
                  >
                    <p className="text-center text-[#3b3e88] font-bold">
                      {entry.movie.title}
                    </p>
                  </div>
                );
              })}
              {availableMovies.length === 0 && (
                <div className="flex items-center justify-center w-full h-full text-[#3b3e88]">
                  All movies have been ranked.
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
              {rankings.map((movie, index) => {
                const {
                  attributes,
                  listeners,
                  setNodeRef,
                  transform,
                  transition,
                } = useSortable({ id: `rank-${index}` });

                const style = {
                  transform: CSS.Transform.toString(transform),
                  transition,
                };

                return (
                  <div
                    key={`rank-${index}`}
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    {...listeners}
                    className={`w-[120px] h-[180px] flex items-center justify-center ${
                      movie
                        ? "bg-[#d9e1ff]"
                        : "border-2 border-dashed border-[#b9c0de]"
                    } rounded-lg shadow-md`}
                  >
                    {movie ? (
                      <p className="text-center text-[#3b3e88] font-bold">
                        {movie.title}
                      </p>
                    ) : (
                      <p className="text-[#b9c0de]">Drop here</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DndContext>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <Button
            variant="destructive"
            onClick={() => router.push(`/users/${userId}/dashboard`)}
          >
            Back
          </Button>
          <Button onClick={handleSubmitRanking}>Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default Vote;
