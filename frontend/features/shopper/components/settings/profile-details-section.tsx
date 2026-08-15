import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/domain";

export interface ProfileDetailsSectionProps {
  user: User;
}

/**
 * Read-only — the backend has no `PATCH /users/me` (or any endpoint) to
 * update name/email (see docs/frontend/SHOPPER_APP.md "API contract
 * mismatches"); only `GET /users/me` exists. Editing profile details is a
 * backend gap, not a frontend omission.
 */
function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: user.full_name ?? "Not set" },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role.replace("_", " ") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile details</CardTitle>
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

export { ProfileDetailsSection };
