import { Movie } from "@/types/movie";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  bio: string;
  favoriteGenres: string[];
  token: string | null;
  favoriteMovie: Movie;
  watchlist: Movie[];
  watchedMovies: Movie[];
}
