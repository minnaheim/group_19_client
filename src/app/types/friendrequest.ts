import { User } from "@/app/types/user";

export interface FriendRequest {
  requestId: number;
  sender: User;
  receiver: User;
  accepted: boolean | null;
  creationTime: string;
  responseTime: string | null;
}
