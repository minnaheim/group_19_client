// DTO for saving/fetching genres
export interface UserPreferencesGenresDTO {
  genreIds: string[];
}

// DTO for saving favorite movie
export interface UserPreferencesFavoriteMovieDTO {
  movieId: number;
}

// DTO for combined preferences (fetch)
import { Movie } from "./movie";
export interface UserPreferencesDTO {
  favoriteGenres: string[];
  favoriteMovie: Movie | null;
}
