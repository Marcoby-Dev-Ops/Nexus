export interface WaitlistSignup {
  id: string;
  email: string;
  firstName: string;
  company?: string;
  referredBy?: string;
  tier: 'early-bird' | 'founder' | 'vip';
  position: number;
  joinedAt: Date;
  referrals: number;
}

export interface WaitlistStats {
  total_signups: number;
  early_bird_count: number;
  founder_count: number;
  vip_count: number;
  average_referrals: number;
  conversion_rate: number;
}

// Local ServiceResponse interface to avoid import issues
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: Record<string, any>;
}

class WaitlistService {
  async signup(data: {
    email: string;
    firstName: string;
    company?: string;
    referredBy?: string;
  }): Promise<ServiceResponse<WaitlistSignup>> {
    try {
      // TODO: Replace with actual API call
      // For now, return mock data
      const mockSignup: WaitlistSignup = {
        id: `wl_${Date.now()}`,
        email: data.email,
        firstName: data.firstName,
        company: data.company,
        referredBy: data.referredBy,
        tier: 'early-bird',
        position: Math.floor(Math.random() * 1000) + 1,
        joinedAt: new Date(),
        referrals: 0,
      };

      return {
        data: mockSignup,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to sign up for waitlist',
        success: false,
      };
    }
  }

  async getStats(): Promise<ServiceResponse<WaitlistStats>> {
    try {
      // TODO: Replace with actual API call
      // For now, return mock data
      const mockStats: WaitlistStats = {
        total_signups: 1247,
        early_bird_count: 800,
        founder_count: 300,
        vip_count: 147,
        average_referrals: 2.3,
        conversion_rate: 0.15,
      };

      return {
        data: mockStats,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to fetch waitlist stats',
        success: false,
      };
    }
  }

  async getPosition(email: string): Promise<ServiceResponse<number>> {
    try {
      // TODO: Replace with actual API call
      // For now, return mock position
      const position = Math.floor(Math.random() * 1000) + 1;

      return {
        data: position,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to get waitlist position',
        success: false,
      };
    }
  }

  async getReferralStats(userId: string): Promise<ServiceResponse<{
    referrals: number;
    referralCode: string;
    referralLink: string;
  }>> {
    try {
      // TODO: Replace with actual API call
      // For now, return mock data
      const mockReferralStats = {
        referrals: Math.floor(Math.random() * 10),
        referralCode: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        referralLink: `https://nexus.com/waitlist?ref=REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      };

      return {
        data: mockReferralStats,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to get referral stats',
        success: false,
      };
    }
  }
}

export const waitlistService = new WaitlistService(); 