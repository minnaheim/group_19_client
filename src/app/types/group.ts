import {User} from "@/app/types/user";
import {Movie} from "@/app/types/movie";

export interface Group {
    groupId: number;
    name: string;
    description?: string;
    creator: User;
    members: User[];
    moviePool?: Movie[];
    createdAt: string;
}


