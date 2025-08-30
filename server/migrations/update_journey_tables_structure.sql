-- Update journey tables structure to match new server implementation
-- This migration updates the table structure to support the new journey service

-- Update user_journey_progress table structure
ALTER TABLE user_journey_progress 
ADD COLUMN IF NOT EXISTS journey_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS template_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maturity_assessment JSONB,
ADD COLUMN IF NOT EXISTS playbook_progress_id VARCHAR(255);

-- Update user_journey_responses table structure
ALTER TABLE user_journey_responses 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS journey_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS step_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS playbook_response_id VARCHAR(255);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey_id ON user_journey_progress(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_template_id ON user_journey_progress(template_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_journey_id ON user_journey_responses(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_step_id ON user_journey_responses(step_id);

-- Update existing data to populate new columns
-- For existing journey progress records, generate journey_id if not present
UPDATE user_journey_progress 
SET journey_id = CONCAT('journey_', EXTRACT(EPOCH FROM created_at)::BIGINT)
WHERE journey_id IS NULL;

-- For existing journey progress records, copy journey_template_id to template_id
UPDATE user_journey_progress 
SET template_id = journey_template_id
WHERE template_id IS NULL AND journey_template_id IS NOT NULL;

-- For existing journey responses, copy journey_template_id to template_id if step_id is not set
UPDATE user_journey_responses 
SET step_id = item_id
WHERE step_id IS NULL AND item_id IS NOT NULL;

-- For existing journey responses, generate journey_id if not present
UPDATE user_journey_responses 
SET journey_id = CONCAT('journey_', EXTRACT(EPOCH FROM created_at)::BIGINT)
WHERE journey_id IS NULL;
