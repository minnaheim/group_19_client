"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import SearchBar from "@/components/ui/search_bar";
import MovieList from "@/components/ui/movie_list";
import MovieDetailsModal from "@/components/ui/movie_details";
import ActionMessage from "@/components/ui/action_message";

interface Friend {
    userId: number;
    username: string;
    email?: string;
    bio?: string;
    // other properties as needed
}

const FriendWatchlist: React.FC = () => {
    const { id } = useParams();
    const apiService = useApi();
    const router = useRouter();

    const [friend, setFriend] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    const { value: userId } = useLocalStorage<string>("userId", "");

    // mock data for demo purposes
    const mockMovies: Movie[] = [
        {
            movieId: 1,
            title: "To All the Boys I've Loved Before",
            posterURL: "`https://image.tmdb.org/t/p/w92$/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
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
            posterURL: "`https://image.tmdb.org/t/p/w92$/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
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
            posterURL: "https://image.tmdb.org/t/p/w92$/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
            description:
                "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
            genres: ["Science Fiction", "Adventure", "Action"],
            directors: ["Denis Villeneuve"],
            actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
            trailerURL: "https://www.example.com/dune-part-two",
            year: 2024,
            originallanguage: "English",
        },
    ];

    // fetch friend data
    useEffect(() => {
        const fetchFriendData = async () => {
            if (!id) return;

            try {
                setLoading(true);

                try {
                    // First check if this user is actually a friend

                    const friendsResponse = await apiService.get<Friend[]>('/friends');

                    // Check if the user is in the friends list
                    const isFriend = Array.isArray(friendsResponse) &&
                        friendsResponse.some((friend) => friend.userId.toString() === id.toString());

                    if (!isFriend) {
                        throw new Error("User is not in your friends list");
                    }

                    // Get the friend's profile data
                    const userData = await apiService.get<User>(`/profile/${id}`);

                    // Get friend's watchlist according to REST spec: GET /watchlist/{userId}
                    const watchlistData = await apiService.get<Movie[]>(`/watchlist/${id}`);

                    // Update user with watchlist
                    const friendWithWatchlist = {
                        ...userData,
                        watchlist: watchlistData
                    };

                    setFriend(friendWithWatchlist);
                } catch (apiError) {
                    console.log("API error, using mock data:", apiError);
                    // fall back to mock data
                    setFriend({
                        userId: parseInt(id as string),
                        username: "minna",
                        email: "friend@example.com",
                        password: "******",
                        bio: "This is a friend's profile",
                        favoriteGenres: ["Action", "Comedy"],
                        favoriteMovie: mockMovies[0],
                        watchlist: mockMovies,
                        watchedMovies: [],
                    });
                }
            } catch (error) {
                setError("Failed to load friend data");
                if (error instanceof Error) {
                    showMessage(`Error: ${error.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFriendData();
    }, [id, apiService]);

    // filter movies based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const movies = friend?.watchlist || [];
        const query = searchQuery.toLowerCase().trim();

        const filtered = movies.filter((movie) => {
            if (searchCategory === "title" || searchCategory === "all") {
                if (movie.title.toLowerCase().includes(query)) {
                    return true;
                }
            }

            if (searchCategory === "genre" || searchCategory === "all") {
                if (movie.genres.some((genre) => genre.toLowerCase().includes(query))) {
                    return true;
                }
            }

            if (searchCategory === "director" || searchCategory === "all") {
                if (
                    movie.directors.some((director) =>
                        director.toLowerCase().includes(query)
                    )
                ) {
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
    }, [searchQuery, searchCategory, friend?.watchlist]);

    const handleMovieClick = (movie: Movie) => {
        // open the details modal
        setSelectedMovie(movie);
        setIsModalOpen(true);
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

    const showMessage = (message: string) => {
        setActionMessage(message);
        setShowActionMessage(true);
        setTimeout(() => {
            setShowActionMessage(false);
        }, 3000);
    };

    // determine which movies to display
    const displayMovies = isSearching ? filteredMovies : (friend?.watchlist || []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-8">{error}</div>;
    }

    return (
        <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
            {/* sidebar */}
            <Navigation userId={userId} activeItem="Your Friends" />

            {/* main content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="mb-8">
                    <h1 className="font-semibold text-[#3b3e88] text-3xl">
                        {friend?.username}&#39;s Watchlist
                    </h1>
                    <p className="text-[#b9c0de] mt-2">
                        Movies your friend wants to watch
                    </p>
                </div>

                {/* search bar component */}
                <SearchBar
                    searchQuery={searchQuery}
                    searchCategory={searchCategory}
                    onSearchChange={handleSearchChange}
                    onCategoryChange={handleCategoryChange}
                    onClearSearch={clearSearch}
                    className="mb-6"
                />

                {/* movie list component */}
                <MovieList
                    movies={displayMovies}
                    isLoading={loading}
                    isSearching={isSearching}
                    onMovieClick={handleMovieClick}
                    onClearSearch={clearSearch}
                    emptyMessage={`${friend?.username}'s watchlist is empty`}
                    noResultsMessage="None of the movies on this watchlist match your search"
                />

                {/* search results summary */}
                {searchQuery && displayMovies.length > 0 && (
                    <div className="mt-4 text-[#3b3e88]">
                        Found {displayMovies.length}{" "}
                        movies matching &#34;{searchQuery}&#34; in{" "}
                        {searchCategory === "all" ? "all categories" : searchCategory}
                    </div>
                )}

                {/* back button */}
                <Button
                    variant="destructive"
                    className="mt-6"
                    onClick={() => router.push(`/users/${userId}/friends`)}
                >
                    Back to Friends
                </Button>

                {/* movie details modal */}
                {selectedMovie && (
                    <MovieDetailsModal
                        movie={selectedMovie}
                        isOpen={isModalOpen}
                        onClose={closeModal}
                    />
                )}

                {/* action message */}
                <ActionMessage
                    message={actionMessage}
                    isVisible={showActionMessage}
                    onHide={() => setShowActionMessage(false)}
                />
            </div>
        </div>
    );
};

export default FriendWatchlist;