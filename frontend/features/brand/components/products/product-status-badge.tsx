import { Badge } from "@/components/ui/badge";

export interface ProductStatusBadgeProps {
  isActive: boolean;
  isArchived: boolean;
}

function ProductStatusBadge({ isActive, isArchived }: ProductStatusBadgeProps) {
  if (isArchived) {
    return <Badge variant="outline">Archived</Badge>;
  }
  return (
    <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
  );
}

export { ProductStatusBadge };
