"use client";
import React from "react";
import { useState, useEffect } from "react";
import Navigation from "../../../../components/ui/navigation";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {ApplicationError} from "@/types/error";
import {Movie} from "@/types/movie";
import {useApi} from "@/hooks/useApi";
import {Button} from "../../../../components/ui/button";

const Profile: React.FC = () => {
    const { id } = useParams();
    const apiService = useApi();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    console.log(id);

    const {
        value: token,
    } = useLocalStorage<string>("token", "");

    const {
        value: userId,
    } = useLocalStorage<string>("userId", "");

    const handleEditProfile = () => {
        if (userId.valueOf() == id) {
            router.push(`/users/${id}/edit_profile`);
        } else {
            router.push(`/users/${id}/profile`);
            alert("You can only edit your own profile");
        }
    }

    const handleEditWatched = () => {
        if (userId.valueOf() == id) {
            router.push(`/users/${id}/seen_list`);
        } else {
            router.push(`/users/${id}/profile`);
            alert("You can only edit your own profile");
        }
    }

    const handleBack = () => {
        router.push("/users/dashboard");
    }

    const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedUser: User = await apiService.get(`/profile/${id}`);
            setUser(fetchedUser);
        } catch (error: unknown) {
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                alert(`Error: ${applicationError.message}`);

                // TODO: uncomment once api works, this is only so that the empty profile page can be displayed
                // router.push("/users/dashboard");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchWatchedMovies = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedWatchedMovies: Movie[] = await apiService.get(`/watched/${id}`);
            setUser(prevUser => prevUser ? {...prevUser, watchedMovies: fetchedWatchedMovies} : null);
        } catch (error: unknown) {
            if (error instanceof Error && "status" in error) {
                const applicationError = error as ApplicationError;
                alert(`Error: ${applicationError.message}`);

                // TODO: uncomment once api works, this is only so that the empty profile page can be displayed
                // router.push("/users/dashboard");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchWatchedMovies();
    }, [id, apiService, token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-red-500 text-center py-8">
                {error}
            </div>
        )
    }

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
                                    bio: {user?.bio ? user.bio : "Hi! I love the app Movie Night."}
                                </p>
                            </div>

                            <Button
                                variant="default"
                                className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                                onClick={handleEditProfile}
                            >
                                edit
                            </Button>
                        </div>
                    </div>

                    {/* Watched Movies Card */}
                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <h2 className="font-semibold text-[#3b3e88] text-2xl mb-8">
                            already seen
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            {user?.watchedMovies && user.watchedMovies.length > 0 ? (
                                user.watchedMovies.map((movie) => (
                                    <img
                                        key={movie.id}
                                        className="w-full aspect-[2/3] object-cover rounded"
                                        alt={movie.title}
                                        src={`https://image.tmdb.org/t/p/w500${movie.posterUrl}`}
                                    />
                                ))
                            ) : (
                                mockMovies.map((movie) => (
                                    <img
                                        key={movie.id}
                                        className="w-full aspect-[2/3] object-cover rounded"
                                        alt={movie.title}
                                        src={`https://image.tmdb.org/t/p/w500${movie.posterUrl}`}
                                    />
                                ))
                            )}
                        </div>

                        <Button
                            variant="default"
                            className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                            onClick={handleEditWatched}
                        >
                            edit
                        </Button>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    className="mt-8 bg-[#f44771] opacity-50 hover:bg-[#f44771]/60 hover:opacity-80"
                    onClick={handleBack}
                >
                    back
                </Button>
            </div>
        </div>
    );
};

export default Profile;