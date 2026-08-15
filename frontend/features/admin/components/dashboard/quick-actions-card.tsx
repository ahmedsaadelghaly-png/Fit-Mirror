import { Flag as FlagIcon, ShieldCheck, ToggleLeft, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  { label: "Review users", href: "/admin/users", icon: Users },
  { label: "Verify stores", href: "/admin/stores", icon: ShieldCheck },
  { label: "Flagged products", href: "/admin/products", icon: FlagIcon },
  { label: "Feature flags", href: "/admin/feature-flags", icon: ToggleLeft },
];

function QuickActionsCard() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
        <CardDescription>Jump into common admin tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
          <Button key={href} asChild variant="outline" className="justify-start">
            <Link href={href}>
              <Icon className="size-4" /> {label}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export { QuickActionsCard };
