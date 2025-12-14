export interface NotificationsDto {
  challenges: number; // Pending challenges
  classes: number; // Classes with new announcements/assignments
  chat: number; // Conversations with unread messages
  missions: boolean; // Weekly missions refreshed
  classNotifications: Record<number, number>; // Class ID -> notification count
  chatNotifications: Record<number, number>; // Conversation ID -> unread count
}

