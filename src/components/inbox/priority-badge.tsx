import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";

const priorityVariant: Record<Priority, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={priorityVariant[priority]} className="capitalize">
      {priority}
    </Badge>
  );
}
