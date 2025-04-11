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
import MovieDetailsModal from "@/components/ui/movie_details";
import MovieList from "@/components/ui/movie_list";
import SearchBar from "@/components/ui/search_bar";

const SearchMovies: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // movie inspection
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // mock data for testing
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

  // fetch user data
  useEffect(() => {
    const fetchUserData = () => { // ADD async later when await is used
      if (!id) return;

      try {
        setLoading(true);

        // TODO: Replace with actual API call when ready
        // const userData = await apiService.get(`/profile/${id}`);
        // const watchlist = await apiService.get(`/watchlist/${id}`);
        // const watchedMovies = await apiService.get(`/watched/${id}`);

        // mock data for testing
        setTimeout(() => {
          setUser({
            userId: parseInt(id as string),
            username: "ella",
            email: "ella@philippi.com",
            password: "******",
            bio: "I love movies!",
            favoriteGenres: ["Science Fiction", "Action", "Drama"],
            favoriteMovie: mockMovies[0],
            watchlist: [mockMovies[0], mockMovies[2]],
            watchedMovies: [mockMovies[1], mockMovies[3]],
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        setError("Failed to load user data");
        if (error instanceof Error && "status" in error) {
          const applicationError = error as ApplicationError;
          alert(`Error: ${applicationError.message}`);
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, token, apiService]);

  // search movies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // TODO: Replace with actual API call
    // const searchMovies = async () => {
    //     try {
    //         // build query parameters based on selected category
    //         const queryParams: Record<string, string> = {};
    //
    //         if (searchCategory === "title" || searchCategory === "all") {
    //             queryParams.title = searchQuery;
    //         }
    //
    //         if (searchCategory === "genre" || searchCategory === "all") {
    //             queryParams.genre = searchQuery;
    //         }
    //
    //         if (searchCategory === "director" || searchCategory === "all") {
    //             queryParams.director = searchQuery;
    //         }
    //
    //         if (searchCategory === "actors" || searchCategory === "all") {
    //             queryParams.actor = searchQuery;
    //         }
    //
    //         // construct query string
    //         const queryString = Object.entries(queryParams)
    //             .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    //             .join('&');
    //
    //         // make API call with query parameters
    //         const results = await apiService.get(`/movies?${queryString}`);
    //         if (Array.isArray(results)) {
    //             setSearchResults(results as Movie[]);
    //         } else {
    //             setSearchResults([]);
    //         }
    //     } catch (error) {
    //         if (error instanceof Error && "status" in error) {
    //             const applicationError = error as ApplicationError;
    //             if (applicationError.status === 400) {
    //                 setError(`Search failed: ${applicationError.message}`);
    //             } else {
    //                 setError("Failed to search movies");
    //             }
    //         }
    //         setSearchResults([]);
    //     }
    // };

    // mock search for now
    const query = searchQuery.toLowerCase().trim();
    const filtered = mockMovies.filter((movie) => {
      if (searchCategory === "title" || searchCategory === "all") {
        if (movie.title.toLowerCase().includes(query)) return true;
      }

      if (searchCategory === "genre" || searchCategory === "all") {
        if (movie.genres.some((genre) => genre.toLowerCase().includes(query))) {
          return true;
        }
      }
/*
      if (searchCategory === "director" || searchCategory === "all") {
        if (
          movie.directors.some((director) =>
            director.toLowerCase().includes(query)
          )
        ) return true;
      }

      if (searchCategory === "actors" || searchCategory === "all") {
        if (movie.actors.some((actor) => actor.toLowerCase().includes(query))) {
          return true;
        }
      }

 */

      return false;
    });

    // simulate API delay
    setTimeout(() => {
      setSearchResults(filtered);
    }, 300);

    // TODO: uncomment this when switching to real API
    // // bebounce search to avoid too many API calls
    // const debounceTimer = setTimeout(() => {
    //     searchMovies();
    // }, 300);
    //
    // return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchCategory]);

  // get recommended movies based on user preferences
  const getRecommendedMovies = () => {
    if (!user || !user.favoriteGenres?.length) {
      return [];
    }

    // TODO: Replace with API call to /movies/suggestions/{userId} when ready
    // filter movies based on user's favorite genres
    return mockMovies.filter((movie) =>
      user.favoriteGenres!.some((favoriteGenre) =>
        movie.genres.some((movieGenre) =>
          movieGenre.toLowerCase().includes(favoriteGenre.toLowerCase())
        )
      )
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchCategory(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchCategory("all");
    setIsSearching(false);
    setSearchResults([]);
  };

  const handleMovieClick = (movie: Movie) => {
    // TODO: Replace with actual API call when ready
    // try {
    //     const detailedMovie = await apiService.get(`/movies/${movie.id}`);
    //     if (detailedMovie && typeof detailedMovie === 'object') {
    //         setSelectedMovie(detailedMovie as Movie);
    //     } else {
    //         setSelectedMovie(movie);
    //     }
    //     setIsModalOpen(true);
    // } catch (error) {
    //     if (error instanceof Error && "status" in error) {
    //         const applicationError = error as ApplicationError;
    //         if (applicationError.status === 404) {
    //             showMessage("Movie details not found");
    //         } else {
    //             showMessage("Error loading movie details");
    //         }
    //     }
    // }

    // for testing, just use the movie data we already have
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // Delay to allow animation
  };

  const isInWatchlist = (movie: Movie) => {
    return user?.watchlist.some((m) => m.movieId === movie.movieId) || false;
  };

  const isInSeenList = (movie: Movie) => {
    return user?.watchedMovies.some((m) => m.movieId === movie.movieId) ||
      false;
  };

  const handleAddToWatchlist = (movie: Movie) => { // ADD async later when await is used
    if (isInWatchlist(movie)) {
      showMessage("Movie already in your watchlist");
      return;
    }

    try {
      // TODO: Replace with actual API call when ready
      // await apiService.post(`/watchlist/${id}`, { movieId: movie.id });

      // update local state for now
      if (user) {
        setUser({
          ...user,
          watchlist: [...user.watchlist, movie],
        });
      }

      showMessage("Added to your watchlist");
    } catch (error) {
      setError("Failed to add movie to watchlist");
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        alert(`Error: ${applicationError.message}`);
      }
    }
  };

  const handleAddToSeenList = (movie: Movie) => { // ADD async later when await is used
    if (isInSeenList(movie)) {
      showMessage("Movie already in your seen list");
      return;
    }

    try {
      // TODO: Replace with actual API call when ready
      // await apiService.post(`/watched/${id}`, { movieId: movie.id });

      // update local state for now
      if (user) {
        setUser({
          ...user,
          watchedMovies: [...user.watchedMovies, movie],
        });
      }

      showMessage("Added to your seen list");
    } catch (error) {
      setError("Failed to add movie to seen list");
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        alert(`Error: ${applicationError.message}`);
      }
    }
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  // display recommendations if not searching, otherwise show search results
  const displayMovies = isSearching ? searchResults : getRecommendedMovies();

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

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      {/* Sidebar */}
      <Navigation userId={userId} activeItem="Search Movies" />

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            Search Movies
          </h1>
          <p className="text-[#b9c0de] mt-2">
            Find movies to add to your watchlist!
          </p>
        </div>

        {/* Search bar component */}
        <SearchBar
          searchQuery={searchQuery}
          searchCategory={searchCategory}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onClearSearch={clearSearch}
          placeholder="Search for movies..."
          className="mb-6"
        />

        {/* Content heading */}
        <div className="mb-4">
          <h2 className="text-xl font-medium text-[#3b3e88]">
            {isSearching
              ? `Search Results (${searchResults.length})`
              : "Browse movies based on your preferences"}
          </h2>
        </div>

        {/* Movie list component */}
        <MovieList
          movies={displayMovies}
          isLoading={false}
          isSearching={isSearching}
          onMovieClick={handleMovieClick}
          onClearSearch={clearSearch}
          emptyMessage="No recommended movies available"
          noResultsMessage="There are no movies that match your search"
          isInWatchlistFn={isInWatchlist}
          isInSeenListFn={isInSeenList}
        />

        {/* Back button */}
        <Button
          variant="destructive"
          className="mt-6"
          onClick={() => router.push(`/users/${id}/dashboard`)}
        >
          back to dashboard
        </Button>

        {/* Movie Details Modal Component */}
        {selectedMovie && (
          <MovieDetailsModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={closeModal}
            isInWatchlist={isInWatchlist(selectedMovie)}
            isInSeenList={isInSeenList(selectedMovie)}
            onAddToWatchlist={handleAddToWatchlist}
            onMarkAsSeen={handleAddToSeenList}
          />
        )}

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

export default SearchMovies;
