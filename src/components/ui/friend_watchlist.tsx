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


const FriendWatchlist: React.FC = () => {
    const { id, friendId } = useParams(); // Updated to use friendId param
    const apiService = useApi();
    const router = useRouter();

    const [friend, setFriend] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // movie inspection
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // action feedback
    const [actionMessage, setActionMessage] = useState<string>("");
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

    const { value: userId } = useLocalStorage<string>("userId", "");

    // fetch friend data
    useEffect(() => {
        const fetchFriendData = async () => {
            // Use friendId instead of id for friend's data
            const targetFriendId = friendId || id;
            if (!targetFriendId) return;

            try {
                setLoading(true);

                try {
                    // First check if this user is actually a friend
                    const friendsResponse = await apiService.get<User[]>('/friends');

                    // Find the friend with the matching ID
                    const targetFriend = Array.isArray(friendsResponse) ?
                        friendsResponse.find((friend) => friend.userId.toString() === targetFriendId.toString()) :
                        undefined;

                    // If not found, throw an error
                    if (!targetFriend) {
                        throw new Error("User is not in your friends list");
                    }

                    setFriend(targetFriend);
                } catch (apiError) {
                    console.error("API error:", apiError);
                    setError("Failed to load friend's watchlist data");
                    if (apiError instanceof Error) {
                        showMessage(`Error: ${apiError.message}`);
                    }
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
    }, [id, friendId, apiService]);

    // filter movies based on search - now only searching by title
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setFilteredMovies([]); // Clear filtered movies when search is empty
            return;
        }

        setIsSearching(true);
        const movies = friend?.watchlist || [];
        const query = searchQuery.toLowerCase().trim();

        const filtered = movies.filter((movie) =>
            movie.title.toLowerCase().includes(query)
        );

        setFilteredMovies(filtered);
    }, [searchQuery, friend?.watchlist]);

    const handleMovieClick = (movie: Movie) => {
        // open the details modal
        setSelectedMovie(movie);
        setIsModalOpen(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery("");
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

                {/* search bar component - simplified version */}
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onClearSearch={clearSearch}
                    placeholder="Search for movie titles..."
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
                        movies matching &#34;{searchQuery}&#34; in title
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