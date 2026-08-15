"use client";

import { Bell, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNotificationsStore } from "@/features/notifications/store";

/** The dropdown panel content — rendered inside `shared/components/notification-bell.tsx`'s `DropdownMenuContent`. */
function NotificationCenter() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const dismiss = useNotificationsStore((state) => state.dismiss);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      <div className="flex items-center justify-between px-2 py-1.5">
        <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
        {hasUnread && (
          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <DropdownMenuSeparator />
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
          <Bell className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up — nothing here yet.
          </p>
        </div>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="group flex items-start gap-2 rounded-md p-2 text-sm hover:bg-accent/50"
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-primary"}`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{notification.title}</p>
                <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
              </div>
              <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label={`Mark "${notification.title}" as read`}
                    onClick={() => markRead(notification.id)}
                  >
                    <Check className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Dismiss "${notification.title}"`}
                  onClick={() => dismiss(notification.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export { NotificationCenter };
