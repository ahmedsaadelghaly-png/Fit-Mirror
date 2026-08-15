import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Store } from "@/types/domain";

export interface StoreIdentitySectionProps {
  store: Store;
}

/**
 * Read-only — there is no `PUT/PATCH /store` or `/store/me` (confirmed
 * absent server-side, not just unimplemented). Name/slug can only be set
 * once, at creation (see docs/frontend/BRAND_APP.md "API contract
 * mismatches").
 */
function StoreIdentitySection({ store }: StoreIdentitySectionProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Store name", value: store.name },
    { label: "URL slug", value: `fitmirror.ai/store/${store.slug}` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Store identity</CardTitle>
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
            <span className="text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { StoreIdentitySection };
