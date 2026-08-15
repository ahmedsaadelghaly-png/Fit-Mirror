import { Plus, Shirt, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  { label: "Start a try-on", href: "/shopper/tryon", icon: Sparkles },
  { label: "Add wardrobe item", href: "/shopper/wardrobe", icon: Plus },
  { label: "Edit body profile", href: "/shopper/profile", icon: UserRound },
];

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shirt className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Quick actions</CardTitle>
        </div>
        <CardDescription>Jump back into what you were doing</CardDescription>
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
