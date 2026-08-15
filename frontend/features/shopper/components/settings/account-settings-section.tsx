import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** PLACEHOLDER — no backend endpoint exists for password change or account deletion yet. */
function AccountSettingsSection() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Account</CardTitle>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>Password and account management.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" disabled placeholder="••••••••" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled>
            Update password
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled
          >
            Delete account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { AccountSettingsSection };
