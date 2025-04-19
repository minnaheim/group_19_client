"use client";

import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useState, useEffect } from "react";
import { useApi } from "@/app/hooks/useApi";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Group {
  groupId: number;
  name: string;
  description: string;
  creator: User;
  members: User[];
  createdAt: string;
}

const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  const [group, setGroup] = useState<Group | null>(null);
  const [moviePool, setMoviePool] = useState<Movie[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<Movie[]>([]);

  const apiService = useApi();
  const router = useRouter();

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;

      try {
        const response = await apiService.get<Group>(`/groups/${groupId}`);
        setGroup(response);
      } catch (error) {
        console.error("Failed to fetch group details:", error);
      }
    };

    fetchGroupDetails();
  }, [groupId, apiService]);

  // Fetch user's watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;

      try {
        const response = await apiService.get<Movie[]>(`/users/${userId}/watchlist`);
        setUserWatchlist(response);
      } catch (error) {
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
        setMoviePool(movies);
      } catch (error) {
        console.error("Failed to fetch movie pool:", error);
      }
    };

    fetchMoviePool();
  }, [groupId, apiService]);

  const handleAddToPool = (movie: Movie) => {
    setSelectedMovies((prev) => {
      if (prev.some((m) => m.movieId === movie.movieId)) {
        return prev.filter((m) => m.movieId !== movie.movieId);
      } else {
        if (prev.length >= 1) {
          alert("You can only select one favorite movie");
          return prev;
        }
        return [...prev, movie];
      }
    });
  };

  const handleAddMovieToPool = async () => {
    if (selectedMovies.length === 0) {
      alert("Please select a movie before adding it to the pool.");
      return;
    }

    try {
      // Based on the backend controller, we need to make a POST request to add a movie to the pool
      await apiService.post(`/groups/${groupId}/pool/${selectedMovies[0].movieId}`, {});

      // Refresh the movie pool after adding
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);

      alert("Movie added to the pool successfully!");
      setSelectedMovies([]);
    } catch (error) {
      console.error("Failed to add movie to the pool:", error);
      alert(
          "An error occurred while adding the movie to the pool. Please try again."
      );
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
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              {group ? `${group.name}'s Movie Pool` : "Movie Pool"}
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
            <Button onClick={handleAddMovieToPool}>Add to Pool</Button>
          </div>

          {/* Movie Pool */}
          <div className="mb-8">
            <h2 className="font-semibold text-[#3b3e88] text-xl">
              Current Movie Pool
            </h2>
          </div>

          {/* Display all movies in the pool */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moviePool.map((movie) => (
                <div key={movie.movieId} className="flex flex-col items-center">
                  <div className="relative w-[90px] h-[130px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] rounded-lg shadow-md overflow-hidden">
                    <img
                        className="w-full h-full object-cover"
                        src={getFullPosterUrl(movie.posterURL)}
                        alt={movie.title}
                    />
                  </div>
                  <p className="text-center text-sm text-[#3C3F88] mt-2">
                    {movie.title}
                  </p>
                </div>
            ))}
            {moviePool.length === 0 && (
                <p className="text-center col-span-full text-sm text-[#b9c0de]">
                  No movies in the pool yet
                </p>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <Button
                onClick={() =>
                    router.push(`/users/${userId}/groups/${groupId}/vote`)
                }
            >
              Vote
            </Button>
          </div>
        </div>
      </div>
  );
};

export default MoviePool;