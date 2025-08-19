-- Migration: Fix AI Usage Response Time Type
-- Description: Change response_time_ms from INTEGER to DECIMAL(10,3) to handle float values

-- Update the response_time_ms column type to handle decimal values
ALTER TABLE ai_provider_usage 
ALTER COLUMN response_time_ms TYPE DECIMAL(10,3);

-- Add a comment to document the change
COMMENT ON COLUMN ai_provider_usage.response_time_ms IS 'Response time in milliseconds with decimal precision for accurate timing measurements';
