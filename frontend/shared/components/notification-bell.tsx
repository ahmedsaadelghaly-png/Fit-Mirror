"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/features/notifications/notification-center";
import { useNotificationsStore } from "@/features/notifications/store";

/**
 * Real unread-count badge + a functional (if backend-placeholder)
 * notification center — see features/notifications/ and
 * docs/frontend/UX_SYSTEM.md "Global notification center". Was a
 * permanently-empty shell through Phase 2.5 (no notification system
 * exists on the backend — see backend docs/NOTIFICATIONS.md's planned
 * outbox pattern); the list is still client-only seed data, not fetched
 * from anywhere, but every interaction (mark-read, dismiss, mark-all-read)
 * is real.
 */
function NotificationBell() {
  const unreadCount = useNotificationsStore(
    (state) => state.notifications.filter((n) => !n.read).length,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <NotificationCenter />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NotificationBell };
