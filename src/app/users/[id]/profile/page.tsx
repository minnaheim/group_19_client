"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { ApplicationError } from "@/app/types/error";
import { retry } from "@/utils/retry";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import MovieDetailsModal from "@/components/ui/movie_details";

const Profile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User favorites state
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [userFavoriteMovie, setUserFavoriteMovie] = useState<Movie | null>(
    null,
  );
  const [userActors, setUserActors] = useState<string[]>([]);
  const [userDirectors, setUserDirectors] = useState<string[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const handleEditProfile = () => {
    if (userId.valueOf() == id) {
      router.push(`/users/${id}/edit_profile`);
    } else {
      showMessage("You can only edit your own profile");
    }
  };

  const handleEditWatched = () => {
    if (userId.valueOf() == id) {
      router.push(`/users/${id}/seen_list`);
    } else {
      showMessage("You can only edit your own profile");
    }
  };



  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // Delay to allow animation
  };

  const handleBack = () => {
    router.push(`/users/${id}/dashboard`);
  };

  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    // Fetch profile
    try {
      const fetchedUser: User = await retry(() =>
        apiService.get(`/users/${id}/profile`)
      );
      setUser(fetchedUser);
      showMessage("User profile loaded");
    } catch (err: unknown) {
      if (
        err instanceof Error && "status" in err &&
        (err as ApplicationError).status === 404
      ) {
        showMessage("Oops! We couldn't find the profile you were looking for.");
      } else {
        setError(
          "An error occurred fetching the profile. Please try again later.",
        );
      }
      setLoading(false);
      return;
    }
    // Fetch favorites
    try {
      const prefs = await retry(() =>
        apiService.get(`/users/${id}/favorites`)
      ) as {
        favoriteGenres: string[];
        favoriteMovie: Movie | null;
        favoriteActors: string[];
        favoriteDirectors: string[];
      };
      setUserGenres(
        Array.isArray(prefs.favoriteGenres) ? prefs.favoriteGenres : [],
      );
      setUserFavoriteMovie(prefs.favoriteMovie || null);
      setUserActors(
        Array.isArray(prefs.favoriteActors) ? prefs.favoriteActors : [],
      );
      setUserDirectors(
        Array.isArray(prefs.favoriteDirectors) ? prefs.favoriteDirectors : [],
      );
      showMessage("User favorites loaded");
    } catch (err: unknown) {
      if (
        err instanceof Error && "status" in err &&
        (err as ApplicationError).status === 401
      ) {
        showMessage(
          "Your session seems to have expired. Could not load favorites.",
        );
      } else if (
        err instanceof Error && "status" in err &&
        (err as ApplicationError).status === 404
      ) {
        showMessage("Could not find favorites for this user.");
      } else {
        setError(
          "An error occurred fetching favorites. Please try again later.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUser();
    };

    loadData();
  }, [id, apiService, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
      </div>
    );
  }

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        <Navigation userId={userId} activeItem="Profile Page" />

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto relative">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          {/* Page Header */}
          <div className="mb-4">
            <h1 className="font-semibold text-[#3b3e88] text-2xl">
              Profile Page
            </h1>
            <p className="text-[#b9c0de] mt-1">
              Manage your profile and movie preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 shadow-md text-white">
            <div className="flex flex-col gap-4">
              {/* Profile Header */}
              <div className="border-b border-white/20 pb-3">
                <h2 className="text-xl font-bold mb-1">
                  Your Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90 text-sm">
                  <p className="truncate">
                    <span className="font-medium">Username:</span> {user?.username}
                  </p>
                  <p className="truncate">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="truncate">
                    <span className="font-medium">Password:</span> ••••••••
                  </p>
                  <p className="flex flex-wrap">
                    <span className="font-medium mr-1">Bio:</span>
                    <span className="max-h-12 overflow-y-auto break-words">
    {user?.bio ? user.bio : 'Click "edit profile" to add your bio!'}
  </span>
                  </p>
                </div>
              </div>

              {/* Favorites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Favorite Movie */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                    <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                    Favorite Movie
                  </h3>
                  {userFavoriteMovie ? (
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-20 bg-white/20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          <img
                              src={userFavoriteMovie.posterURL}
                              alt={userFavoriteMovie.title}
                              className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">
                            {userFavoriteMovie.title}
                          </p>
                        </div>
                      </div>
                  ) : (
                      <p className="text-white/80 text-xs">No favorite movie selected</p>
                  )}
                </div>

                {/* Favorite Genres */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Favorite Genres
                  </h3>
                  {userGenres.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {userGenres.map((genre, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-blue-500 px-2 py-1 rounded-full font-medium shadow-sm"
                            >
                      {genre}
                    </span>
                        ))}
                      </div>
                  ) : (
                      <p className="text-white/80 text-xs">No genres selected</p>
                  )}
                </div>

                {/* Favorite Actors */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Favorite Actors
                  </h3>
                  {userActors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {userActors.map((actor, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-rose-500 px-2 py-1 rounded-full font-medium shadow-sm"
                            >
                      {actor}
                    </span>
                        ))}
                      </div>
                  ) : (
                      <p className="text-white/80 text-xs">No favorite actors selected</p>
                  )}
                </div>

                {/* Favorite Directors */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Favorite Directors
                  </h3>
                  {userDirectors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {userDirectors.map((director, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-emerald-500 px-2 py-1 rounded-full font-medium shadow-sm"
                            >
                      {director}
                    </span>
                        ))}
                      </div>
                  ) : (
                      <p className="text-white/80 text-xs">No favorite directors selected</p>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/20">
                <div className="text-center">
                  <p className="text-xl font-bold">
                    {user?.watchlist?.length || 0}
                  </p>
                  <p className="text-xs text-white/80">Movies in Watchlist</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">
                    {user?.watchedMovies?.length || 0}
                  </p>
                  <p className="text-xs text-white/80">Movies Watched</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">
                    {userGenres?.length || 0}
                  </p>
                  <p className="text-xs text-white/80">Favorite Genres</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">
                    {(userActors?.length || 0) + (userDirectors?.length || 0)}
                  </p>
                  <p className="text-xs text-white/80">Favorite People</p>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Button
                  variant="default"
                  className="bg-white text-indigo-600 hover:bg-white/90 text-sm py-2 h-9"
                  onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Watched Movies Card */}
          <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <h2 className="text-xl font-bold mb-1">
              <span
                style={{
                  background: "linear-gradient(to right, #6366f1, #9333ea)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "inline-block"
                }}
              >
                Already Seen
              </span>
            </h2>

            {user?.watchedMovies?.length && user?.watchedMovies?.length > 0 ? (
                <div className="mb-4 max-h-[240px] overflow-y-auto">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {user.watchedMovies.map((movie) => (
                        <div key={movie.movieId} className="aspect-[2/3] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <img
                              className="w-full h-full object-cover"
                              alt={movie.title}
                              src={movie.posterURL}
                          />
                        </div>
                    ))}
                  </div>
                </div>
            ) : (
                <p className="text-[#b9c0de] text-sm mb-4">
                  You haven&#39;t marked any movies as watched yet.
                </p>
            )}

            <Button
                variant="default"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 shadow-md text-white hover:bg-[#3b3e88]/90 text-white text-sm py-2 h-9 w-full"
                onClick={handleEditWatched}
            >
              Edit Seen Movies
            </Button>
          </div>

          {/* Back Button */}
          <Button
              variant="outline"
              className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 text-sm py-2 h-9 rounded-xl"
              onClick={handleBack}
          >
            Back to Dashboard
          </Button>

          {/* Modal for movie details */}
          {selectedMovie && (
              <MovieDetailsModal
                  movie={selectedMovie}
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  isInWatchlist={user?.watchlist?.some((m) =>
                      m.movieId === selectedMovie.movieId
                  ) || false}
                  isInSeenList={user?.watchedMovies?.some((m) =>
                      m.movieId === selectedMovie.movieId
                  ) || false}
              />
          )}

          {/* Action Message Component */}
          <ActionMessage
              message={actionMessage}
              isVisible={showActionMessage}
              onHide={() => setShowActionMessage(false)}
              className="bg-green-500"
          />
        </div>
      </div>
  );
};

export default Profile;
