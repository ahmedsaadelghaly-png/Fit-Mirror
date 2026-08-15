import { Wand2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Dashboard entry point for the AI Stylist — see app/(shopper)/shopper/stylist/page.tsx, which clearly marks the feature as planned (backend `/stylist/suggestions` returns 501 today). */
function AiStylistPlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wand2 className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">AI Stylist</CardTitle>
          </div>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <CardDescription>
          Outfit suggestions built from your wardrobe and style profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/shopper/stylist">Preview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { AiStylistPlaceholderCard };
