-- Pillar 1,5 – Enable conversation summarisation
-- Adds an array column to store <=150-token summaries for every 20-message block.
-- No data migration needed; existing conversations will get an empty array.

alter table public.ai_conversations
  add column if not exists summary_chunks jsonb[] default '{}'::jsonb[];

-- RLS unchanged (inherits from ai_conversations). 