import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/domain";

const ROLE_LABELS: Record<UserRole, string> = {
  shopper: "Shopper",
  brand_admin: "Brand admin",
  platform_admin: "Platform admin",
};

const ROLE_VARIANTS: Record<UserRole, "secondary" | "default" | "outline"> = {
  shopper: "secondary",
  brand_admin: "default",
  platform_admin: "outline",
};

export interface UserRoleBadgeProps {
  role: UserRole;
}

function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return <Badge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</Badge>;
}

export { UserRoleBadge };
