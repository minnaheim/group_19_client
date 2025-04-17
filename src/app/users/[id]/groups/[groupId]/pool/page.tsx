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
  moviePool: MoviePoolEntry[];
}

interface MoviePoolEntry {
  userId: number;
  movie: Movie;
}

const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  const { value: movieId } = useLocalStorage<string>("movieId", "");
  const [group, setGroup] = useState<Group | null>(null);
  const [watchList, setWatchList] = useState<Movie[] | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[] | null>(null);
  const apiService = useApi();
  const router = useRouter();

  // get group info
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await apiService.get<Group>(`/groups/${groupId}`);
        setGroup(response);
      } catch (error) {
        console.error("Failed to fetch group details:", error);
        alert(
          "An error occurred while fetching the Group Information. Please try again."
        );
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, apiService]);

  // get the user's watchlist
  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        const response = await apiService.get<Movie[]>(`/watchlist/${userId}`);
        setWatchList(response);
      } catch (error) {
        console.error("Failed to fetch Watchlist:", error);
        alert(
          "An error occurred while fetching the Watchlist. Please try again."
        );
      }
    };

    if (userId) {
      fetchWatchList();
    }
  }, [userId, apiService]);

  // get group members
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const response = await apiService.get<User[]>(
          `/groups/${groupId}/members`
        );
        setGroupMembers(response);
      } catch (error) {
        console.error("Failed to fetch Group Members:", error);
        alert(
          "An error occurred while fetching the Group Members. Please try again."
        );
      }
    };

    if (userId) {
      fetchGroupMembers();
    }
  }, [userId, apiService]);

  // TODO: based on each group member, get their movie Pool selection, empty if not chosen!!

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
      await apiService.post(`/groups/${groupId}/pool/${movieId}`, {
        userId,
        movie: selectedMovies[0],
      });

      alert("Movie added to the pool successfully!");
      setSelectedMovies([]);
    } catch (error) {
      console.error("Failed to add movie to the pool:", error);
      alert(
        "An error occurred while adding the movie to the pool. Please try again."
      );
    }
  };

  const displayMovies = watchList;

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
            movies={displayMovies}
            onMovieClick={handleAddToPool}
            emptyMessage="Your Watchlist is empty"
            noResultsMessage="Your Watchlist is not available"
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
        <div className="flex gap-4 overflow-x-auto">
          {/* TODO: as soon as group members are found, map their choices for the movie pool */}
          {mockGroupMembers.map((member) => {
            // Find the movie for this user in the pool
            const userMovieEntry = moviePoolEntries.find(
              (entry) => entry.userId === member.userId
            );

            return (
              <div key={member.userId} className="flex flex-col items-center">
                {/* Movie Card or Placeholder */}
                {userMovieEntry ? (
                  <div className="relative w-[90px] h-[130px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] rounded-lg shadow-md overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={getFullPosterUrl(userMovieEntry.movie.posterURL)}
                      alt={userMovieEntry.movie.title}
                    />
                  </div>
                ) : (
                  <div className="w-[90px] h-[130px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] object-cover rounded-md bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black text-lg">...</span>
                  </div>
                )}

                {/* User Name */}
                <p className="text-center text-sm text-[#3b3e88] mt-2">
                  {member.username}
                </p>
                {/* Movie Title (can be shown optionally) */}
                {userMovieEntry && (
                  <p className="text-center text-xs text-[#b9c0de] mt-1">
                    {userMovieEntry.movie.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-4">
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
