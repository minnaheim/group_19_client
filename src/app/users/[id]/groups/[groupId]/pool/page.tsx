"use client";

import Navigation from "@/components/ui/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useState, useEffect } from "react";
// import { useApi } from "@/app/hooks/useApi";
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

const mockWatchList: Movie[] = [
  {
    movieId: 1,
    title: "To All the Boys I've Loved Before",
    posterURL: "/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
    description:
      "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
    genres: ["Teen Romance"],
    directors: ["Susan Johnson"],
    actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
    trailerURL: "https://www.example.com/to-all-the-boys",
    year: 2002,
    originallanguage: "English",
  },
  {
    movieId: 2,
    title: "The Kissing Booth",
    posterURL: "/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
    description:
      "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
    genres: ["Teen Romance"],
    directors: ["Vince Marcello"],
    actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
    trailerURL: "https://www.example.com/kissing-booth",
    year: 2018,
    originallanguage: "English",
  },
  {
    movieId: 3,
    title: "Dune: Part Two",
    posterURL: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    genres: ["Science Fiction"],
    directors: ["Denis Villeneuve"],
    actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    trailerURL: "https://www.example.com/dune-part-two",
    year: 2023,
    originallanguage: "English",
  },
  {
    movieId: 4,
    title: "Oppenheimer",
    posterURL: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    genres: ["Drama"],
    directors: ["Christopher Nolan"],
    actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
    trailerURL: "https://www.example.com/oppenheimer",
    year: 2023,
    originallanguage: "English",
  },
  {
    movieId: 5,
    title: "Poor Things",
    posterURL: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
    description:
      "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
    genres: ["Science Fiction"],
    directors: ["Yorgos Lanthimos"],
    actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
    trailerURL: "https://www.example.com/poor-things",
    year: 2023,
    originallanguage: "English",
  },
  {
    movieId: 11,
    title: "Oppenheimer",
    posterURL: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    genres: ["Drama"],
    directors: ["Christopher Nolan"],
    actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
    trailerURL: "https://www.example.com/oppenheimer",
    year: 2023,
    originallanguage: "English",
  },
  {
    movieId: 9,
    title: "Top Gun: Maverick",
    posterURL: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    description:
      "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
    genres: ["Action"],
    directors: ["Joseph Kosinski"],
    actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
    trailerURL: "https://www.example.com/top-gun-maverick",
    year: 2022,
    originallanguage: "English",
  },
  {
    movieId: 10,
    title: "Everything Everywhere All at Once",
    posterURL: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    description:
      "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
    genres: ["Science Fiction"],
    directors: ["Daniel Kwan", "Daniel Scheinert"],
    actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
    trailerURL: "https://www.example.com/everything-everywhere",
    year: 2022,
    originallanguage: "English",
  },
];

const mockGroupMembers: User[] = [
  {
    userId: 2,
    username: "alex.np",
    email: "alex@example.com",
    bio: "Horror fan with a passion for classic slasher films and psychological thrillers. Always looking for the next scare!",
    favoriteGenres: ["Horror", "Thriller", "Mystery"],
    favoriteMovie: mockWatchList[0],
    watchlist: [mockWatchList[0], mockWatchList[1]],
    password: "",
    watchedMovies: [],
  },
  {
    userId: 3,
    username: "cinematic_soul",
    email: "cinematic@example.com",
    bio: "Finding meaning through cinema since 1995.",
    favoriteGenres: ["Drama", "Independent", "Foreign"],
    favoriteMovie: mockWatchList[2],
    watchlist: [mockWatchList[2], mockWatchList[3]],
    password: "",
    watchedMovies: [],
  },
  {
    userId: 4,
    username: "film_buff",
    email: "buff@movies.com",
    bio: "Movie enthusiast with a passion for classics.",
    favoriteGenres: ["Drama", "Classic", "Film Noir"],
    favoriteMovie: mockWatchList[3],
    watchlist: [mockWatchList[3], mockWatchList[4]],
    password: "",
    watchedMovies: [],
  },
];

// Initial mock movie pool entries
const initialMoviePoolEntries: MoviePoolEntry[] = [
  {
    userId: 3, // cinematic_soul
    movie: mockWatchList[2], // Dune: Part Two
  },
  {
    userId: 4, // film_buff
    movie: mockWatchList[3], // Oppenheimer
  },
];

const MoviePool: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  // const { value: movieId } = useLocalStorage<string>("movieId", "");
  const [group, setGroup] = useState<Group | null>(null);
  const [moviePoolEntries, setMoviePoolEntries] = useState<MoviePoolEntry[]>(
    initialMoviePoolEntries
  );
  // const apiService = useApi();
  const router = useRouter();

  // Initialize group with mock data
  useEffect(() => {
    setGroup({
      groupId: 1,
      name: "Movie Enthusiasts",
      description:
        "A group for movie lovers to share and vote on their favorite films.",
      creator: {
        userId: 1,
        username: "group_creator",
        email: "creator@example.com",
        bio: "Lover of all things cinema.",
        favoriteGenres: ["Drama", "Action", "Comedy"],
        favoriteMovie: mockWatchList[0],
        watchlist: [mockWatchList[0], mockWatchList[1]],
        password: "",
        watchedMovies: [],
      },
      members: mockGroupMembers,
      createdAt: "2025-04-01T12:00:00Z",
      moviePool: moviePoolEntries,
    });
  }, [moviePoolEntries]);

  // with endpoints...
  //   const fetchGroupDetails = async () => {
  //     try {
  //       const response = await apiService.get<Group>(`/groups/${groupId}`);
  //       setGroup(response);
  //     } catch (error) {
  //       console.error("Failed to fetch group details:", error);
  //     }
  //   };

  //   if (groupId) {
  //     fetchGroupDetails();
  //   }
  // }, [groupId, apiService]);

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
      // In a real implementation, this would call the API
      // await apiService.post(`/groups/${groupId}/pool/${movieId}`, {
      //   userId,
      //   movie: selectedMovies[0],
      // });

      // For our mock implementation, we'll update the local state
      const newEntry: MoviePoolEntry = {
        userId: 2, // alex.np's user ID
        movie: selectedMovies[0],
      };

      // Check if alex.np already has a movie in the pool
      const alexIndex = moviePoolEntries.findIndex(
        (entry) => entry.userId === 2
      );

      if (alexIndex !== -1) {
        // Replace existing movie
        const updatedEntries = [...moviePoolEntries];
        updatedEntries[alexIndex] = newEntry;
        setMoviePoolEntries(updatedEntries);
      } else {
        // Add new movie
        setMoviePoolEntries([...moviePoolEntries, newEntry]);
      }

      alert("Movie added to the pool successfully!");
      setSelectedMovies([]);
    } catch (error) {
      console.error("Failed to add movie to the pool:", error);
      alert(
        "An error occurred while adding the movie to the pool. Please try again."
      );
    }
  };

  const displayMovies = mockWatchList;

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
            emptyMessage="No movies match your genre"
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
        <div className="flex gap-4 overflow-x-auto">
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
