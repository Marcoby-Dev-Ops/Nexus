import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeTable } from "@/core/hooks/useRealtimeTable";
import { supabase } from "@/lib/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";
import { useWidgetAnalytics } from '@/shared/features/widgets/hooks/useWidgetAnalytics';
import { useEffect } from "react";

type PinItem = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  pinnedAt: string;
};

async function fetchPins(): Promise<PinItem[]> {
  const { data, error }: { data: PinItem[] | null; error: PostgrestError | null } = await supabase
    .from("Pin")
    .select("*")
    .order("pinnedAt", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export function Pins() {
  const queryClient = useQueryClient();
  const { logWidgetEvent } = useWidgetAnalytics();
  const widgetId = "pins-widget";

  useEffect(() => {
    logWidgetEvent(widgetId, "view");
    // eslint-disable-next-line
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pins"],
    queryFn: fetchPins,
  });

  useRealtimeTable("Pin", () => {
    queryClient.invalidateQueries({ queryKey: ["pins"] });
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-6 bg-muted rounded w-1/2 mb-2" />
        <div className="animate-pulse h-6 bg-muted rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading pins. Please try again.</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No pinned items.
        <button
          className="ml-2 text-xs text-primary underline"
          onClick={() => logWidgetEvent(widgetId, "dismiss")}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {data.map(item => (
        <li key={item.id} className="flex items-center justify-between py-2">
          <span>
            {item.entityType}: {item.entityId}
            <span className="ml-2 text-xs text-muted-foreground">
              Pinned {formatDistanceToNow(new Date(item.pinnedAt))} ago
            </span>
          </span>
          <button
            className="ml-4 text-primary hover: underline"
            onClick={() => logWidgetEvent(widgetId, "click", { itemId: item.id })}
          >
            Open
          </button>
        </li>
      ))}
    </ul>
  );
} 