import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/shared/components/theme-toggle";

function ThemePreferenceShortcut() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Light, dark, or match your system.</CardDescription>
        </div>
        <ThemeToggle />
      </CardHeader>
    </Card>
  );
}

export { ThemePreferenceShortcut };
