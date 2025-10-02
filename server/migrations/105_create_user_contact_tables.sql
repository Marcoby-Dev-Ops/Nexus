-- Migration 105: Add user contact tables and support Authentik user identifiers
-- Ensures Authentik hashed IDs are stored without casting errors and introduces
-- dedicated tables for managing user contact information.

-- 1. Guarantee user_profiles.user_id can store Authentik hashed IDs
ALTER TABLE user_profiles
  ALTER COLUMN user_id TYPE VARCHAR(255)
  USING user_id::text;

-- Reassert NOT NULL in case older schemas lost it
ALTER TABLE user_profiles
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles (user_id);

-- 2. Create user contact tables (idempotent to allow reruns)
CREATE TABLE IF NOT EXISTS user_contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  label VARCHAR(100),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  phone_number VARCHAR(100) NOT NULL,
  label VARCHAR(100),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexing and data quality constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_contact_emails_user_email
  ON user_contact_emails (user_id, email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_contact_emails_primary
  ON user_contact_emails (user_id)
  WHERE is_primary;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_contact_phones_user_phone
  ON user_contact_phones (user_id, phone_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_contact_phones_primary
  ON user_contact_phones (user_id)
  WHERE is_primary;

-- 4. Maintain updated_at timestamps automatically
DROP TRIGGER IF EXISTS trg_user_contact_emails_updated_at ON user_contact_emails;
CREATE TRIGGER trg_user_contact_emails_updated_at
  BEFORE UPDATE ON user_contact_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_contact_phones_updated_at ON user_contact_phones;
CREATE TRIGGER trg_user_contact_phones_updated_at
  BEFORE UPDATE ON user_contact_phones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
