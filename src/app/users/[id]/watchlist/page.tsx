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





const WatchList: React.FC = () => {
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
                        watchlist: mockMovies,
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
                const updatedMovies = user.watchlist.filter(
                    movie => !selectedMoviesToRemove.includes(movie.id)
                );
                setUser({
                    ...user,
                    watchlist: updatedMovies
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

    const displayMovies = user?.watchlist && user.watchlist.length > 0
        ? user.watchlist
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
            <Navigation userId={userId} activeItem="Watch List" />

            {/* Main content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="mb-8">
                    <h1 className="font-semibold text-[#3b3e88] text-3xl">
                        Your Watchlist
                    </h1>

                </div>

                <div className="bg-white rounded-[30px] shadow-lg relative p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">

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
                    onClick={() => router.push(`/users/${id}/dashboard`)}
                >
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default WatchList;