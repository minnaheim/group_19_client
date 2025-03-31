"use client";
import React, { useState, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";
import { User } from "@/types/user";
import { Movie } from "@/types/movie";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button } from "../../../../components/ui/button";
import Navigation from "../../../../components/ui/navigation";
import {ApplicationError} from "@/types/error";





const SeenList: React.FC = () => {
    const { id } = useParams();
    const apiService = useApi();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedMoviesToRemove, setSelectedMoviesToRemove] = useState<number[]>([]);

    const { value: token } = useLocalStorage<string>("token", "");
    const { value: userId } = useLocalStorage<string>("userId", "");

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                // TODO: Replace with actual API call to get user data
                // const userData = await apiService.getUser(id as string);
                // setUser(userData);

                // Mock data for now
                setTimeout(() => {
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
            // TODO: Implement API call to update user's watched movies
            // await apiService.updateWatchedMovies(userId, selectedMoviesToRemove);

            // For now, just update local state
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
            setError("Failed to load user data");
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                alert(`Error: ${applicationError.message}`);
            }
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
        }
    ];

    const displayMovies = user?.watchedMovies && user.watchedMovies.length > 0
        ? user.watchedMovies
        : mockMovies;

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

                <div className="bg-white rounded-[30px] shadow-lg relative p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">
                    {/* Removed the hardcoded scrollbar */}
                    {/* <div className="absolute w-[15px] h-[344px] top-[97px] right-[25px] bg-[#ccd0ff] rounded-[10px]"/> */}

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

                        {/* Add Movie Button - always shown at the end */}
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
                                    Save Changes ({selectedMoviesToRemove.length})
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
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push(`/users/${id}/profile`)}
                    >
                        Back to Profile
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SeenList;