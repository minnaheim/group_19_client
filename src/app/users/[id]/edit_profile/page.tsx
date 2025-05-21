"use client";
import React, { useEffect, useMemo, useState } from "react";
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

// Static genre list - same as in GenreFavorites component
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
  { id: 37, name: "Western" },
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
  const [favoriteActors, setFavoriteActors] = useState<string[]>([]);
  const [favoriteDirectors, setFavoriteDirectors] = useState<string[]>([]);
  const [isSelectingActors, setIsSelectingActors] = useState(false);
  const [isSelectingDirectors, setIsSelectingDirectors] = useState(false);

  // state variables for actor search
  const [actorSearchQuery, setActorSearchQuery] = useState("");
  const [actorSearchResults, setActorSearchResults] = useState<
    { actorId: number; actorName: string }[]
  >([]);
  const [actorSearchLoading, setActorSearchLoading] = useState(false);
  const [actorSearchError, setActorSearchError] = useState("");

  // state variables for director search
  const [directorSearchQuery, setDirectorSearchQuery] = useState("");
  const [directorSearchResults, setDirectorSearchResults] = useState<
    { directorId: number; directorName: string }[]
  >([]);
  const [directorSearchLoading, setDirectorSearchLoading] = useState(false);
  const [directorSearchError, setDirectorSearchError] = useState("");

  // Track if we've already processed movie from session storage
  const [hasProcessedStoredMovie, setHasProcessedStoredMovie] = useState(false);

  // authentication
  const { value: token } = useLocalStorage<string>("token", "");

  const { value: userId } = useLocalStorage<string>("userId", "");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);
  const handleSelectFavoriteMovie = () => {
    // Store the current state in localStorage or session before navigating
    sessionStorage.setItem(
      "editProfileState",
      JSON.stringify({
        username,
        email,
        password,
        bio,
        favoriteGenres,
        favoriteActors,
        favoriteDirectors,
        isSelectingFavoriteMovie: true,
      }),
    );

    // Use the correct route name
    router.push(`/users/${id}/movie_search?selectFavorite=true`);
  };

  const handleActorSearch = async () => {
    if (!actorSearchQuery.trim()) return;

    setActorSearchLoading(true);
    setActorSearchError("");

    try {
      const response = await fetch(
        `https://sopra-fs25-group-19-server.oa.r.appspot.com/movies/actors?actorname=${
          encodeURIComponent(
            actorSearchQuery,
          )
        }`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || "Failed to search for actors");
      }

      const data = await response.json();
      setActorSearchResults(data);
    } catch (error) {
      console.log(error);
      setActorSearchError("An error occurred while searching for actors");
      setActorSearchResults([]);
    } finally {
      setActorSearchLoading(false);
    }
  };

  const handleDirectorSearch = async () => {
    if (!directorSearchQuery.trim()) return;

    setDirectorSearchLoading(true);
    setDirectorSearchError("");

    try {
      const response = await fetch(
        `https://sopra-fs25-group-19-server.oa.r.appspot.com/movies/directors?directorname=${
          encodeURIComponent(
            directorSearchQuery,
          )
        }`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || "Failed to search for directors");
      }

      const data = await response.json();
      setDirectorSearchResults(data);
    } catch (error) {
      console.log(error);
      setDirectorSearchError("An error occurred while searching for directors");
      setDirectorSearchResults([]);
    } finally {
      setDirectorSearchLoading(false);
    }
  };

  const handleResetFavoriteActors = () => {
    setFavoriteActors([]);
    // Show a brief confirmation message
    setSuccessMessage("Favorite actors have been reset");
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleResetFavoriteDirectors = () => {
    setFavoriteDirectors([]);
    // Show a brief confirmation message
    setSuccessMessage("Favorite directors have been reset");
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleToggleGenreSelection = () => {
    setIsSelectingGenre(!isSelectingGenre);
  };

  const handleSelectGenre = (genreName: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
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
      favoriteGenres: favoriteGenres.length > 0
        ? favoriteGenres
        : user.favoriteGenres,
      favoriteActors: favoriteActors.length > 0
        ? favoriteActors
        : user.favoriteActors,
      favoriteDirectors: favoriteDirectors.length > 0
        ? favoriteDirectors
        : user.favoriteDirectors,
    };

    try {
      await apiService.put(`/users/${id}/profile`, updatedUser);

      // Update genre favorites
      await apiService.post(`/users/${id}/favorites/genres`, {
        genreIds: favoriteGenres,
      });
      // Update actor favorites (empty array clears all on backend)
      await apiService.post(`/users/${id}/favorites/actors`, {
        favoriteActors,
      });
      // Update director favorites (empty array clears all on backend)
      await apiService.post(`/users/${id}/favorites/directors`, {
        favoriteDirectors,
      });

      setSuccessMessage("Profile updated successfully!");
      setShowSuccessMessage(true);
      router.push(`/users/${id}/profile`);
    } catch (error: unknown) {
      if (error instanceof Error && "status" in error) {
        const appErr = error as ApplicationError;
        switch (appErr.status) {
          case 401:
            setSubmitError(
              "Your session has expired. Please log in again to update your profile.",
            );
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            setTimeout(() => {
              router.push("/login");
            }, 1500);
            break;
          case 403:
            setSubmitError("You don't have permission to update this profile.");
            break;
          case 404:
            setSubmitError("We couldn't find the user profile to update.");
            break;
          case 409:
            setSubmitError(
              "That username or email is already in use. Please choose another.",
            );
            break;
          default:
            setSubmitError(
              "An unexpected error occurred while updating your profile. Redirecting to login page...",
            );
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            setTimeout(() => {
              router.push("/login");
            }, 1500);
        }
      } else {
        setSubmitError(
          "An unexpected error occurred while updating your profile. Redirecting to login page...",
        );
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    }
  };

  // First useEffect to check for selected favorite movie in session storage
  useEffect(() => {
    if (!hasProcessedStoredMovie) {
      const favoriteMovieData = sessionStorage.getItem("selectedFavoriteMovie");
      if (favoriteMovieData) {
        try {
          const selectedMovie = JSON.parse(favoriteMovieData);
          console.log(
            `Selected movie from session storage: ${
              selectedMovie.title || selectedMovie.movieId
            }`,
          );
          setFavoriteMovie(selectedMovie);
          sessionStorage.removeItem("selectedFavoriteMovie");
        } catch (e) {
          console.error("Error parsing favorite movie data", e);
        }
      }

      // Restore other form state if needed
      const storedState = sessionStorage.getItem("editProfileState");
      if (storedState) {
        try {
          const state = JSON.parse(storedState);
          if (state.username) setUsername(state.username);
          if (state.email) setEmail(state.email);
          if (state.password) setPassword(state.password);
          if (state.bio) setBio(state.bio);
          if (state.favoriteGenres) setFavoriteGenres(state.favoriteGenres);
          if (state.favoriteActors) setFavoriteActors(state.favoriteActors);
          if (state.favoriteDirectors) {
            setFavoriteDirectors(state.favoriteDirectors);
          }
          sessionStorage.removeItem("editProfileState");
        } catch (e) {
          console.error("Error parsing stored state", e);
        }
      }

      // Mark as processed regardless of outcome
      setHasProcessedStoredMovie(true);
    }
  }, [hasProcessedStoredMovie]); // Dependency only on hasProcessedStoredMovie

  // Second useEffect to fetch user data
  useEffect(() => {
    // Only proceed if we've already processed any stored movie data
    if (hasProcessedStoredMovie) {
      setLoading(true);
      setError(null);

      const fetchUserData = async () => {
        try {
          const fetchedUser = (await retry(() =>
            apiService.get(`/users/${id}/profile`)
          )) as User;
          setUser(fetchedUser);

          // Initialize form fields if not already set from session storage
          setUsername((prev) => prev || fetchedUser.username || "");
          setEmail((prev) => prev || fetchedUser.email || "");
          setPassword((prev) => prev || fetchedUser.password || "");
          setBio((prev) => prev || fetchedUser.bio || "");

          // For favorite movie, only set from API if we don't have one from session storage
          if (!favoriteMovie) {
            setFavoriteMovie(fetchedUser.favoriteMovie || null);
          }

          // Set favorite genres if not already set from session storage or API fetch
          if (
            (!favoriteGenres || favoriteGenres.length === 0) &&
            fetchedUser.favoriteGenres &&
            fetchedUser.favoriteGenres.length > 0
          ) {
            setFavoriteGenres(fetchedUser.favoriteGenres);
          }

          // Set favorite actors/directors if not already set
          if (favoriteActors.length === 0 && fetchedUser.favoriteActors) {
            setFavoriteActors(
              Array.isArray(fetchedUser.favoriteActors)
                ? fetchedUser.favoriteActors
                : Object.values(fetchedUser.favoriteActors),
            );
          }
          if (favoriteDirectors.length === 0 && fetchedUser.favoriteDirectors) {
            setFavoriteDirectors(
              Array.isArray(fetchedUser.favoriteDirectors)
                ? fetchedUser.favoriteDirectors
                : Object.values(fetchedUser.favoriteDirectors),
            );
          }
        } catch (error: unknown) {
          if (error instanceof Error && "status" in error) {
            const appErr = error as ApplicationError;
            if (appErr.status === 404) {
              setError(
                "Oops! We couldn't find the user profile you were looking for.",
              );
            } else {
              setError(
                "An unexpected error occurred while updating your profile. Redirecting to login page...",
              );
              localStorage.removeItem("userId");
              localStorage.removeItem("token");
              setTimeout(() => {
                router.push("/login");
              }, 1500);
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
    // *** CHANGE 1: Removed favoriteGenres from dependency array ***
  }, [id, apiService, token, userId, hasProcessedStoredMovie, favoriteMovie]);

  // Compute actor and director selectable options
  const actorOptions = useMemo(() => {
    const set = new Set<string>();
    if (favoriteMovie?.actors) favoriteMovie.actors.forEach((a) => set.add(a));
    user?.watchlist.forEach((m) => m.actors.forEach((a) => set.add(a)));
    user?.watchedMovies.forEach((m) => m.actors.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [favoriteMovie, user]);
  const directorOptions = useMemo(() => {
    const set = new Set<string>();
    if (favoriteMovie?.directors) {
      favoriteMovie.directors.forEach((d) => set.add(d));
    }
    user?.watchlist.forEach((m) => m.directors.forEach((d) => set.add(d)));
    user?.watchedMovies.forEach((m) => m.directors.forEach((d) => set.add(d)));
    return Array.from(set);
  }, [favoriteMovie, user]);

  // Loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
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
        {/* <h1 className="font-semibold text-[#3b3e88] text-3xl mb-8">
          edit profile
        </h1> */}

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative">
            <img
              className="w-full h-48 object-cover"
              alt="Profile Banner"
              src="/rectangle-45.svg"
            />
            <h2 className="absolute top-10 left-6 font-bold text-white text-3xl">
              Edit Your Profile
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

            {/* Favorite Genre Selection - *** CHANGE 2: Button Placement *** */}
            <div>
              <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                Favorite Genres
              </label>
              <div className="mb-2">
                {/* Display selected genres */}
                <span className="text-md text-gray-600">
                  {favoriteGenres.length > 0
                    ? (
                      favoriteGenres.join(", ")
                    )
                    : (
                      <span className="text-sm text-gray-600">
                        No favorite genres selected
                      </span>
                    )}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5] hover:text-gray-500 mb-2" // Added mb-2 for spacing
                onClick={handleToggleGenreSelection}
              >
                {favoriteGenres.length > 0 ? "Change" : "Select"}{" "}
                Favorite Genres
              </Button>

              {/* Genre Selection Panel */}
              {isSelectingGenre && (
                <div className="mt-4 p-4 bg-[#f7f9ff] rounded-lg border border-[#b9c0de]">
                  <h4 className="text-[#3b3e88] font-medium mb-4">
                    Select your favorite genres
                  </h4>
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
                  <p className="mt-2 text-sm text-gray-600">
                    {favoriteGenres.length} selected
                  </p>
                </div>
              )}
            </div>

            {/* Favorite Actors */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="block text-[#3b3e88] text-sm font-medium">
                  Favorite Actors
                </p>
                {favoriteActors.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleResetFavoriteActors}
                    className="bg-red-500 text-white hover:bg-red-600 text-xs py-1 px-2 h-auto"
                  >
                    Reset Favorite Actors
                  </Button>
                )}
              </div>
              <p className="text-md text-gray-600 mb-2">
                {/* Added mb-2 */}
                {favoriteActors.length > 0
                  ? (
                    favoriteActors.join(", ")
                  )
                  : (
                    <span className="text-sm text-gray-600">
                      No favorite actors selected.
                    </span>
                  )}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSelectingActors(!isSelectingActors)}
                className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5] hover:text-gray-500 mb-2" // Added mb-2
              >
                {favoriteActors.length > 0 ? "Change" : "Select"}{" "}
                Favorite Actors
              </Button>
              {isSelectingActors && (
                <div className="mt-2 p-4 bg-[#f7f9ff] rounded-lg border border-[#b9c0de]">
                  <p className="text-sm text-gray-600 mb-3">
                    Please select amongst the actors în your favorite movie and
                    in the movies in your Watch List
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...actorOptions]
                      .sort((a, b) => a.localeCompare(b))
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setFavoriteActors((prev) =>
                              prev.includes(name)
                                ? prev.filter((n) => n !== name)
                                : [...prev, name]
                            );
                          }}
                          className={`px-3 py-1 rounded-full border ${
                            favoriteActors.includes(name)
                              ? "bg-[#AFB3FF] text-white"
                              : "bg-[#CDD1FF] text-white hover:bg-[#AFB3FF]"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                  </div>

                  {/* Actor Search */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Search for additional actors:
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={actorSearchQuery}
                        onChange={(e) => setActorSearchQuery(e.target.value)}
                        placeholder="Enter actor name..."
                        className="p-2 border rounded-md flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={handleActorSearch}
                        className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5]"
                      >
                        Search
                      </Button>
                    </div>

                    {actorSearchLoading && (
                      <p className="text-sm text-gray-500">Searching...</p>
                    )}
                    {actorSearchError && (
                      <p className="text-sm text-red-500">{actorSearchError}</p>
                    )}

                    {actorSearchResults.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">
                          Search results:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {actorSearchResults.map((actor) => (
                            <button
                              key={actor.actorId}
                              type="button"
                              onClick={() => {
                                setFavoriteActors((prev) =>
                                  prev.includes(actor.actorName)
                                    ? prev.filter((n) => n !== actor.actorName)
                                    : [...prev, actor.actorName]
                                );
                              }}
                              className={`px-3 py-1 rounded-full border ${
                                favoriteActors.includes(actor.actorName)
                                  ? "bg-[#AFB3FF] text-white"
                                  : "bg-[#CDD1FF] text-white hover:bg-[#AFB3FF]"
                              }`}
                            >
                              {actor.actorName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Directors */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="block text-[#3b3e88] text-sm font-medium">
                  Favorite Directors
                </p>
                {favoriteDirectors.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleResetFavoriteDirectors}
                    className="bg-red-500 text-white hover:bg-red-600 text-xs py-1 px-2 h-auto"
                  >
                    Reset Favorite Directors
                  </Button>
                )}
              </div>
              <p className="text-md text-gray-600 mb-2">
                {/* Added mb-2 */}
                {favoriteDirectors.length > 0
                  ? (
                    favoriteDirectors.join(", ")
                  )
                  : (
                    <span className="text-sm text-gray-600">
                      No favorite directors selected.
                    </span>
                  )}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSelectingDirectors(!isSelectingDirectors)}
                className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5] hover:text-gray-500 mb-2" // Added mb-2
              >
                {favoriteDirectors.length > 0 ? "Change" : "Select"}{" "}
                Favorite Directors
              </Button>
              {isSelectingDirectors && (
                <div className="mt-2 p-4 bg-[#f7f9ff] rounded-lg border border-[#b9c0de]">
                  <p className="text-sm text-gray-600 mb-3">
                    Please select amongst the directors în your favorite movie
                    and in the movies in your Watch List
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...directorOptions]
                      .sort((a, b) => a.localeCompare(b))
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setFavoriteDirectors((prev) =>
                              prev.includes(name)
                                ? prev.filter((n) => n !== name)
                                : [...prev, name]
                            );
                          }}
                          className={`px-3 py-1 rounded-full border ${
                            favoriteDirectors.includes(name)
                              ? "bg-[#AFB3FF] text-white"
                              : "bg-[#CDD1FF] text-white hover:bg-[#AFB3FF]"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                  </div>

                  {/* Director Search */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Search for additional directors:
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={directorSearchQuery}
                        onChange={(e) => setDirectorSearchQuery(e.target.value)}
                        placeholder="Enter director name..."
                        className="p-2 border rounded-md flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={handleDirectorSearch}
                        className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5]"
                      >
                        Search
                      </Button>
                    </div>

                    {directorSearchLoading && (
                      <p className="text-sm text-gray-500">Searching...</p>
                    )}
                    {directorSearchError && (
                      <p className="text-sm text-red-500">
                        {directorSearchError}
                      </p>
                    )}

                    {directorSearchResults.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">
                          Search results:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {directorSearchResults.map((director) => (
                            <button
                              key={director.directorId}
                              type="button"
                              onClick={() => {
                                setFavoriteDirectors((prev) =>
                                  prev.includes(director.directorName)
                                    ? prev.filter(
                                      (n) => n !== director.directorName,
                                    )
                                    : [...prev, director.directorName]
                                );
                              }}
                              className={`px-3 py-1 rounded-full border ${
                                favoriteDirectors.includes(
                                    director.directorName,
                                  )
                                  ? "bg-[#AFB3FF] text-white"
                                  : "bg-[#CDD1FF] text-white hover:bg-[#AFB3FF]"
                              }`}
                            >
                              {director.directorName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Movie Section - *** CHANGE 2: Button Placement *** */}
            <div>
              <label className="block text-[#3b3e88] text-sm font-medium mb-2">
                Favorite Movie
              </label>
              <div className="mb-2">
                {/* Display selected movie */}
                {favoriteMovie
                  ? (
                    <div className="flex items-center space-x-4">
                      <MovieCard
                        movie={favoriteMovie}
                        isInWatchlist={false}
                        isInSeenList={false}
                        isFavorite={true}
                        onClick={() => {}} // Empty handler since we don't need modal here
                      />
                      <span className="text-md text-gray-600">
                        {favoriteMovie.title}
                      </span>
                    </div>
                  )
                  : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">
                        No favorite movie selected
                      </span>
                    </div>
                  )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-[#AFB3FF] text-white hover:bg-[#9A9EE5] hover:text-gray-500 mb-2"
                onClick={handleSelectFavoriteMovie}
              >
                {favoriteMovie ? "Change" : "Select"} Favorite Movie
              </Button>
            </div>

            {/* Inline error/success messages */}
            {submitError && (
              <ErrorMessage
                message={submitError}
                onClose={() => setSubmitError("")}
              />
            )}
            {showSuccessMessage && (
              <ActionMessage
                message={successMessage}
                isVisible={showSuccessMessage}
                onHide={() => setShowSuccessMessage(false)}
                className="bg-green-500"
              />
            )}
            <div className="flex space-x-4 pt-4">
              {/* Added pt-4 for spacing */}
              <Button
                type="submit"
                variant="default"
                className="bg-[#ff9a3e] hover:bg-[#e88b35]"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-gray-200 text-[#3b3e88] hover:bg-gray-300"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        <Button
          variant="destructive"
          className="mt-8 bg-[#f44771] opacity-50 hover:bg-[#e03e65] hover:opacity-60"
          onClick={handleCancel}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
