-- Migration: Clean up failsafe authentication tables and functions
-- This removes the failsafe authentication system that was added but is no longer needed

-- Drop failsafe authentication functions
DROP FUNCTION IF EXISTS authenticate_failsafe_user(text, text);
DROP FUNCTION IF EXISTS check_iam_availability();

-- Drop failsafe users table
DROP TABLE IF EXISTS failsafe_users CASCADE;

-- Drop failsafe indexes
DROP INDEX IF EXISTS idx_failsafe_users_external_id;
DROP INDEX IF EXISTS idx_failsafe_users_email;
