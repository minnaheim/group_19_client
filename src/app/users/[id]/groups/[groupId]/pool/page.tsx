"use client";

import { useApi } from "@/app/hooks/useApi";
import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";
import type { ApplicationError } from "@/app/types/error";

import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import { useState, useEffect } from "react";

import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import MovieCardSimple from "@/components/ui/movie_card_simple";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useLocalStorage from "@/app/hooks/useLocalStorage";

const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const params = useParams();
  let groupId = params.groupId;
  if (Array.isArray(groupId)) groupId = groupId[0];
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const router = useRouter();
  const apiService = useApi();
  const [moviePool, setMoviePool] = useState<Movie[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<Movie[]>([]);
  const { group: phaseGroup, phase, loading: phaseLoading, error: phaseError } = useGroupPhase(groupId as string);

  useEffect(() => {
    if (phaseLoading) return;
    if (phaseError) {
      setSubmitError(phaseError as string);
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
      } catch (err: unknown) {
        console.error("Failed to fetch watchlist:", err);
        if (err instanceof Error && 'status' in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 404) {
            setSubmitError("Oops! We couldn't find the user profile.");
          } else {
            setSubmitError("An error occurred while loading your watchlist. Please try again.");
          }
        } else {
          setSubmitError("An error occurred while loading your watchlist. Please try again.");
        }
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
      } catch (err: unknown) {
        console.error("Failed to fetch movie pool:", err);
        if (err instanceof Error && 'status' in err) {
          const appErr = err as ApplicationError;
          if (appErr.status === 401) {
            setSubmitError("Your session has expired. Please log in again.");
          } else if (appErr.status === 404) {
            setSubmitError("Could not find the group or you are not a member.");
          } else {
            setSubmitError("An error occurred while loading the movie pool. Please try again.");
          }
        } else {
          setSubmitError("An error occurred while loading the movie pool. Please try again.");
        }
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
      setSubmitError("Please select a movie before adding it to the pool.");
      return;
    }
    try {
      const selectedMovie = selectedMovies[0];
      await apiService.post(`/groups/${groupId}/pool/${selectedMovie.movieId.valueOf()}`, {});
      // Refresh the movie pool after adding
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);
      setSelectedMovies([]);
      setSuccessMessage("Movie added to pool successfully!");
      setShowSuccessMessage(true);
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            setSubmitError("Your session has expired. Please log in again to add movies.");
            break;
          case 404:
            setSubmitError("Could not find the group or movie specified.");
            break;
          case 409:
            setSubmitError("Movies can only be added when the group is in the 'Pool' phase.");
            break;
          default:
            setSubmitError("An error occurred while adding the movie to the pool. Please try again.");
        }
      } else {
        setSubmitError("An error occurred while adding the movie to the pool. Please try again.");
      }
    }
  };

  // Function to remove movie from pool
  const handleRemoveFromPool = async (movieId: number) => {
    try {
      await apiService.delete(`/groups/${groupId}/pool/${movieId}`);
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);
      setSuccessMessage("Movie removed from the pool successfully!");
      setShowSuccessMessage(true);
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            setSubmitError("Your session has expired. Please log in again to remove movies.");
            break;
          case 404:
            setSubmitError("Could not find the group or the movie in the pool.");
            break;
          case 409:
            setSubmitError("Movies can only be removed when the group is in the 'Pool' phase.");
            break;
          default:
            setSubmitError("An error occurred while removing the movie from the pool. Please try again.");
        }
      } else {
        setSubmitError("An error occurred while removing the movie from the pool. Please try again.");
      }
    }
  };

  return (
    <>
      {submitError && <ErrorMessage message={submitError} onClose={() => setSubmitError("")} />}
      <ActionMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onHide={() => setShowSuccessMessage(false)}
        className="bg-green-500"
      />
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
              Choose up to two Movies from your Watchlist to Add to the Pool
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
              <ErrorMessage message="You can only add movies during the POOL phase." onClose={() => setSubmitError("")} />
            )}
          </div>

          {/* Movie Pool */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">
              Current Movie Pool
            </h2>
          </div>

          {/* Display movie pool in horizontal list, just like the watchlist */}
          <div className="flex overflow-x-auto mb-8 gap-4">
            {moviePool.map((movie) => (
              <div key={movie.movieId} className="relative flex-shrink-0">
                <MovieCardSimple movie={movie} onClick={() => {}} />
                {phase === "POOL" && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleRemoveFromPool(movie.movieId)}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-red-100"
                    title="Remove from pool"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            ))}
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
                  try {
                    await apiService.post(`/groups/${groupId}/start-voting`, {});
                    setSuccessMessage("Voting started successfully!");
                    setShowSuccessMessage(true);
                    router.replace(`/users/${userId}/groups/${groupId}/vote`);
                  } catch (err: unknown) {
                    if (err instanceof Error && 'status' in err) {
                      const appErr = err as ApplicationError;
                      switch (appErr.status) {
                        case 403:
                          setSubmitError("Only the group creator can start the voting phase.");
                          break;
                        case 404:
                          setSubmitError("The specified group could not be found.");
                          break;
                        case 409:
                          setSubmitError("Voting can only be started when the group is in the 'Pool' phase.");
                          break;
                        default:
                          setSubmitError("An error occurred while starting voting. Please try again.");
                      }
                    } else {
                      setSubmitError("An error occurred while starting voting. Please try again.");
                    }
                  }
                }}
              >
                Start Voting
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MoviePool;
