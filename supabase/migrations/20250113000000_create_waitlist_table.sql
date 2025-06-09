-- Create waitlist table for pre-launch signups
-- Migration: 20250113000000_create_waitlist_table.sql

-- Enable Row Level Security on all tables
CREATE TABLE public.waitlist_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    company_name TEXT,
    referral_code TEXT UNIQUE,
    referred_by_code TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'early-bird' CHECK (tier IN ('early-bird', 'vip', 'founder')),
    referral_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_waitlist_email ON public.waitlist_signups(email);
CREATE INDEX idx_waitlist_referral_code ON public.waitlist_signups(referral_code);
CREATE INDEX idx_waitlist_referred_by ON public.waitlist_signups(referred_by_code);
CREATE INDEX idx_waitlist_position ON public.waitlist_signups(position);
CREATE INDEX idx_waitlist_tier ON public.waitlist_signups(tier);
CREATE INDEX idx_waitlist_created_at ON public.waitlist_signups(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_waitlist_signups_updated_at 
    BEFORE UPDATE ON public.waitlist_signups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(email_input TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base code from email
    base_code := UPPER(SUBSTRING(encode(email_input::bytea, 'base64'), 1, 8));
    -- Remove non-alphanumeric characters
    base_code := REGEXP_REPLACE(base_code, '[^A-Z0-9]', '', 'g');
    -- Ensure it's exactly 8 characters
    base_code := RPAD(base_code, 8, '0');
    
    final_code := base_code;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.waitlist_signups WHERE referral_code = final_code) LOOP
        counter := counter + 1;
        final_code := base_code || counter::TEXT;
    END LOOP;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to assign position based on signup order and referrals
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
DECLARE
    current_max_position INTEGER;
    referrer_record RECORD;
BEGIN
    -- Get current max position
    SELECT COALESCE(MAX(position), 0) INTO current_max_position FROM public.waitlist_signups;
    
    -- If this is a new signup
    IF TG_OP = 'INSERT' THEN
        -- Generate referral code if not provided
        IF NEW.referral_code IS NULL THEN
            NEW.referral_code := generate_referral_code(NEW.email);
        END IF;
        
        -- Assign position
        NEW.position := current_max_position + 1;
        
        -- If referred by someone, update their referral count and improve their position
        IF NEW.referred_by_code IS NOT NULL THEN
            SELECT * INTO referrer_record 
            FROM public.waitlist_signups 
            WHERE referral_code = NEW.referred_by_code;
            
            IF FOUND THEN
                -- Update referrer's referral count
                UPDATE public.waitlist_signups 
                SET referral_count = referral_count + 1,
                    position = GREATEST(1, position - 3) -- Move up 3 positions per referral
                WHERE referral_code = NEW.referred_by_code;
            END IF;
        END IF;
        
        -- Assign tier based on position
        IF NEW.position <= 100 THEN
            NEW.tier := 'founder';
        ELSIF NEW.position <= 500 THEN
            NEW.tier := 'vip';
        ELSE
            NEW.tier := 'early-bird';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position assignment
CREATE TRIGGER assign_waitlist_position_trigger
    BEFORE INSERT ON public.waitlist_signups
    FOR EACH ROW
    EXECUTE FUNCTION assign_waitlist_position();

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create policies (open for reading aggregate data, restricted for personal data)
-- Allow anyone to read basic stats (for counter on landing page)
CREATE POLICY "Allow reading waitlist stats" ON public.waitlist_signups
    FOR SELECT USING (true);

-- Allow anyone to insert new signups (for waitlist form)
CREATE POLICY "Allow waitlist signups" ON public.waitlist_signups
    FOR INSERT WITH CHECK (true);

-- Only allow users to update their own records (for email preferences, etc.)
CREATE POLICY "Allow users to update own records" ON public.waitlist_signups
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Grant permissions
GRANT SELECT, INSERT ON public.waitlist_signups TO anon;
GRANT ALL ON public.waitlist_signups TO authenticated;

-- Create view for public stats (to avoid exposing personal data)
CREATE VIEW public.waitlist_stats AS
SELECT 
    COUNT(*) as total_signups,
    COUNT(*) FILTER (WHERE tier = 'founder') as founder_spots_taken,
    COUNT(*) FILTER (WHERE tier = 'vip') as vip_spots_taken,
    COUNT(*) FILTER (WHERE tier = 'early-bird') as early_bird_signups,
    MAX(created_at) as last_signup_at
FROM public.waitlist_signups;

-- Grant access to stats view
GRANT SELECT ON public.waitlist_stats TO anon, authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.waitlist_signups IS 'Stores waitlist signups for Nexus platform launch with referral system and tier management'; 