-- Update existing models with a display_name (only if they don't already have one)
UPDATE public.ai_models
SET display_name = 'GPT-4o'
WHERE model_name = 'gpt-4o' AND display_name IS NULL;

UPDATE public.ai_models
SET display_name = 'GPT-4 Turbo'
WHERE model_name = 'gpt-4-turbo' AND display_name IS NULL;

UPDATE public.ai_models
SET display_name = 'GPT-3.5 Turbo'
WHERE model_name = 'gpt-3.5-turbo-0125' AND display_name IS NULL;

-- Set display_name for any other models to be the same as model_name if it's null
UPDATE public.ai_models
SET display_name = model_name
WHERE display_name IS NULL;

-- Add a not-null constraint now that all rows are populated
-- Only add the constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_models' 
        AND column_name = 'display_name' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.ai_models ALTER COLUMN display_name SET NOT NULL;
    END IF;
END $$; 