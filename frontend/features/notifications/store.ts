import { create } from "zustand";

import type { NotificationItem } from "@/features/notifications/types";

/**
 * Global Notification Center — PLACEHOLDER, same gap
 * `shared/components/notification-bell.tsx` already documented since
 * Phase 2.1: no notification system/model/endpoint exists on the backend
 * (see backend docs/NOTIFICATIONS.md's planned outbox pattern). This is
 * genuinely interactive client-side state (Zustand — ephemeral UI state,
 * not server data, matching `docs/frontend/FRONTEND_ARCHITECTURE.md`'s
 * state-management rule), seeded with a few representative examples so
 * the panel demonstrates real interaction (mark-read, dismiss) rather than
 * a permanently-empty shell. See docs/frontend/UX_SYSTEM.md "Global
 * notification center".
 */
const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Try-on ready",
    message: "Your virtual try-on result is ready to view.",
    category: "tryon",
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: "n-2",
    title: "Welcome to FitMirror AI",
    message: "Complete your profile to get better try-on results.",
    category: "system",
    timestamp: new Date().toISOString(),
    read: true,
  },
];

interface NotificationsState {
  notifications: NotificationItem[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: SEED_NOTIFICATIONS,
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
