import {User} from "@/app/types/user";

export interface Review {
    id: number;
    userId: number;
    movieId: number;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt?: string;
    user?: User;
}