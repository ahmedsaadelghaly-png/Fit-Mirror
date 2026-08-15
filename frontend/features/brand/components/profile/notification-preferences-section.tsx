"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const NOTIFICATION_OPTIONS = [
  { id: "new-tryon", label: "A shopper tries on one of your products" },
  { id: "low-stock", label: "A variant is running low on stock" },
  { id: "weekly-digest", label: "Weekly performance digest" },
];

/** PLACEHOLDER — no notification system exists on the backend yet (same gap as the Shopper app's). Toggles are local UI state only. */
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
