-- Update existing models with a display_name
UPDATE public.ai_models
SET display_name = 'GPT-4o'
WHERE model_name = 'gpt-4o';

UPDATE public.ai_models
SET display_name = 'GPT-4 Turbo'
WHERE model_name = 'gpt-4-turbo';

UPDATE public.ai_models
SET display_name = 'GPT-3.5 Turbo'
WHERE model_name = 'gpt-3.5-turbo-0125';

-- Set display_name for any other models to be the same as model_name if it's null
UPDATE public.ai_models
SET display_name = model_name
WHERE display_name IS NULL;

-- Add a not-null constraint now that all rows are populated
ALTER TABLE public.ai_models
ALTER COLUMN display_name SET NOT NULL; 