export type NotificationCategory = "system" | "tryon" | "store" | "admin";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
}
