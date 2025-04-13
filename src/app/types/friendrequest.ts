import { User } from "@/app/types/user";
export interface FriendRequest {
    id: number;
    sender: User;
    receiver: User;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}