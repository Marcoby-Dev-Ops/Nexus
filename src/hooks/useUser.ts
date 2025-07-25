import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';

export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await userService.getUser(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { data, error } = await userService.updateUser(userId, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries(['user', userId]);
    }
  });
}

export function useUserBusinessData(userId?: string) {
  return useQuery({
    queryKey: ['user-business', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await userService.getUserBusinessData(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
} 