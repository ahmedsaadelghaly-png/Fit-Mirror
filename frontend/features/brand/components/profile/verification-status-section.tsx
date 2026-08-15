import { CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface VerificationStatusSectionProps {
  isVerified: boolean;
}

/**
 * `StoreRead.is_verified` is readable but there's no endpoint to request
 * or trigger verification — it's `false` on every `POST /store` and can
 * only change via direct DB access. `docs/RBAC.md` lists "verify a store"
 * as planned, `platform_admin`-only. See docs/frontend/BRAND_APP.md.
 */
function VerificationStatusSection({ isVerified }: VerificationStatusSectionProps) {
  return (
    <Card className={isVerified ? undefined : "border-dashed"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Verification</CardTitle>
          {isVerified ? (
            <Badge variant="success">
              <CheckCircle2 className="size-3.5" /> Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Clock className="size-3.5" /> Pending
            </Badge>
          )}
        </div>
        <CardDescription>
          {isVerified
            ? "Your store has been verified by the FitMirror AI team."
            : "Store verification is a planned feature — there's no request workflow yet."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export { VerificationStatusSection };
