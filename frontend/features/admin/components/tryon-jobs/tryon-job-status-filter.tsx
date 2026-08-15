import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminTryOnJobFilters } from "@/types/admin";

const STATUS_TABS: { value: AdminTryOnJobFilters["status"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export interface TryOnJobStatusFilterProps {
  value: AdminTryOnJobFilters["status"];
  onChange: (status: AdminTryOnJobFilters["status"]) => void;
}

function TryOnJobStatusFilter({ value, onChange }: TryOnJobStatusFilterProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as AdminTryOnJobFilters["status"])}>
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

export { TryOnJobStatusFilter };
