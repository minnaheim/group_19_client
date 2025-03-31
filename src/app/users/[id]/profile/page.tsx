"use client";
import React from "react";
import Image from "next/image"
import { useState, useEffect } from "react";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {ApplicationError} from "@/types/error";
import {Movie} from "@/types/movie";
import {useApi} from "@/hooks/useApi";

// Modified NavItem component with click functionality
interface NavItemProps {
    icon: string;
    text: string;
    active: boolean;
}



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

    const NavItem: React.FC<NavItemProps> = ({icon, text, active}) => {
        const router = useRouter();

        const handleClick = () => {
            // Convert text to URL format and navigate
            let path;

            // Map navigation text to appropriate paths
            switch (text) {
                case "Dashboard":
                    path = `/users/${userId}/dashboard`;
                    break;
                case "Profile Page":
                    path = `/users/${userId}/profile`;
                    break;
                case "Watch List":
                    path = `/users/${userId}/watchlist`;
                    break;
                case "Movie Groups":
                    path = `/users/${userId}/movieGroups`;
                    break;
                case "Search Movies":
                    path = `/users/${userId}/search`;
                    break;
                case "Your Friends":
                    path = `/users/${userId}/friends`;
                    break;
                default:
                    path = "/";
            }

            router.push(path);
        };

        return (
            <div
                className="flex items-center gap-2.5 relative cursor-pointer"
                onClick={handleClick}
            >
                <img className="w-5 h-5" alt={text} src={icon} />
                <div
                    className={`font-normal text-[15px] tracking-wide ${
                        active ? "text-[#1657ff]" : "text-[#b9c0de]"
                    }`}
                >
                    {text}
                </div>
                {active && (
                    <div className="absolute right-0 w-1 h-6 bg-[#1657ff] rounded-full shadow-[-2px_0px_10px_2px_#0038ff26]" />
                )}
            </div>
        );
    };
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

                router.push("/users/dashboard");
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


                router.push("/users/dashboard");
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
        return (<div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
            </div>
        )
    }

    if (error) {
        return (<div className="text-red-500 text-center py-8">
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
        }
    ];









    return (
        <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
            {/* Sidebar */}
            <div className="w-full md:w-72 bg-[#ffffffcc] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)_brightness(100%)]">
                <div className="p-6">

                    <div className="flex items-center mb-12">
                        <div className="absolute top-4 left-4 flex items-center space-x-2">
                            <Image src="/projector.png" alt="App Icon" width={50} height={50}/>
                            <div className="ml-4 font-semibold text-[#3b3e88] text-xl">
                                Movie Night
                            </div>
                        </div>
                    </div>

                    {/* Navigation menu */}
                    <nav className="flex flex-col space-y-8">
                        <NavItem icon="/secondary-all-games.svg" text="Dashboard" active={false}/>
                        <NavItem
                            icon="/group-32.png"
                            text="Profile Page"
                            active={true}
                        />
                        <NavItem
                            icon="/group-50-1.png"
                            text="Watch List"
                            active={false}
                        />
                        <NavItem
                            icon="/group-47-1.png"
                            text="Movie Groups"
                            active={false}
                        />
                        <NavItem
                            icon="/group-47-1.png"
                            text="Search Movies"
                            active={false}
                        />
                        <NavItem
                            icon="/group-50-1.png"
                            text="Your Friends"
                            active={false}
                        />
                    </nav>
                </div>
            </div>

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

                            <div>
                                <p className="font-semibold text-[#3b3e88] text-base">
                                    preferences: {user?.preferences ? user.preferences : "these are my preferences"}
                                </p>
                            </div>

                            <button className="bg-[#ff9a3e] text-white font-medium px-6 py-3 rounded-full" onClick={handleEditProfile}>
                                edit
                            </button>
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


                        <button className="bg-[#ff9a3e] text-white font-medium px-6 py-3 rounded-full"
                                onClick={handleEditWatched}>
                            edit
                        </button>
                    </div>
                </div>

                <button className="mt-8 bg-[#f44771] opacity-50 text-white font-medium px-6 py-2 rounded-full"
                        onClick={handleBack}>
                    back
                </button>
            </div>
        </div>
    );
};

export default Profile;