import {Movie} from "@/types/movie";


export interface User {
  id: number; // Maps to userId in backend
  userId?: number; // Optional for compatibility with backend
  username: string;
  email: string;
  password: string;
  bio: string;
  status?: string; // User status (ONLINE/OFFLINE)
  token?: string; // Authentication token
  favoriteGenres?: string[];
  favoriteActors?: string[];
  favoriteDirectors?: string[];
  favoriteMovies?: string[]; // IDs of favorite movies
  favoriteMovie?: Movie; // Single favorite movie object (client-side)
  watchlist: Movie[];
  watchedMovies: Movie[];
  // Not using friends and friend requests for now
  // friends?: User[];
  // sentFriendRequests?: any[];
  // receivedFriendRequests?: any[];
}
