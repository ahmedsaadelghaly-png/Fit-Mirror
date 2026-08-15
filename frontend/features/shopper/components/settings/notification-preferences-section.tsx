"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const NOTIFICATION_OPTIONS = [
  { id: "tryon-complete", label: "Try-on results are ready" },
  { id: "wardrobe-tips", label: "Wardrobe and styling tips" },
  { id: "product-drops", label: "New product drops from your favorite stores" },
];

/**
 * PLACEHOLDER — see shared/components/notification-bell.tsx's own
 * docstring: no notification system exists on the backend yet (planned
 * outbox pattern, see backend docs/NOTIFICATIONS.md). Toggles here are
 * local UI state only, not persisted.
 */
function NotificationPreferencesSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Notifications</CardTitle>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>
          Not connected to a backend yet — choices here aren&apos;t saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {NOTIFICATION_OPTIONS.map((option) => (
          <label key={option.id} htmlFor={option.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={option.id}
              checked={!!enabled[option.id]}
              onCheckedChange={(checked) =>
                setEnabled((prev) => ({ ...prev, [option.id]: checked === true }))
              }
            />
            {option.label}
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

export { NotificationPreferencesSection };
