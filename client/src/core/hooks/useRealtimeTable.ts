import { useEffect } from "react";
import { postgres } from "@/lib/postgres";

export function useRealtimeTable(table: "Recent" | "Pin", onChange: () => void) {
  useEffect(() => {
    const channel = postgres
      .channel(`realtime: ${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        payload => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      postgres.removeChannel(channel);
    };
  }, [table, onChange]);
} 
