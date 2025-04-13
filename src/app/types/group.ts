import {User} from "@/app/types/user";
import {Movie} from "@/app/types/movie";

export interface Group {
    id: number;
    name: string;
    description?: string;
    creator: User;
    members: User[];
    moviePool?: Movie[];
    createdAt: string;
}