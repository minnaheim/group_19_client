"use client";
import React, { useState, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";
import { User } from "@/types/user";
import { Movie } from "@/types/movie";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "../../../../components/ui/button";
import Navigation from "../../../../components/ui/navigation";
import { ApplicationError } from "@/types/error";
import { Input } from "../../../../components/ui/input";
import { Search } from "lucide-react";

const SeenList: React.FC = () => {
    const { id } = useParams();
    const apiService = useApi();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedMoviesToRemove, setSelectedMoviesToRemove] = useState<number[]>([]);

    // Search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchCategory, setSearchCategory] = useState<string>("all");
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const { value: token } = useLocalStorage<string>("token", "");
    const { value: userId } = useLocalStorage<string>("userId", "");

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
                        watchlist: [],
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
        const movies = user?.watchedMovies || mockMovies;
        const query = searchQuery.toLowerCase().trim();

        const filtered = movies.filter(movie => {
            // Check title if category is "title" or "all"
            if (searchCategory === "title" || searchCategory === "all") {
                if (movie.title.toLowerCase().includes(query)) {
                    return true;
                }
            }

            // Check genre if category is "genre" or "all"
            if (searchCategory === "genre" || searchCategory === "all") {
                if (movie.genre.toLowerCase().includes(query)) {
                    return true;
                }
            }

            // Check director if category is "director" or "all"
            if (searchCategory === "director" || searchCategory === "all") {
                if (movie.director.toLowerCase().includes(query)) {
                    return true;
                }
            }

            // Check actors if category is "actors" or "all"
            if (searchCategory === "actors" || searchCategory === "all") {
                if (movie.actors.some(actor => actor.toLowerCase().includes(query))) {
                    return true;
                }
            }

            // If none of the above conditions matched, exclude this movie
            return false;
        });

        setFilteredMovies(filtered);
    }, [searchQuery, searchCategory, user?.watchedMovies]);

    const handleAddMovie = () => {
        if (userId === id) {
            router.push(`/users/${id}/search_movies`);
        } else {
            alert("You can only edit your own movie lists!");
        }
    };

    const handleEdit = () => {
        if (userId === id) {
            setIsEditing(true);
            // Clear search when entering edit mode
            setSearchQuery("");
            setIsSearching(false);
        } else {
            alert("You can only edit your own movie lists!");
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

    const handleSaveChanges = async () => {
        try {
            // Process each movie removal separately
            for (const movieId of selectedMoviesToRemove) {
                try {
                    // Call the server API to remove the movie
                    await apiService.delete(`/users/${id}/watched/${movieId}?token=${token}`);
                } catch (apiError) {
                    console.error("Error removing movie from watched list:", apiError);
                }
            }

            // After all removals, update local state
            if (user) {
                const updatedMovies = user.watchedMovies.filter(
                    movie => !selectedMoviesToRemove.includes(movie.id)
                );
                setUser({
                    ...user,
                    watchedMovies: updatedMovies
                });
            }

            setIsEditing(false);
            setSelectedMoviesToRemove([]);
        } catch (error) {
            setError("Failed to update movie list");
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                alert(`Error: ${applicationError.message}`);
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

    // Determine which movies to display
    const getDisplayMovies = () => {
        if (isSearching) {
            return filteredMovies;
        } else {
            return user?.watchedMovies || mockMovies;
        }
    };

    const mockMovies: Movie[] = [
        {
            id: 1,
            title: "Sample Movie 1",
            posterUrl: "/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
            details: "A thrilling adventure about a group of friends who embark on a journey.",
            genre: "Adventure",
            director: "John Doe",
            actors: ["Actor 1", "Actor 2", "Actor 3"],
            trailerURL: "https://www.example.com/trailer"
        },
        {
            id: 2,
            title: "Sample Movie 2",
            posterUrl: "/kzgPu2CMxBr4YZZxC1Off4cUfR9.jpg",
            details: "An epic tale of survival in a dystopian world.",
            genre: "Sci-Fi",
            director: "Jane Smith",
            actors: ["Actor 4", "Actor 5", "Actor 6"],
            trailerURL: "https://www.example.com/trailer2"
        },
        {
            id: 3,
            title: "Dune: Part Two",
            posterUrl: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
            details: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
            genre: "Science Fiction",
            director: "Denis Villeneuve",
            actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
            trailerURL: "https://www.example.com/dune-part-two"
        },
        {
            id: 4,
            title: "Oppenheimer",
            posterUrl: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
            details: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
            genre: "Drama",
            director: "Christopher Nolan",
            actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
            trailerURL: "https://www.example.com/oppenheimer"
        },
        {
            id: 5,
            title: "Poor Things",
            posterUrl: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
            details: "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
            genre: "Science Fiction",
            director: "Yorgos Lanthimos",
            actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
            trailerURL: "https://www.example.com/poor-things"
        },
        {
            id: 6,
            title: "The Fall Guy",
            posterUrl: "/6OnoMgGFuZ921eV8v8yEyXoag19.jpg",
            details: "A stuntman is drawn back into service when the star of a mega-budget studio movie goes missing.",
            genre: "Action",
            director: "David Leitch",
            actors: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson"],
            trailerURL: "https://www.example.com/fall-guy"
        },
        {
            id: 9,
            title: "The Batman",
            posterUrl: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
            details: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
            genre: "Action",
            director: "Matt Reeves",
            actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
            trailerURL: "https://www.example.com/the-batman"
        },
        {
            id: 11,
            title: "The Whale",
            posterUrl: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
            details: "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
            genre: "Drama",
            director: "Darren Aronofsky",
            actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
            trailerURL: "https://www.example.com/the-whale"
        },
        {
            id: 12,
            title: "Top Gun: Maverick",
            posterUrl: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
            details: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
            genre: "Action",
            director: "Joseph Kosinski",
            actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
            trailerURL: "https://www.example.com/top-gun-maverick"
        },
        {
            id: 13,
            title: "Everything Everywhere All at Once",
            posterUrl: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
            details: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
            genre: "Science Fiction",
            director: "Daniel Kwan, Daniel Scheinert",
            actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
            trailerURL: "https://www.example.com/everything-everywhere"
        }
    ];

    const displayMovies = getDisplayMovies();

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
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
            <Navigation userId={userId} activeItem="Profile Page" />

            {/* Main content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="mb-8">
                    <h1 className="font-semibold text-[#3b3e88] text-3xl">
                        Already Seen
                    </h1>
                    <p className="text-[#b9c0de] mt-2">
                        Movies on this list will not be recommended to you
                    </p>
                </div>

                {/* Search bar */}
                {!isEditing && (
                    <div className="mb-6 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Search movies..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10 py-2 w-full rounded-md bg-white"
                            />
                        </div>
                        <select
                            value={searchCategory}
                            onChange={handleCategoryChange}
                            className="p-2 rounded-[30px] border-none bg-[#3b3e88] text-white min-w-[120px] focus:ring-2 focus:ring-[#6266b6] focus:outline-none"
                        >
                            <option value="all">All</option>
                            <option value="title">Title</option>
                            <option value="genre">Genre</option>
                            <option value="director">Director</option>
                            <option value="actors">Actors</option>
                        </select>
                        {searchQuery && (
                            <Button
                                variant="destructive"
                                onClick={clearSearch}
                                className="px-4"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-[30px] shadow-lg relative p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">
                    {/* No results message */}
                    {isSearching && displayMovies.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-gray-500 text-lg mb-4">No movies found matching your search.</p>
                            <Button variant="destructive" onClick={clearSearch}>
                                Clear Search
                            </Button>
                        </div>
                    )}

                    {/* Movies */}
                    <div className="flex flex-wrap gap-6">
                        {displayMovies.map((movie) => (
                            <div
                                key={movie.id}
                                className={`relative ${isEditing ? 'cursor-pointer' : ''}`}
                                onClick={isEditing ? () => handleMovieSelect(movie.id) : undefined}
                            >
                                <img
                                    className={`w-[71px] h-[107px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] object-cover rounded-md ${
                                        isEditing ? 'opacity-50 hover:opacity-80' : ''
                                    } ${
                                        isEditing && selectedMoviesToRemove.includes(movie.id)
                                            ? 'border-2 border-destructive'
                                            : ''
                                    }`}
                                    alt={movie.title}
                                    src={`https://image.tmdb.org/t/p/w500${movie.posterUrl}`}
                                />
                                {isEditing && selectedMoviesToRemove.includes(movie.id) && (
                                    <div className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 text-xs sm:p-1.5 md:p-2 md:text-sm">
                                        ✕
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Movie Button*/}
                        {!isEditing && (
                            <div
                                className="w-[71px] h-[107px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] bg-[#ccd1ff] rounded-[10px] flex items-center justify-center cursor-pointer"
                                onClick={handleAddMovie}
                            >
                                <div className="relative w-[52px] h-[52px]">
                                    <img
                                        className="w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] md:w-[60px] md:h-[60px] object-cover"
                                        alt="Plus"
                                        src="/plus.png"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Results Summary */}
                {searchQuery && !isEditing && (
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
                            <Button
                                variant="destructive"
                                onClick={handleCancelEdit}
                            >
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
                        <Button
                            variant="secondary"
                            onClick={handleEdit}
                        >
                            Edit
                        </Button>
                    )}
                </div>

                {/* Back button */}
                <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => router.push(`/users/${id}/profile`)}
                >
                    Back to Profile
                </Button>
            </div>
        </div>
    );
};

export default SeenList;