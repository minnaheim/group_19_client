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
import MovieCard from "@/components/ui/Movie_card";
import MovieDetailsModal from "@/components/ui/movie_details";

const Profile: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User preferences state
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [userFavoriteMovie, setUserFavoriteMovie] = useState<Movie | null>(null);

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

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // Delay to allow animation
  };

  const handleBack = () => {
    router.push("/users/dashboard");
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
      const fetchedUser: User = await retry(() => apiService.get(`/users/${id}/profile`));
      setUser(fetchedUser);
      showMessage('User profile loaded');
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 404) {
        showMessage("Oops! We couldn't find the profile you were looking for.");
      } else {
        setError('An error occurred fetching the profile. Please try again later.');
      }
      setLoading(false);
      return;
    }
    // Fetch preferences
    try {
      const prefs = await retry(() => apiService.get(`/users/${id}/preferences`)) as { favoriteGenres: string[]; favoriteMovie: Movie | null };
      setUserGenres(Array.isArray(prefs.favoriteGenres) ? prefs.favoriteGenres : []);
      setUserFavoriteMovie(prefs.favoriteMovie || null);
      showMessage('User preferences loaded');
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 401) {
        showMessage('Your session seems to have expired. Could not load preferences.');
      } else if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 404) {
        showMessage('Could not find preferences for this user.');
      } else {
        setError('An error occurred fetching preferences. Please try again later.');
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
      <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
        <Navigation userId={userId} activeItem="Profile Page" />
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
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
                    username: {user?.username}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#3b3e88] text-base">
                    e-mail: {user?.email}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#3b3e88] text-base">
                    password: {user?.password}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#3b3e88] text-base">
                    bio: {user?.bio ? user.bio : "click \"edit profile\" to add your bio!"}
                  </p>
                </div>

                {/* Added Favorite Genre */}
                {user?.favoriteGenres && user.favoriteGenres.length > 0 && (
                    <div className="font-semibold text-[#3b3e88] text-base">
                      <p>
                        <span className="font-semibold text-[#3b3e88] text-base">
                          favorite genre:</span> {user.favoriteGenres[0]}
                      </p>
                    </div>
                )}


                <div className="mt-6">
                  <p className="font-semibold text-[#3b3e88] text-base mb-2">
                    Preferred Genres:
                  </p>
                  <p className="text-[#3b3e88] text-base mb-4">
                    {userGenres.length > 0 ? userGenres.join(", ") : "No genres selected."}
                  </p>
                  <p className="font-semibold text-[#3b3e88] text-base mb-2">
                    Favorite Movie:
                  </p>
                  {userFavoriteMovie ? (
                    <div className="flex justify-center">
                      <MovieCard
                        movie={userFavoriteMovie}
                        isInWatchlist={false}
                        isInSeenList={false}
                        isFavorite={true}
                        onClick={handleMovieClick}
                      />
                    </div>
                  ) : (
                    <p className="text-[#3b3e88] text-base">No favorite movie selected.</p>
                  )}
                  {/* Movie Details Modal */}
                  {selectedMovie && (
                    <MovieDetailsModal
                      movie={selectedMovie}
                      isOpen={isModalOpen}
                      onClose={closeModal}
                      isInWatchlist={user?.watchlist?.some(m => m.movieId === selectedMovie.movieId) || false}
                      isInSeenList={user?.watchedMovies?.some(m => m.movieId === selectedMovie.movieId) || false}
                    />
                  )}
                </div>

                <Button
                    variant="default"
                    className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                    onClick={handleEditProfile}
                >
                  edit profile
                </Button>
              </div>
            </div>

            {/* Watched Movies Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="font-semibold text-[#3b3e88] text-2xl mb-4">
                Already Seen
              </h2>

              <div className="mb-8 max-h-[400px] overflow-y-auto">
                {/* Movie Grid using custom component approach */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {user?.watchedMovies?.map((movie) => (
                      <img
                          key={movie.movieId}
                          className="w-full aspect-[2/3] object-cover rounded"
                          alt={movie.title}
                          src={movie.posterURL}
                      />
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                    variant="default"
                    className="bg-[#ff9a3e] hover:bg-[#ff9a3e]/90"
                    onClick={handleEditWatched}
                >
                  edit seen movies
                </Button>
              </div>
            </div>
          </div>

          <Button
              variant="destructive"
              className="mt-8 bg-[#f44771] opacity-50 hover:bg-[#f44771]/60 hover:opacity-80"
              onClick={handleBack}
          >
            back to dashboard
          </Button>

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