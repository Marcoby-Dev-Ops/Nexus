import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, BarChart2, Calendar, Users, History, AlertCircle, Pin, PinOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/core/supabase';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from '@/components/ui/Button';
import type { PostgrestError } from '@supabase/supabase-js';

const ICONS: Record<string, React.ReactNode> = {
  document_view: <FileText className="h-5 w-5 text-blue-500" />,
  dashboard_view: <BarChart2 className="h-5 w-5 text-purple-500" />,
  meeting: <Calendar className="h-5 w-5 text-green-500" />,
  contact: <Users className="h-5 w-5 text-orange-500" />,
  search_query: <History className="h-5 w-5 text-yellow-500" />,
  default: <History className="h-5 w-5 text-gray-500" />,
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  if (diffInSeconds < 60) return 'just now';

  for (const [interval, seconds] of Object.entries(intervals)) {
    const count = Math.floor(diffInSeconds / seconds);
    if (count > 0) {
      return `${count} ${interval}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'a long time ago';
};

type RecentItem = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  visited_at: string;
};

type PinItem = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  pinned_at: string;
};

const ItemList: React.FC<{
  items: (RecentItem | PinItem)[];
  isLoading: boolean;
  isError: boolean;
  onPinToggle: (item: RecentItem | PinItem) => void;
  isPinnedList?: boolean;
}> = ({ items, isLoading, isError, onPinToggle, isPinnedList = false }) => {
  if (isLoading) {
    return (
      <>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>Error loading items.</p>
      </div>
    );
  }
  
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items to display.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
        >
          {ICONS[(item as RecentItem).entity_type] || ICONS.default}
          <div className="flex-1">
            <p className="font-medium text-sm">{(item as RecentItem).entity_type} - {(item as RecentItem).entity_id}</p>
            <p className="text-xs text-muted-foreground capitalize">{(item as RecentItem).entity_type?.replace(/_/g, ' ')}</p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">{getTimeAgo((item as RecentItem).visited_at || (item as PinItem).pinned_at)}</div>
          <Button variant="ghost" size="icon" onClick={() => onPinToggle(item)}>
            {isPinnedList ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
        </div>
      ))}
    </div>
  );
};

// Fetch recents from Recent table
async function fetchRecents(): Promise<RecentItem[]> {
  const { data, error }: { data: RecentItem[] | null; error: PostgrestError | null } = await supabase
    .from('Recent')
    .select('*')
    .order('visited_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

// Fetch pins from Pin table
async function fetchPins(): Promise<PinItem[]> {
  const { data, error }: { data: PinItem[] | null; error: PostgrestError | null } = await supabase
    .from('Pin')
    .select('*')
    .order('pinned_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export const RecentsWidget: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: recentItems, isLoading: recentsLoading, isError: recentsError } = useQuery({
    queryKey: ['recentItems'],
    queryFn: fetchRecents,
  });

  const { data: pinnedItems, isLoading: pinnedLoading, isError: pinnedError } = useQuery({
    queryKey: ['pinnedItems'],
    queryFn: fetchPins,
  });

  // Real-time updates
  useRealtimeTable('Recent', useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentItems'] });
  }, [queryClient]));
  useRealtimeTable('Pin', useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pinnedItems'] });
  }, [queryClient]));

  // Pin: add to Pin table
  const pinMutation = useMutation({
    mutationFn: async (item: RecentItem) => {
      await supabase.from('Pin').insert({
        user_id: item.user_id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinnedItems'] });
    },
  });

  // Unpin: remove from Pin table
  const unpinMutation = useMutation({
    mutationFn: async (item: PinItem | RecentItem) => {
      // Find pin by user/entity
      const { data } = await supabase
        .from('Pin')
        .select('id')
        .eq('user_id', item.user_id)
        .eq('entity_type', item.entity_type)
        .eq('entity_id', item.entity_id)
        .limit(1)
        .single();
      if (data?.id) {
        await supabase.from('Pin').delete().eq('id', data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinnedItems'] });
    },
  });

  const handlePinToggle = (item: RecentItem | PinItem) => {
    const isPinned = pinnedItems?.some(
      (p) =>
        p.user_id === item.user_id &&
        p.entity_type === (item as RecentItem).entity_type &&
        p.entity_id === (item as RecentItem).entity_id
    );
    if (isPinned) {
      unpinMutation.mutate(item);
    } else {
      pinMutation.mutate(item as RecentItem);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recents">Recents</TabsTrigger>
            <TabsTrigger value="pinned">Pinned</TabsTrigger>
          </TabsList>
          <TabsContent value="recents">
             <ItemList
                items={recentItems || []}
                isLoading={recentsLoading}
                isError={recentsError}
                onPinToggle={handlePinToggle}
             />
          </TabsContent>
          <TabsContent value="pinned">
             <ItemList
                items={pinnedItems || []}
                isLoading={pinnedLoading}
                isError={pinnedError}
                onPinToggle={handlePinToggle}
                isPinnedList
             />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 