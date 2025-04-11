"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { ApplicationError } from "@/app/types/error";
import ActionMessage from "@/components/ui/action_message";
import MovieCard from "@/components/ui/Movie_card";
import MovieDetailsModal from "@/components/ui/movie_details";

const Profile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const handleEditProfile = () => {
    if (userId.valueOf() == id) {
      router.push(`/users/${id}/edit_profile`);
    } else {
      showMessage("You can only edit your own profile");
    }
  };

  const handleEditWatched = () => {
    if (userId.valueOf() == id) {
      router.push(`/users/${id}/seen_list`);
    } else {
      showMessage("You can only edit your own profile");
    }
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // Delay to allow animation
  };

  const handleBack = () => {
    router.push("/users/dashboard");
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUser: User = await apiService.get(`/users/${id}/profile`);
      setUser(fetchedUser);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        showMessage(`Error: ${applicationError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchedMovies = async () => {
    try {
      const fetchedWatchedMovies: Movie[] = await apiService.get(
        `/watched/${id}`,
      );
      setUser((prevUser) =>
        prevUser ? { ...prevUser, watchedMovies: fetchedWatchedMovies } : null
      );
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        // just log the error but don't show a message since this is a secondary fetch
        console.error(
          `Error fetching watched movies: ${applicationError.message}`,
        );
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUser();
      await fetchWatchedMovies();
    };

    loadData();
  }, [id, apiService, token]);

  const mockMovies: Movie[] = [
    {
      movieId: 1,
      title: "To All the Boys I've Loved Before",
      posterURL: "/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
      description:
        "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
      genres: ["Teen Romance", "Comedy", "Drama"],
      directors: ["Susan Johnson"],
      actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
      trailerURL: "https://www.example.com/to-all-the-boys",
      year: 2018,
      originallanguage: "English",
    },
    {
      movieId: 2,
      title: "The Kissing Booth",
      posterURL: "/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
      description:
        "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
      genres: ["Teen Romance", "Comedy"],
      directors: ["Vince Marcello"],
      actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
      trailerURL: "https://www.example.com/kissing-booth",
      year: 2018,
      originallanguage: "English",
    },
    {
      movieId: 35,
      title: "Dune: Part Two",
      posterURL: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genres: ["Science Fiction", "Adventure", "Action"],
      directors: ["Denis Villeneuve"],
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
      year: 2024,
      originallanguage: "English",
    },
    {
      movieId: 40,
      title: "Oppenheimer",
      posterURL: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genres: ["Drama", "Biography", "History"],
      directors: ["Christopher Nolan"],
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 3,
      title: "Poor Things",
      posterURL: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      description:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genres: ["Science Fiction", "Comedy", "Drama"],
      directors: ["Yorgos Lanthimos"],
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 4,
      title: "The Fall Guy",
      posterURL: "/6OnoMgGFuZ921eV8v8yEyXoag19.jpg",
      description:
        "A stuntman is drawn back into service when the star of a mega-budget studio movie goes missing.",
      genres: ["Action", "Comedy"],
      directors: ["David Leitch"],
      actors: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson"],
      trailerURL: "https://www.example.com/fall-guy",
      year: 2024,
      originallanguage: "English",
    },
    {
      movieId: 5,
      title: "The Batman",
      posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      description:
        "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
      genres: ["Action", "Crime", "Drama"],
      directors: ["Matt Reeves"],
      actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
      trailerURL: "https://www.example.com/the-batman",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 6,
      title: "The Whale",
      posterURL: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
      description:
        "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
      genres: ["Drama"],
      directors: ["Darren Aronofsky"],
      actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
      trailerURL: "https://www.example.com/the-whale",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 7,
      title: "Top Gun: Maverick",
      posterURL: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      description:
        "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
      genres: ["Action", "Drama"],
      directors: ["Joseph Kosinski"],
      actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
      trailerURL: "https://www.example.com/top-gun-maverick",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 8,
      title: "Everything Everywhere All at Once",
      posterURL: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
      description:
        "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
      genres: ["Science Fiction", "Comedy", "Action"],
      directors: ["Daniel Kwan", "Daniel Scheinert"],
      actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
      trailerURL: "https://www.example.com/everything-everywhere",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 10,
      title: "Killers of the Flower Moon",
      posterURL: "/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      description:
        "When oil is discovered in 1920s Oklahoma under Osage Nation land, the Osage people are murdered one by one—until the FBI steps in to unravel the mystery.",
      genres: ["Crime", "Drama", "Western"],
      directors: ["Martin Scorsese"],
      actors: ["Leonardo DiCaprio", "Robert De Niro", "Lily Gladstone"],
      trailerURL: "https://www.example.com/killers-flower-moon",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 13,
      title: "Anatomy of a Fall",
      posterURL: "/kQs6keheMwCxJxrzV83VUwFtHkB.jpg",
      description:
        "A woman is suspected of her husband's murder, and their blind son faces a moral dilemma as the sole witness.",
      genres: ["Legal Drama", "Mystery", "Thriller"],
      directors: ["Justine Triet"],
      actors: ["Sandra Hüller", "Swann Arlaud", "Milo Machado Graner"],
      trailerURL: "https://www.example.com/anatomy-of-a-fall",
      year: 2023,
      originallanguage: "French",
    },
    {
      movieId: 15,
      title: "Mission: Impossible - Dead Reckoning Part One",
      posterURL: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
      description:
        "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.",
      genres: ["Action", "Adventure", "Thriller"],
      directors: ["Christopher McQuarrie"],
      actors: ["Tom Cruise", "Hayley Atwell", "Simon Pegg"],
      trailerURL: "https://www.example.com/mission-impossible",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 22,
      title: "Civil War",
      posterURL: "/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg",
      description:
        "In a near-future America ravaged by political divisions, a team of journalists traverses the war-torn landscape to report on the conflict as rebel factions fight against the government.",
      genres: ["Drama", "Action", "Thriller"],
      directors: ["Alex Garland"],
      actors: ["Kirsten Dunst", "Wagner Moura", "Cailee Spaeny"],
      trailerURL: "https://www.example.com/civil-war",
      year: 2024,
      originallanguage: "English",
    },
    {
      movieId: 25,
      title: "John Wick: Chapter 4",
      posterURL: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
      description:
        "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.",
      genres: ["Action", "Thriller", "Crime"],
      directors: ["Chad Stahelski"],
      actors: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård"],
      trailerURL: "https://www.example.com/john-wick-4",
      year: 2023,
      originallanguage: "English",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
      </div>
    );
  }

  const watchedMoviesToDisplay = user?.watchedMovies || mockMovies;

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      <Navigation userId={userId} activeItem="Profile Page" />
      {/* Main content */}
      <div className="flex-1 p-6 md:p-12">
        <h1 className="font-semibold text-[#3b3e88] text-3xl mb-8">
          Profile Page
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="relative">
              <img
                className="w-full h-48 object-cover"
                alt="Profile Banner"
                src="/rectangle-45.svg"
              />
              <h2 className="absolute top-10 left-6 font-bold text-white text-3xl">
                Your Profile
              </h2>
            </div>

            {/* Profile Body */}
            <div className="p-6 space-y-6">
              <div>
                <p className="font-semibold text-[#3b3e88] text-base">
                  username: {user?.username ? user.username : "Ella"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#3b3e88] text-base">
                  e-mail: {user?.email ? user.email : "ella@philippi.com"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#3b3e88] text-base">
                  password: {user?.password ? user.password : "password1234"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#3b3e88] text-base">
                  bio:{" "}
                  {user?.bio ? user.bio : "Hi! I love the app Movie Night."}
                </p>
              </div>

              <div className="mt-6">
                <p className="font-semibold text-[#3b3e88] text-base mb-2">
                  favorite movie:
                </p>
                {user?.favoriteMovie ? (
                    <div className="flex justify-center">
                      <MovieCard
                          movie={user.favoriteMovie}
                          isInWatchlist={false}
                          isInSeenList={false}
                          onClick={handleMovieClick}
                      />
                    </div>
                ) : (
                    <div className="flex justify-center">
                      <MovieCard
                          movie={mockMovies[0]} /* Use the first mock movie as default */
                          isInWatchlist={false}
                          isInSeenList={false}
                          onClick={handleMovieClick}
                      />
                    </div>
                )}
                {/* Movie Details Modal */}
                {selectedMovie && (
                    <MovieDetailsModal
                        movie={selectedMovie}
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        isInWatchlist={user?.favoriteMovie?.movieId !== selectedMovie.movieId ?
                            (user?.watchlist?.some(m => m.movieId === selectedMovie.movieId) || false) : false}
                        isInSeenList={user?.favoriteMovie?.movieId !== selectedMovie.movieId ?
                            (user?.watchedMovies?.some(m => m.movieId === selectedMovie.movieId) || false) : false}
                    />
                )}
              </div>


              <Button
                  variant="default"
                  className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                  onClick={handleEditProfile}
              >
                edit profile
              </Button>
            </div>
          </div>

          {/* Watched Movies Card */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="font-semibold text-[#3b3e88] text-2xl mb-4">
              Already Seen
            </h2>

            <div className="mb-8 max-h-[400px] overflow-y-auto">
              {/* Movie Grid using custom component approach */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watchedMoviesToDisplay.map((movie) => (
                    <img
                        key={movie.movieId}
                        className="w-full aspect-[2/3] object-cover rounded"
                    alt={movie.title}
                    src={`https://image.tmdb.org/t/p/w500${movie.posterURL}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="default"
                className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                onClick={handleEditWatched}
              >
                edit seen movies
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          className="mt-8 bg-[#f44771] opacity-50 hover:bg-[#f44771]/60 hover:opacity-80"
          onClick={handleBack}
        >
          back to dashboard
        </Button>

        {/* Action Message Component */}
        <ActionMessage
          message={actionMessage}
          isVisible={showActionMessage}
          onHide={() => setShowActionMessage(false)}
        />
      </div>
    </div>
  );
};

export default Profile;
