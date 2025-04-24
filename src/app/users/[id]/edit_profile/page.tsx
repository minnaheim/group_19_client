"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { retry } from "@/utils/retry";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { ApplicationError } from "@/app/types/error";
import { useApi } from "@/app/hooks/useApi";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Movie } from "@/app/types/movie";
import MovieCard from "@/components/ui/Movie_card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ActionMessage from "@/components/ui/action_message";

// Static genre list - same as in GenrePreferences component
const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

const EditProfile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // state for editable fields
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [favoriteMovie, setFavoriteMovie] = useState<Movie | null>(null);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [isSelectingGenre, setIsSelectingGenre] = useState<boolean>(false);

  // Track if we've already processed movie from session storage
  const [hasProcessedStoredMovie, setHasProcessedStoredMovie] = useState(false);

  // authentication
  const {
    value: token,
  } = useLocalStorage<string>("token", "");

  const {
    value: userId,
  } = useLocalStorage<string>("userId", "");

  const handleSelectFavoriteMovie = () => {
    // Store the current state in localStorage or session before navigating
    sessionStorage.setItem('editProfileState', JSON.stringify({
      username,
      email,
      password,
      bio,
      favoriteGenres,
      isSelectingFavoriteMovie: true
    }));

    // Use the correct route name
    router.push(`/users/${id}/movie_search?selectFavorite=true`);
  };

  const handleToggleGenreSelection = () => {
    setIsSelectingGenre(!isSelectingGenre);
  };

  const handleSelectGenre = (genreName: string) => {
    setFavoriteGenres(prev =>
      prev.includes(genreName)
        ? prev.filter(g => g !== genreName)
        : [...prev, genreName]
    );
  };

  const handleCancel = () => {
    router.push(`/users/${id}/profile`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate if the user is authorised to edit this profile
    if (userId && userId.valueOf() !== id) {
      setSubmitError("You can only edit your own profile");
      router.push(`/users/${id}/profile`);
      return;
    }

    // check if user is null before updating
    if (!user) {
      setSubmitError("User data not available");
      return;
    }

    console.log("Submitting with favorite movie:", favoriteMovie);

    // create updated user object
    const updatedUser: User = {
      ...user,
      username: username,
      email: email,
      password: password,
      bio: bio,
      // Use the current favorite movie from state
      favoriteMovie: favoriteMovie || user.favoriteMovie,
      favoriteGenres: favoriteGenres.length > 0 ? favoriteGenres : user.favoriteGenres
    };

    try {
      await apiService.put(`/users/${id}/profile`, updatedUser);

      // If genre changed, also update genre preferences
      if (favoriteGenres.length > 0 && (!user.favoriteGenres || JSON.stringify(user.favoriteGenres) !== JSON.stringify(favoriteGenres))) {
        try {
          await apiService.post(`/users/${id}/preferences/genres`, {
            genreIds: favoriteGenres
          });
        } catch (genreError: unknown) {
          if (genreError instanceof Error && 'status' in genreError) {
            const appErr = genreError as ApplicationError;
            switch (appErr.status) {
              case 400:
                setSubmitError("An invalid genre was selected. Please check your choices.");
                break;
              case 401:
                setSubmitError("Your session has expired. Please log in again to save preferences.");
                break;
              case 403:
                setSubmitError("You don't have permission to change these preferences.");
                break;
              case 404:
                setSubmitError("We couldn't find your user account to save preferences.");
                break;
              default:
                setSubmitError("An unexpected error occurred while saving your preferences.");
            }
          } else {
            setSubmitError("An unexpected error occurred while saving your preferences.");
          }
        }
      }

      setSuccessMessage("Profile updated successfully!");
      setShowSuccessMessage(true);
      router.push(`/users/${id}/profile`);
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error) {
        const appErr = error as ApplicationError;
        switch (appErr.status) {
          case 401:
            setSubmitError("Your session has expired. Please log in again to update your profile.");
            break;
          case 403:
            setSubmitError("You don't have permission to update this profile.");
            break;
          case 404:
            setSubmitError("We couldn't find the user profile to update.");
            break;
          case 409:
            setSubmitError("That username or email is already in use. Please choose another.");
            break;
          default:
            setSubmitError("An unexpected error occurred while updating your profile.");
        }
      } else {
        setSubmitError("An unexpected error occurred while updating your profile.");
      }
    }
  };

  // First useEffect to check for selected favorite movie in session storage
  useEffect(() => {
    if (!hasProcessedStoredMovie) {
      const favoriteMovieData = sessionStorage.getItem('selectedFavoriteMovie');
      if (favoriteMovieData) {
        try {
          const selectedMovie = JSON.parse(favoriteMovieData);
          console.log(`Selected movie from session storage: ${selectedMovie.title || selectedMovie.movieId}`);
          setFavoriteMovie(selectedMovie);
          sessionStorage.removeItem('selectedFavoriteMovie');
        } catch (e) {
          console.error('Error parsing favorite movie data', e);
        }
      }

      // Restore other form state if needed
      const storedState = sessionStorage.getItem('editProfileState');
      if (storedState) {
        try {
          const state = JSON.parse(storedState);
          if (state.username) setUsername(state.username);
          if (state.email) setEmail(state.email);
          if (state.password) setPassword(state.password);
          if (state.bio) setBio(state.bio);
          if (state.favoriteGenres) setFavoriteGenres(state.favoriteGenres);
          sessionStorage.removeItem('editProfileState');
        } catch (e) {
          console.error('Error parsing stored state', e);
        }
      }

      // Mark as processed regardless of outcome
      setHasProcessedStoredMovie(true);
    }
  }, [hasProcessedStoredMovie]);

  // Second useEffect to fetch user data
  useEffect(() => {
    // Only proceed if we've already processed any stored movie data
    if (hasProcessedStoredMovie) {
      setLoading(true);
      setError(null);

      const fetchUserData = async () => {
        try {
          const fetchedUser = await retry(() => apiService.get(`/users/${id}/profile`)) as User;
          setUser(fetchedUser);

          // Initialize form fields if not already set from session storage
          setUsername(prev => prev || fetchedUser.username || "");
          setEmail(prev => prev || fetchedUser.email || "");
          setPassword(prev => prev || fetchedUser.password || "");
          setBio(prev => prev || fetchedUser.bio || "");

          // For favorite movie, only set from API if we don't have one from session storage
          if (!favoriteMovie) {
            setFavoriteMovie(fetchedUser.favoriteMovie || null);
          }

          // Set favorite genres if not already set
          if ((!favoriteGenres || favoriteGenres.length === 0) && fetchedUser.favoriteGenres && fetchedUser.favoriteGenres.length > 0) {
            setFavoriteGenres(fetchedUser.favoriteGenres);
          }
        } catch (error: unknown) {
          if (error instanceof Error && 'status' in error) {
            const appErr = error as ApplicationError;
            if (appErr.status === 404) {
              setError("Oops! We couldn't find the user profile you were looking for.");
            } else {
              setError(`Failed to load user data: ${appErr.message}`);
            }
          } else {
            setError("Failed to load user data");
          }
          console.error("Error loading user:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [id, apiService, token, userId, hasProcessedStoredMovie, favoriteMovie, favoriteGenres]); // Include hasProcessedStoredMovie and favoriteGenres as dependencies

  // Loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
      </div>
    );
  }
  if (error) {
    return <ErrorMessage message={error} onClose={() => setError(null)} />;
  }

  if (loading && !hasProcessedStoredMovie) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
          </div>
        </div>
    );
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

            {/* Submission errors */}
            <ErrorMessage message={submitError} onClose={() => setSubmitError("")} />
            {/* Success message */}
            <ActionMessage
              message={successMessage}
              isVisible={showSuccessMessage}
              onHide={() => setShowSuccessMessage(false)}
              className="bg-green-500"
            />
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

              {/* Favorite Genre Selection */}
              <div>
                <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                  Favorite Genres
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    {favoriteGenres.length > 0 ? favoriteGenres.join(", ") : "No favorite genres selected"}
                  </span>
                  </div>
                  <Button
                      type="button"
                      variant="outline"
                      className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5]"
                      onClick={handleToggleGenreSelection}
                  >
                    {favoriteGenres.length > 0 ? "Change" : "Select"} Favorite Genres
                  </Button>
                </div>

                {/* Genre Selection Panel */}
                {isSelectingGenre && (
                    <div className="mt-4 p-4 bg-[#f7f9ff] rounded-lg border border-[#b9c0de]">
                      <h4 className="text-[#3b3e88] font-medium mb-4">Select your favorite genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {GENRES.map((genre) => (
                            <button
                                key={genre.id}
                                type="button"
                                onClick={() => handleSelectGenre(genre.name)}
                                className={`px-4 py-2 rounded-full border ${
                                    favoriteGenres.includes(genre.name)
                                        ? "bg-[#AFB3FF] text-white"
                                        : "bg-[#CDD1FF] text-white hover:bg-[#AFB3FF]"
                                }`}
                            >
                              {genre.name}
                            </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{favoriteGenres.length} selected</p>
                    </div>
                )}
              </div>

              {/* Favorite Movie Section */}
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
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">No favorite movie selected</span>
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