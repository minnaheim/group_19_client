"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { ApplicationError } from "@/app/types/error";
import SearchBar from "@/components/ui/search_bar";
import MovieList from "@/components/ui/movie_list";
import MovieDetailsModal from "@/components/ui/movie_details";
import ActionMessage from "@/components/ui/action_message";




const WatchList: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedMoviesToRemove, setSelectedMoviesToRemove] = useState<
    number[]
  >([]);

    // search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchCategory, setSearchCategory] = useState<string>("all");
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // movie inspection
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // action feedback
    const [actionMessage, setActionMessage] = useState<string>("");
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

    const mockMovies: Movie[] = [
        {
            id: 1,
            title: "To All the Boys I've Loved Before",
            posterUrl: "/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
            details: "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
            genre: "Teen Romance",
            director: "Susan Johnson",
            actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
            trailerURL: "https://www.example.com/to-all-the-boys"
        },
        {
            id: 2,
            title: "The Kissing Booth",
            posterUrl: "/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
            details: "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
            genre: "Teen Romance",
            director: "Vince Marcello",
            actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
            trailerURL: "https://www.example.com/kissing-booth"
        },

        {
            id: 301,
            title: "Dune: Part Two",
            posterUrl: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
            details: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
            genre: "Science Fiction",
            director: "Denis Villeneuve",
            actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
            trailerURL: "https://www.example.com/dune-part-two"
        },
        {
            id: 300,
            title: "Oppenheimer",
            posterUrl: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            details: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
            genre: "Drama",
            director: "Christopher Nolan",
            actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
            trailerURL: "https://www.example.com/oppenheimer"
        },
        {
            id: 3,
            title: "Poor Things",
            posterUrl: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
            details: "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
            genre: "Science Fiction",
            director: "Yorgos Lanthimos",
            actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
            trailerURL: "https://www.example.com/poor-things"
        },
        {
            id: 4,
            title: "The Fall Guy",
            posterUrl: "/6OnoMgGFuZ921eV8v8yEyXoag19.jpg",
            details: "A stuntman is drawn back into service when the star of a mega-budget studio movie goes missing.",
            genre: "Action",
            director: "David Leitch",
            actors: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson"],
            trailerURL: "https://www.example.com/fall-guy"
        },
        {
            id: 5,
            title: "The Batman",
            posterUrl: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
            details: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
            genre: "Action",
            director: "Matt Reeves",
            actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
            trailerURL: "https://www.example.com/the-batman"
        },
        {
            id: 6,
            title: "The Whale",
            posterUrl: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
            details: "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
            genre: "Drama",
            director: "Darren Aronofsky",
            actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
            trailerURL: "https://www.example.com/the-whale"
        },
        {
            id: 7,
            title: "Top Gun: Maverick",
            posterUrl: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
            details: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
            genre: "Action",
            director: "Joseph Kosinski",
            actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
            trailerURL: "https://www.example.com/top-gun-maverick"
        },
        {
            id: 8,
            title: "Everything Everywhere All at Once",
            posterUrl: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
            details: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
            genre: "Science Fiction",
            director: "Daniel Kwan, Daniel Scheinert",
            actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
            trailerURL: "https://www.example.com/everything-everywhere"
        },

        {
            id: 10,
            title: "Killers of the Flower Moon",
            posterUrl: "/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
            details: "When oil is discovered in 1920s Oklahoma under Osage Nation land, the Osage people are murdered one by one—until the FBI steps in to unravel the mystery.",
            genre: "Crime",
            director: "Martin Scorsese",
            actors: ["Leonardo DiCaprio", "Robert De Niro", "Lily Gladstone"],
            trailerURL: "https://www.example.com/killers-flower-moon"
        },

        {
            id: 13,
            title: "Anatomy of a Fall",
            posterUrl: "/kQs6keheMwCxJxrzV83VUwFtHkB.jpg",
            details: "A woman is suspected of her husband's murder, and their blind son faces a moral dilemma as the sole witness.",
            genre: "Legal Drama",
            director: "Justine Triet",
            actors: ["Sandra Hüller", "Swann Arlaud", "Milo Machado Graner"],
            trailerURL: "https://www.example.com/anatomy-of-a-fall"
        },

        {
            id: 15,
            title: "Mission: Impossible - Dead Reckoning Part One",
            posterUrl: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
            details: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.",
            genre: "Action",
            director: "Christopher McQuarrie",
            actors: ["Tom Cruise", "Hayley Atwell", "Simon Pegg"],
            trailerURL: "https://www.example.com/mission-impossible"
        },

        {
            id: 22,
            title: "Civil War",
            posterUrl: "/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg",
            details: "In a near-future America ravaged by political divisions, a team of journalists traverses the war-torn landscape to report on the conflict as rebel factions fight against the government.",
            genre: "Drama",
            director: "Alex Garland",
            actors: ["Kirsten Dunst", "Wagner Moura", "Cailee Spaeny"],
            trailerURL: "https://www.example.com/civil-war"
        },

        {
            id: 25,
            title: "John Wick: Chapter 4",
            posterUrl: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
            details: "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.",
            genre: "Action",
            director: "Chad Stahelski",
            actors: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård"],
            trailerURL: "https://www.example.com/john-wick-4"
        }
    ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

            try {
                setLoading(true);

                // Try to get the user data from the profile endpoint
                try {
                    const userData = await apiService.get(`/users/${id}/profile`);
                    setUser(userData);
                } catch (apiError) {
                    console.log("API error, using mock data:", apiError);
                    // Fall back to mock data if the API call fails
                    setUser({
                        id: parseInt(id as string),
                        username: "moviefan",
                        email: "user@example.com",
                        password: "******",
                        bio: "I love movies!",
                        favoriteGenres: ["Sci-Fi", "Thriller"],
                        favoriteMovie: mockMovies[0],
                        watchlist: mockMovies,
                        watchedMovies: mockMovies
                    });
                }
                setLoading(false);
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

    // Filter movies based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const movies = user?.watchlist || [];
        const query = searchQuery.toLowerCase().trim();

    const filtered = movies.filter((movie) => {
      if (searchCategory === "title" || searchCategory === "all") {
        if (movie.title.toLowerCase().includes(query)) {
          return true;
        }
      }

      if (searchCategory === "genre" || searchCategory === "all") {
        if (movie.genre.toLowerCase().includes(query)) {
          return true;
        }
      }

      if (searchCategory === "director" || searchCategory === "all") {
        if (movie.director.toLowerCase().includes(query)) {
          return true;
        }
      }

      if (searchCategory === "actors" || searchCategory === "all") {
        if (movie.actors.some((actor) => actor.toLowerCase().includes(query))) {
          return true;
        }
      }

      return false;
    });

    setFilteredMovies(filtered);
  }, [searchQuery, searchCategory, user?.watchlist]);

    const handleAddMovie = () => {
        if (userId === id) {
            router.push(`/users/${id}/movie_search`);
        } else {
            showMessage("You can only edit your own movie lists!");
        }
    };

    const handleEdit = () => {
        if (userId === id) {
            setIsEditing(true);
            setSearchQuery("");
            setIsSearching(false);
        } else {
            showMessage("You can only edit your own movie lists!");
        }
    };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedMoviesToRemove([]);
  };

    const handleMovieSelect = (movieId: number) => {
        if (selectedMoviesToRemove.includes(movieId)) {
            setSelectedMoviesToRemove(selectedMoviesToRemove.filter(id => id !== movieId));
        } else {
            setSelectedMoviesToRemove([...selectedMoviesToRemove, movieId]);
        }
    };

    const handleMovieClick = (movie: Movie) => {
        // If in editing mode, select/deselect the movie
        if (isEditing) {
            handleMovieSelect(movie.id);
            return;
        }

        // Otherwise open the details modal
        setSelectedMovie(movie);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        try {

            // Process each movie removal separately
            for (const movieId of selectedMoviesToRemove) {
                try {
                    // Call the server API to remove the movie
                    await apiService.delete(`/users/${id}/watchlist/${movieId}?token=${token}`);
                } catch (apiError) {
                    console.error("Error removing movie from watchlist:", apiError);
                }
            }

            // After all removals, update local state
            if (user) {
                const updatedMovies = user.watchlist.filter(
                    movie => !selectedMoviesToRemove.includes(movie.id)
                );

                setUser({
                    ...user,
                    watchlist: updatedMovies
                });
            }

            showMessage(`Removed ${selectedMoviesToRemove.length} movie(s) from your watchlist`);
            setIsEditing(false);
            setSelectedMoviesToRemove([]);
        } catch (error) {
            setError("Failed to update movie list");
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                showMessage(`Error: ${applicationError.message}`);
            }
        }
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
  };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedMovie(null), 300);
    };

    const isInSeenList = (movie: Movie) => {
        return user?.watchedMovies.some(m => m.id === movie.id) || false;
    };

    const handleMarkAsSeen = async (movie: Movie) => {
        if (isInSeenList(movie)) {
            showMessage("Movie already in your seen list");
            return;
        }

        try {
            // TODO: Replace with actual API call
            // await apiService.post(`/watched/${id}`, { movieId: movie.id });

            // Update local state for now
            if (user) {
                setUser({
                    ...user,
                    watchedMovies: [...user.watchedMovies, movie],
                    watchlist: user.watchlist.filter(m => m.id !== movie.id)
                });
            }

            showMessage("Moved to your seen list");
        } catch (error) {
            setError("Failed to mark movie as seen");
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                showMessage(`Error: ${applicationError.message}`);
            }
        }
    };

    const handleRemoveFromWatchlist = (movie: Movie) => {
        setIsEditing(true);
        setSelectedMoviesToRemove([movie.id]);
        closeModal();
    };

    const showMessage = (message: string) => {
        setActionMessage(message);
        setShowActionMessage(true);
        setTimeout(() => {
            setShowActionMessage(false);
        }, 3000);
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }


    // Determine which movies to display
    const displayMovies = isSearching ? filteredMovies : (user?.watchlist || []);

    return (
        <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
            {/* Sidebar */}
            <Navigation userId={userId} activeItem="Watch List" />

            {/* Main content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="mb-8">
                    <h1 className="font-semibold text-[#3b3e88] text-3xl">
                        Your Watchlist
                    </h1>
                    <p className="text-[#b9c0de] mt-2">
                        Movies you want to watch in the future
                    </p>
                </div>

                {/* Search bar component */}
                {!isEditing && (
                    <SearchBar
                        searchQuery={searchQuery}
                        searchCategory={searchCategory}
                        onSearchChange={handleSearchChange}
                        onCategoryChange={handleCategoryChange}
                        onClearSearch={clearSearch}
                        className="mb-6"
                    />
                )}

                {/* Movie list component */}
                <MovieList
                    movies={displayMovies}
                    isLoading={loading}
                    isEditing={isEditing}
                    isSearching={isSearching}
                    selectedMovieIds={selectedMoviesToRemove}
                    onMovieClick={handleMovieClick}
                    onMovieSelect={handleMovieSelect}
                    onAddMovieClick={handleAddMovie}
                    onClearSearch={clearSearch}
                    emptyMessage="Your watchlist is empty"
                    noResultsMessage="None of the movies on your watchlist match your search"
                    isInSeenListFn={isInSeenList}
                />


                {/* Search Results Summary */}
                {searchQuery && !isEditing && displayMovies.length > 0 && (
                    <div className="mt-4 text-[#3b3e88]">
                        Found {displayMovies.length} movies matching &#34;{searchQuery}&#34; in {
                        searchCategory === "all" ? "all categories" : searchCategory
                    }
                    </div>
                )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          {isEditing ? (
            <>
              <Button variant="destructive" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveChanges}
                disabled={selectedMoviesToRemove.length === 0}
              >
                Remove {selectedMoviesToRemove.length} movie(s)
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>

                {/* Back button */}
                <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => router.push(`/users/${id}/dashboard`)}
                >
                    Back to Dashboard
                </Button>

                {/* Movie Details Modal */}
                {selectedMovie && (
                    <MovieDetailsModal
                        movie={selectedMovie}
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        isInWatchlist={true}
                        isInSeenList={isInSeenList(selectedMovie)}
                        onMarkAsSeen={handleMarkAsSeen}
                        onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    />
                )}

                {/* Action Message */}
                <ActionMessage
                    message={actionMessage}
                    isVisible={showActionMessage}
                    onHide={() => setShowActionMessage(false)}
                />
            </div>
        </div>
    );
};

export default WatchList;
