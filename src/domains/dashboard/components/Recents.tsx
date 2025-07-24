import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeTable } from "@/core/hooks/useRealtimeTable";
import { supabase } from "@/core/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";
import { useWidgetAnalytics } from '@/shared/features/widgets/hooks/useWidgetAnalytics';
import { useEffect } from "react";

type RecentItem = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  viewedAt: string;
};

async function fetchRecents(): Promise<RecentItem[]> {
  const { data, error }: { data: RecentItem[] | null; error: PostgrestError | null } = await supabase
    .from("Recent")
    .select("*")
    .order("viewedAt", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export function Recents() {
  const queryClient = useQueryClient();
  const { logWidgetEvent } = useWidgetAnalytics();
  const widgetId = "recents-widget";

  useEffect(() => {
    logWidgetEvent(widgetId, "view");
    // eslint-disable-next-line
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["recents"],
    queryFn: fetchRecents,
  });

  useRealtimeTable("Recent", () => {
    queryClient.invalidateQueries({ queryKey: ["recents"] });
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading recents. Please try again.</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No recent items.
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
              Viewed {formatDistanceToNow(new Date(item.viewedAt))} ago
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