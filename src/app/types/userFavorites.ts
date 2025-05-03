// DTO for saving/fetching genres
export interface UserFavoritesGenresDTO {
  genreIds: string[];
}

// DTO for saving favorite movie
export interface UserFavoritesMovieDTO {
  movieId: number;
}

// DTO for combined favorites (fetch)
import { Movie } from "./movie";
export interface UserFavoritesDTO {
  favoriteGenres: string[];
  favoriteMovie: Movie | null;
}

// DTO for saving favorite actors
export interface UserFavoritesActorsDTO {
  favoriteActors: string[];
}

// DTO for saving favorite directors
export interface UserFavoritesDirectorsDTO {
  favoriteDirectors: string[];
}
