import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TryOnHistoryFilters } from "@/types/shopper";

const STATUS_TABS: { value: TryOnHistoryFilters["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export interface TryOnStatusFilterProps {
  value: TryOnHistoryFilters["status"];
  onChange: (status: TryOnHistoryFilters["status"]) => void;
}

function TryOnStatusFilter({ value, onChange }: TryOnStatusFilterProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as TryOnHistoryFilters["status"])}>
      <TabsList>
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export { TryOnStatusFilter };
