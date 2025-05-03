import { Movie } from "@/app/types/movie";

export interface VoteSubmission {
  groupId: number;
  userId: number;
  votes: Movie[];
}
