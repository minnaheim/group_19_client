"use client";

import { useApi } from "@/app/hooks/useApi";
import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";

import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import { useState, useEffect } from "react";

import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useLocalStorage from "@/app/hooks/useLocalStorage";



const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const params = useParams();
  let groupId = params.groupId;
  if (Array.isArray(groupId)) groupId = groupId[0];
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const apiService = useApi();
  const [moviePool, setMoviePool] = useState<Movie[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<Movie[]>([]);
  const { group: phaseGroup, phase, loading: phaseLoading, error: phaseError } = useGroupPhase(groupId as string);

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      alert(phaseError as string);
      return;
    }
    if (phase && phase !== "POOL") {
      if (phase === "VOTING") {
        router.replace(`/users/${userId}/groups/${groupId}/vote`);
      } else if (phase === "RESULTS") {
        router.replace(`/users/${userId}/groups/${groupId}/results`);
      }
    }
  }, [phase, phaseLoading, phaseError, router, userId, groupId]);

  // Fetch user's watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;

      try {
        const response = await apiService.get<User>(`/users/${userId}/profile`);
        if (response && typeof response === 'object' && 'watchlist' in response) {
          setUserWatchlist((response as User).watchlist);
        } else {
          setUserWatchlist([]);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch watchlist:", error);
      }
    };

    fetchWatchlist();
  }, [userId, apiService]);

  // Fetch movie pool
  useEffect(() => {
    const fetchMoviePool = async () => {
      if (!groupId) return;

      try {
        const movies = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
        if (Array.isArray(movies)) {
          setMoviePool(movies as Movie[]);
        } else {
          setMoviePool([]);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch movie pool:", error);
      }
    };

    fetchMoviePool();
  }, [groupId, apiService]);

  const handleAddToPool = (movie: Movie) => {
    setSelectedMovies((prev) => {
      // If the movie is already selected, deselect it
      if (prev.some((m) => m.movieId === movie.movieId)) {
        return prev.filter((m) => m.movieId !== movie.movieId);
      }
      // Otherwise select it, but enforce single selection
      else {
        // We want to only allow one movie at a time
        return [movie]; // Replace previous selection with just this movie
      }
    });
  };

  const handleAddMovieToPool = async () => {
    if (selectedMovies.length === 0) {
      alert("Please select a movie before adding it to the pool.");
      return;
    }
    try {
      const selectedMovie = selectedMovies[0];
      await apiService.post(`/groups/${groupId}/pool/${selectedMovie.movieId.valueOf()}`, {});
      // Refresh the movie pool after adding
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);
      setSelectedMovies([]);
      alert("Movie added to the pool successfully!");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as { status?: number; message?: string };
        if (err.status === 409) {
          alert(err.message || "You can only add movies during the POOL phase.");
        } else if (err.status === 401) {
          alert("Session expired. Please log in again.");
        } else {
          alert("An error occurred while adding the movie to the pool. Please try again.");
        }
      } else {
        alert("An unknown error occurred while adding the movie to the pool. Please try again.");
      }
    }
  };

  // Function to remove movie from pool
  const handleRemoveFromPool = async (movieId: number) => {
    try {
      await apiService.delete(`/groups/${groupId}/pool/${movieId}`);
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);
      alert("Movie removed from the pool successfully!");
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as { status?: number; message?: string };
        if (err.status === 409) {
          alert(err.message || "You can only remove movies during the POOL phase, and only movies you added.");
        } else if (err.status === 401) {
          alert("Session expired. Please log in again.");
        } else {
          alert("An error occurred while removing the movie from the pool. Please try again.");
        }
      } else {
        alert("An unknown error occurred while removing the movie from the pool. Please try again.");
      }
    }
  };

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation */}
        <Navigation userId={userId} activeItem="Movie Groups" />

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {phaseGroup ? `${phaseGroup.groupName} - Movie Pool` : "Movie Pool"}
            </h1>
            <p className="text-[#b9c0de] mt-2">Choose Movies to Vote and Watch</p>
          </div>

          {/* Show User's Watchlist */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">
              Choose a Movie from your Watchlist to Add to the Pool
            </h2>
          </div>
          <div className="overflow-x-auto mb-8">
            <MovieListHorizontal
                movies={userWatchlist}
                onMovieClick={handleAddToPool}
                emptyMessage="Your watchlist is empty"
                noResultsMessage="No movies match your search"
                hasOuterContainer={false}
                selectedMovieIds={selectedMovies.map(m => m.movieId)}
            />
          </div>
          {/* Selected Movie Info */}
          <p className="text-center mt-4 text-sm text-[#3C3F88]">
            {selectedMovies.length > 0
                ? `You selected: ${selectedMovies[0].title}`
                : "No movie selected"}
          </p>

          {/* Add to Pool Button */}
          <div className="flex justify-end mt-4">
            <Button
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm"
                onClick={handleAddMovieToPool} disabled={phase !== "POOL"}>Add to Pool</Button>
            {phase !== "POOL" && (
              <p className="text-center text-sm text-[#f97274] mt-2">You can only add movies during the POOL phase.</p>
            )}
          </div>

          {/* Movie Pool */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">
              Current Movie Pool
            </h2>
          </div>

          {/* Display movie pool in horizontal list, just like the watchlist */}
          <div className="overflow-x-auto mb-8">
            <MovieListHorizontal
                movies={moviePool}
                onMovieClick={(movie) => {
                  if (phase === "POOL") {
                    handleRemoveFromPool(movie.movieId);
                  }
                }}
                emptyMessage="No movies in the pool yet"
                noResultsMessage="No movies match your search"
                hasOuterContainer={false}
                selectedMovieIds={[]}
            />
            {phase !== "POOL" && (
              <p className="text-center text-sm text-[#f97274] mt-2">You can only remove movies during the POOL phase.</p>
            )}
          </div>

          <div className="flex justify-between items-center mt-8 gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/users/${userId}/groups`)}
            >
              Back to group overview
            </Button>
            {/* Start Voting button for group creator */}
            {phase === "POOL" && phaseGroup && String(phaseGroup.creatorId) === String(userId) && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm mt-2"
                onClick={async () => {
                  // Attempt to start voting, but always redirect to voting page
                  try {
                    await apiService.post(`/groups/${groupId}/start-voting`, {});
                  } catch {
                    // Ignore errors (e.g., 409 conflict) since phase may already have advanced
                  }
                  router.replace(`/users/${userId}/groups/${groupId}/vote`);
                }}
              >
                Start Voting
              </Button>
            )}
          </div>
        </div>
      </div>
  );
};

export default MoviePool;