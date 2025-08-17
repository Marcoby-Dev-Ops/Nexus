/**
 * Database Types - Minimal Supabase-like interface
 * 
 * This provides the minimal type definitions needed for services that still
 * reference the old Supabase types. The actual database operations use the
 * new API client pattern.
 */

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [key: string]: {
        Row: any;
      };
    };
    Functions: {
      [key: string]: {
        Args: any;
        Returns: any;
      };
    };
  };
}
