import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";

export type GroupPhase = "POOL" | "VOTING" | "RESULTS";

export interface Group {
  groupId: number;
  name: string;
  description?: string;
  creator: User;
  members: User[];
  moviePool?: Movie[];
  createdAt: string;
  phase: GroupPhase;
}
