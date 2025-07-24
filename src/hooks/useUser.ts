import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            size
          )
        `)
        .eq('id', userId)
        .single();
      
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
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
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
      
      // Get user profile first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!userProfile?.company_id) throw new Error('User not associated with a company');
      
      // Get business profile
      const { data, error } = await supabase
        .from('business_profiles')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            size
          )
        `)
        .eq('org_id', userProfile.company_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
} 