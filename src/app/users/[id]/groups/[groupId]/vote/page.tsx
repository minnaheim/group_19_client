"use client";

import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { rectIntersection, pointerWithin } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MovieCard from "@/components/ui/Movie_card"; // Import your existing MovieCard
import { useRouter } from "next/navigation";

interface MoviePoolEntry {
  userId: number;
  movie: Movie;
}

const mockMoviePool: MoviePoolEntry[] = [
  {
    userId: 2,
    movie: {
      movieId: 3,
      title: "Dune: Part Two",
      posterURL:
        "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genres: ["Science Fiction"],
      directors: ["Denis Villeneuve"],
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
      year: 2023,
      originallanguage: "English",
    },
  },
  {
    userId: 3,
    movie: {
      movieId: 4,
      title: "Oppenheimer",
      posterURL:
        "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genres: ["Drama"],
      directors: ["Christopher Nolan"],
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
      year: 2023,
      originallanguage: "English",
    },
  },
  {
    userId: 4,
    movie: {
      movieId: 5,
      title: "Poor Things",
      posterURL:
        "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      description:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genres: ["Science Fiction"],
      directors: ["Yorgos Lanthimos"],
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
      year: 2023,
      originallanguage: "English",
    },
  },
];

// DraggableMovieCard component - wrapper for MovieCard that adds drag functionality
const DraggableMovieCard = ({ id, movie, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
    >
      <MovieCard movie={movie} onClick={() => onClick(movie)} />
    </div>
  );
};

// RankingSlot component
const RankingSlot = ({ id, index, movie, onDrop }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id,
    disabled: !movie,
  });

  const isEmpty = !movie;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        w-[120px] h-[180px] 
        flex items-center justify-center 
        ${isEmpty ? "border-2 border-dashed border-[#b9c0de] bg-[#d9e1ff]" : ""}
        rounded-lg shadow-md 
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
      data-rank-position={index}
    >
      {movie ? (
        <div className="relative w-full h-full">
          <MovieCard movie={movie} onClick={() => {}} />
          <div className="absolute top-0 left-0 bg-[#3b3e88] text-white rounded-br-lg px-2 py-1 z-10">
            #{index + 1}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-[#3b3e88] text-2xl font-bold">
          <span>{index + 1}</span>
          <span className="text-sm font-normal mt-2">Drop here</span>
        </div>
      )}
    </div>
  );
};

const Vote: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  const [availableMovies, setAvailableMovies] =
    useState<MoviePoolEntry[]>(mockMoviePool);
  const [rankings, setRankings] = useState<(Movie | null)[]>([
    null,
    null,
    null,
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum dragging distance to activate a drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle live feedback if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
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

  const handleMovieClick = (movie: Movie) => {
    // Find first empty slot
    const emptySlotIndex = rankings.findIndex((slot) => slot === null);
    if (emptySlotIndex !== -1) {
      const movieIndex = availableMovies.findIndex(
        (entry) => entry.movie.movieId === movie.movieId
      );

      // Add to ranking
      const newRankings = [...rankings];
      newRankings[emptySlotIndex] = movie;
      setRankings(newRankings);

      // Remove from pool
      const newAvailableMovies = [...availableMovies];
      newAvailableMovies.splice(movieIndex, 1);
      setAvailableMovies(newAvailableMovies);
    }
  };

  const handleSubmitRanking = () => {
    if (rankings.some((movie) => movie === null)) {
      alert("Please rank all 3 movies before submitting.");
      return;
    }
    console.log("Submitted Rankings:", rankings);
    alert("Your rankings have been submitted!");
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
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Movie Pool Section */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">Movie Pool</h2>
            <div
              id="movie-pool"
              className="flex flex-wrap gap-4 overflow-x-auto mt-4 p-4 min-h-[200px] bg-[#d9e1ff] rounded-lg"
            >
              {availableMovies.map((entry, index) => (
                <DraggableMovieCard
                  key={`pool-${index}`}
                  id={`pool-${index}`}
                  movie={entry.movie}
                  onClick={handleMovieClick}
                />
              ))}
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
              {rankings.map((movie, index) => (
                <RankingSlot
                  key={`rank-${index}`}
                  id={`rank-${index}`}
                  index={index}
                  movie={movie}
                  onDrop={() => {}}
                />
              ))}
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
