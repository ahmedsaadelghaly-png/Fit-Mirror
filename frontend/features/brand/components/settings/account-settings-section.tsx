import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/domain";

export interface AccountSettingsSectionProps {
  user: User;
}

/** Read-only — same gap as the Shopper app's settings page: only `GET /users/me` exists, no update endpoint. */
function AccountSettingsSection({ user }: AccountSettingsSectionProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: user.full_name ?? "Not set" },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role.replace("_", " ") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
        <CardDescription>
          Read-only for now — there&apos;s no backend endpoint to edit these fields yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium capitalize">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { AccountSettingsSection };
