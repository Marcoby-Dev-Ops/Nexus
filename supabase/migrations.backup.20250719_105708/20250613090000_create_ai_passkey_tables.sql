-- Pillar 6 – Reliability & Trust
-- Create ai_passkeys table to store WebAuthn credentials
-- and ai_passkey_challenges table to persist registration challenge per user

-- =====================================================================
-- Table: ai_passkeys
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ai_passkeys (
  credential_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter INT DEFAULT 0,
  device_type TEXT CHECK (device_type IN ('single_device', 'multi_device')),
  friendly_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful index for look-ups by user
CREATE INDEX IF NOT EXISTS idx_ai_passkeys_user_id ON public.ai_passkeys(user_id);

-- ---------------------------------------------------------------------
-- Row-Level Security – tenant isolation (user scope)
-- ---------------------------------------------------------------------
ALTER TABLE public.ai_passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passkeys" ON public.ai_passkeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passkeys" ON public.ai_passkeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own passkeys" ON public.ai_passkeys
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- Table: ai_passkey_challenges
-- Stores the current registration challenge per user. Rows can be cleaned
-- up via a scheduled job or after successful verification.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ai_passkey_challenges (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_passkey_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own passkey challenges" ON public.ai_passkey_challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); 