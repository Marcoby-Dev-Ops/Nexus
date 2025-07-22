import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, type CalendarFilters } from '@/domains/services/calendarService';

/**
 * Hook for fetching calendar events
 * Follows data principles: real-time access, no local storage
 */
export function useCalendarEvents(filters: CalendarFilters = {}) {
  return useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: () => calendarService.getEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching calendar statistics
 */
export function useCalendarStats() {
  return useQuery({
    queryKey: ['calendar-stats'],
    queryFn: () => calendarService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for today's events
 */
export function useTodayEvents() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return useQuery({
    queryKey: ['calendar-today-events'],
    queryFn: () => calendarService.getEvents({
      startDate: startOfDay,
      endDate: endOfDay
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for upcoming events (next 7 days)
 */
export function useUpcomingEvents() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return useQuery({
    queryKey: ['calendar-upcoming-events'],
    queryFn: () => calendarService.getEvents({
      startDate: today,
      endDate: nextWeek
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for events by date range
 */
export function useEventsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['calendar-events-range', startDate, endDate],
    queryFn: () => calendarService.getEvents({
      startDate,
      endDate
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for events by source
 */
export function useEventsBySource(source: 'microsoft' | 'google' | 'outlook') {
  return useQuery({
    queryKey: ['calendar-events-source', source],
    queryFn: () => calendarService.getEvents({
      sources: [source]
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for events by category
 */
export function useEventsByCategory(category: 'meeting' | 'task' | 'reminder' | 'personal' | 'work') {
  return useQuery({
    queryKey: ['calendar-events-category', category],
    queryFn: () => calendarService.getEvents({
      categories: [category]
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for high priority events
 */
export function useHighPriorityEvents() {
  return useQuery({
    queryKey: ['calendar-high-priority-events'],
    queryFn: () => calendarService.getEvents({
      priorities: ['high']
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for refreshing calendar data
 */
export function useRefreshCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all calendar queries to force refresh
      await queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-today-events'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-upcoming-events'] });
    },
  });
}

/**
 * Hook for searching calendar events
 */
export function useCalendarSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['calendar-search', searchTerm],
    queryFn: () => calendarService.getEvents({
      searchTerm
    }),
    enabled: searchTerm.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for filtered calendar events
 */
export function useFilteredCalendarEvents(filters: CalendarFilters) {
  return useQuery({
    queryKey: ['calendar-filtered-events', filters],
    queryFn: () => calendarService.getEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 