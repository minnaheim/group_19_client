import { Movie } from "./movie";

export interface VoteStateDTO {
  pool: Movie[];
  rankings: { movieId: number; rank: number }[];
}
