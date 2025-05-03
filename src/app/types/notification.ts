export interface Notification {
  id: number;
  type: "friend_request" | "group_invite" | "group_update" | "custom";
  message: string;
  actionType?: "accept_decline" | "go_to" | "view";
  actionLabel?: string;
  actionUrl?: string;
  sender?: string;
  requestId?: number;
  invitationId?: number;
  groupId?: number;
}
