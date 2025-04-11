"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { ApplicationError } from "@/app/types/error";
import { useApi } from "@/app/hooks/useApi";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Movie } from "@/app/types/movie";
import MovieCard from "@/components/ui/Movie_card";

const EditProfile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // state for editable fields
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [favoriteMovie, setFavoriteMovie] = useState<Movie | null>(null);

  // authentication
  const {
    value: token,
  } = useLocalStorage<string>("token", "");

  const { value: userId } = useLocalStorage<string>("userId", "");

  // mock movie for testing
  const mockMovie: Movie = {
    movieId: 1,
    title: "Sample Movie",
    posterURL: "/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
    description:
        "A thrilling adventure about a group of friends who embark on a journey.",
    genres: ["Adventure", "Action"],
    directors: ["John Doe"],
    actors: ["Actor 1", "Actor 2", "Actor 3"],
    trailerURL: "https://www.example.com/trailer",
    year: 2023,
    originallanguage: "English",
  };

  // mock user for testing
  const mockUser: User = {
    userId: Number(id),
    username: "Ella",
    email: "ella@philippi.com",
    password: "password1234",
    bio: "Hi! I love the app Movie Night.",
    favoriteGenres: ["Sci-Fi", "Drama", "Thriller"],
    favoriteMovie: mockMovie,
    watchlist: [],
    watchedMovies: [],
  };

  const handleSelectFavoriteMovie = () => {
    // Store the current state in localStorage or session before navigating
    sessionStorage.setItem('editProfileState', JSON.stringify({
      username,
      email,
      password,
      bio,
      isSelectingFavoriteMovie: true
    }));

    // Use the correct route name
    router.push(`/users/${id}/movie_search?selectFavorite=true`);
  };

  const handleCancel = () => {
    router.push(`/users/${id}/profile`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate if the user is authorised to edit this profile
    if (userId && userId.valueOf() !== id) {
      alert("You can only edit your own profile");
      router.push(`/users/${id}/profile`);
      return;
    }

    // check if user is null before updating
    if (!user) {
      alert("User data not available");
      return;
    }

    // create updated user object
    const updatedUser: User = {
      ...user,
      username,
      email,
      password,
      bio,
      favoriteMovie: favoriteMovie || user.favoriteMovie || mockMovie
    };

    try {
      try {
        await apiService.put(`/users/${id}/profile`, updatedUser);
      } catch (apiError) {
        console.log("Mock update - no API available:", apiError);
        // for testing to simulate successful update
        setUser(updatedUser);
      }
      alert("Profile updated successfully!");
      router.push(`/users/${id}/profile`);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error) {
        const applicationError = error as ApplicationError;
        alert(`Error: ${applicationError.message}`);
      } else {
        alert("An unexpected error occurred while updating the profile");
      }
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // try to fetch from API
      let fetchedUser: User;
      try {
        fetchedUser = await apiService.get(`/users/${id}/profile`);
      } catch (apiError) {
        console.log("Using mock user data instead of API:", apiError);
        // use mock data if API fails
        fetchedUser = mockUser;
      }

      setUser(fetchedUser);

      // init state with user data
      setUsername(fetchedUser.username || "");
      setEmail(fetchedUser.email || "");
      setPassword(fetchedUser.password || "");
      setBio(fetchedUser.bio || "");
      setFavoriteMovie(fetchedUser.favoriteMovie !== undefined ? fetchedUser.favoriteMovie : null);
    } catch (error: unknown) {
      // back to mock data on any error
      console.log("Using mock user data due to error:", error);
      setUser(mockUser);
      setUsername(mockUser.username);
      setEmail(mockUser.email);
      setPassword(mockUser.password);
      setBio(mockUser.bio);
      setFavoriteMovie(mockUser.favoriteMovie !== undefined ? mockUser.favoriteMovie : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // check if we're returning from search with a favorite movie
    const favoriteMovieData = sessionStorage.getItem('selectedFavoriteMovie');
    if (favoriteMovieData) {
      try {
        const selectedMovie = JSON.parse(favoriteMovieData);
        setFavoriteMovie(selectedMovie);
        sessionStorage.removeItem('selectedFavoriteMovie');
      } catch (e) {
        console.error('Error parsing favorite movie data', e);
      }
    }

    // restore other form state if needed
    const storedState = sessionStorage.getItem('editProfileState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        if (state.username) setUsername(state.username);
        if (state.email) setEmail(state.email);
        if (state.password) setPassword(state.password);
        if (state.bio) setBio(state.bio);
        sessionStorage.removeItem('editProfileState');
      } catch (e) {
        console.error('Error parsing stored state', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [id, apiService, token, userId]);

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
        {/* Sidebar */}
        <Navigation userId={userId} activeItem="Profile Page" />

        {/* Main content */}
        <div className="flex-1 p-6 md:p-12">
          <h1 className="font-semibold text-[#3b3e88] text-3xl mb-8">
            edit profile
          </h1>

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="relative">
              <img
                  className="w-full h-48 object-cover"
                  alt="Profile Banner"
                  src="/rectangle-45.svg"
              />
              <h2 className="absolute top-10 left-6 font-bold text-white text-3xl">
                edit your profile
              </h2>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Username
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b3e88]"
                />
              </div>

              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b3e88]"
                />
              </div>

              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b3e88]"
                />
              </div>

              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b3e88]"
                    rows={3}
                />
              </div>

              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Favorite Movie
                </label>
                <div className="flex items-center space-x-4">
                  {favoriteMovie ? (
                      <div className="flex items-center space-x-4">
                        <MovieCard
                            movie={favoriteMovie}
                            isInWatchlist={false}
                            isInSeenList={false}
                            isFavorite={true}
                            onClick={() => {}} // Empty handler since we don't need modal here
                        />
                        <span className="text-sm text-gray-600">{favoriteMovie.title}</span>
                      </div>
                  ) : (
                      <div className="flex items-center space-x-4">
                        <MovieCard
                            movie={mockMovie} // Use mock movie as default
                            isInWatchlist={false}
                            isInSeenList={false}
                            isFavorite={true}
                            onClick={() => {}} // Empty handler since we don't need modal here
                        />
                        <span className="text-sm text-gray-600">{mockMovie.title} (default)</span>
                      </div>
                  )}
                  <Button
                      type="button"
                      variant="outline"
                      className="bg-[#ff9a3e] text-white hover:bg-[#e88b35]"
                      onClick={handleSelectFavoriteMovie}
                  >
                    {favoriteMovie ? "Change" : "Select"} Favorite Movie
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                    type="submit"
                    variant="default"
                    className="bg-[#ff9a3e] hover:bg-[#e88b35]"
                >
                  save changes
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="bg-gray-200 text-[#3b3e88] hover:bg-gray-300"
                    onClick={handleCancel}
                >
                  cancel
                </Button>
              </div>
            </form>
          </div>

          <Button
              variant="destructive"
              className="mt-8 bg-[#f44771] opacity-50 hover:bg-[#e03e65] hover:opacity-60"
              onClick={handleCancel}
          >
            back
          </Button>
        </div>
      </div>
  );
};

export default EditProfile;