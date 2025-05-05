export interface GroupInvitation {
  id: number;
  groupId: number;
  groupName: string;
  sender: string;
  receiver: {
    userId: number;
    username: string;
  };
  status: string;
  createdAt: string;
}
