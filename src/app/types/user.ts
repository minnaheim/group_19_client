import { Movie } from "@/app/types/movie";

export interface User {
  userId: number;
  username: string;
  email: string;
  password: string;
  bio: string;
  status?: string; // User status (ONLINE/OFFLINE)
  token?: string; // Authentication token
  favoriteGenres?: string[];
  favoriteActors?: string[];
  favoriteDirectors?: string[];
  favoriteMovie?: Movie; // Single favorite movie object
  watchlist: Movie[];
  watchedMovies: Movie[];
  // Not using friends and friend requests for now
  // friends?: User[];
  // sentFriendRequests?: any[];
  // receivedFriendRequests?: any[];
}
