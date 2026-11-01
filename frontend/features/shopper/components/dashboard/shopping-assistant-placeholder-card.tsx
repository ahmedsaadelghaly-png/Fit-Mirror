import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Dashboard entry point for the Shopping Assistant — see app/(shopper)/shopper/shopping/page.tsx (backed by the rule-based backend `/shopping/ask`, badged Beta). */
function ShoppingAssistantPlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Shopping Assistant</CardTitle>
          </div>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <CardDescription>Ask questions and get product matches from the catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/shopper/shopping">Preview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { ShoppingAssistantPlaceholderCard };
