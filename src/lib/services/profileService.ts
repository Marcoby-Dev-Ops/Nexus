import { supabase } from '../supabase';
import type { UserOnboardingProfile } from '@/components/onboarding/OnboardingChatAI';

/**
 * Upserts the user's onboarding profile into the database.
 * 1) Upserts company info and retrieves the company record.
 * 2) Upserts the user_profiles record linking the user to the company.
 */
export async function upsertOnboardingProfile(
  profile: UserOnboardingProfile,
  userId: string
): Promise<{ company: any; userProfile: any }> {
  // 1) Upsert company record
  const { data: company, error: compError } = await supabase
    .from('companies')
    .upsert({
      name: profile.company.name,
      domain: profile.company.domain,
      industry: profile.company.industry,
      size: profile.company.size,
      description: profile.company.description,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (compError) throw compError;

  // 2) Upsert user_profiles record
  const { data: userProfile, error: upError } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      company_id: company.id,
      role: profile.user.role,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (upError) throw upError;

  return { company, userProfile };
} 