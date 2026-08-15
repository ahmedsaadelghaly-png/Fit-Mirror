import { Plus, Settings, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  { label: "Add a product", href: "/brand/products/new", icon: Plus },
  { label: "View products", href: "/brand/products", icon: Sparkles },
  { label: "Store profile", href: "/brand/profile", icon: Settings },
];

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground" aria-hidden="true" />
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
