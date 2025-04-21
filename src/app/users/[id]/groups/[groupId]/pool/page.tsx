"use client";

import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useState, useEffect } from "react";
import { useApi } from "@/app/hooks/useApi";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useLocalStorage from "@/app/hooks/useLocalStorage";

interface Group {
  groupId: number;
  groupName: string;
  description: string;
  creator: User;
  members: User[];
  createdAt: string;
}

const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const {id, groupId} = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [moviePool, setMoviePool] = useState<Movie[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<Movie[]>([]);
  const {value: userId} = useLocalStorage<string>("userId", "");
  const apiService = useApi();
  const router = useRouter();

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId || !id) return;

      try {
        // Fetch group members using the endpoint from GroupController
        const members = await apiService.get<User[]>(`/groups/${groupId}/members`);

        // Get all user groups to find the current group data
        const allGroups = await apiService.get<Group[]>('/groups');
        const currentGroup = allGroups.find(g => g.groupId === Number(groupId));

        if (currentGroup) {
          // If we found the group in the list, use its data
          setGroup({
            ...currentGroup,
            members: members // Add members to the group object
          });
        } else {
          // Fallback: create a minimal group object
          setGroup({
            groupId: Number(groupId),
            groupName: `Group ${groupId}`,
            description: "",
            creator: members.find(m => m.userId === Number(userId)) || members[0],
            members: members,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Failed to fetch group details:", error);
      }
    };

    fetchGroupDetails();
  }, [groupId, userId, apiService]);

  // Fetch user's watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!userId) return;

      try {
        const response = await apiService.get<User>(`/users/${userId}/profile`);
        setUserWatchlist(response.watchlist);
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

      // Using the exact endpoint defined in the GroupController
      // The backend expects a POST to /groups/{groupId}/pool/{movieId}
      await apiService.post(`/groups/${groupId}/pool/${selectedMovie.movieId.valueOf()}`, {});
      console.log(`posted successfully : ${selectedMovie.movieId}`);
      // Refresh the movie pool after adding
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      console.log(`got new movies`);
      setMoviePool(updatedPool);

      // Clear selection after successful addition
      setSelectedMovies([]);

      alert("Movie added to the pool successfully!");
    } catch (error) {
      console.error("Failed to add movie to the pool:", error);
      alert("An error occurred while adding the movie to the pool. Please try again.");
    }
  };

  // Function to remove movie from pool
  const handleRemoveFromPool = async (movieId: number) => {
    try {
      // Using the exact endpoint defined in the GroupController
      await apiService.delete(`/groups/${groupId}/pool/${movieId}`);

      // Refresh the movie pool after removing
      const updatedPool = await apiService.get<Movie[]>(`/groups/${groupId}/pool`);
      setMoviePool(updatedPool);

      alert("Movie removed from the pool successfully!");
    } catch (error) {
      console.error("Failed to remove movie from the pool:", error);
      alert(
          "An error occurred while removing the movie from the pool. Please try again."
      );
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
              {group ? `${group.groupName}'s Movie Pool` : "Movie Pool"}
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
            <Button onClick={handleAddMovieToPool}>Add to Pool</Button>
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
                onMovieClick={(movie) => handleRemoveFromPool(movie.movieId)}
                emptyMessage="No movies in the pool yet"
                noResultsMessage="No movies match your search"
                hasOuterContainer={false}
                selectedMovieIds={[]}
            />
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