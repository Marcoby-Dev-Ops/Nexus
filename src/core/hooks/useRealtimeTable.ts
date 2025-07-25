import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeTable(table: "Recent" | "Pin", onChange: () => void) {
  useEffect(() => {
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
} 