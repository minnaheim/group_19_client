export interface Movie {
  movieId: number;
  title: string;
  posterURL: string;
  description: string;
  genres: string[];
  directors: string[];
  actors: string[];
  trailerURL: string;
  year: number;
  originallanguage: string;
}
