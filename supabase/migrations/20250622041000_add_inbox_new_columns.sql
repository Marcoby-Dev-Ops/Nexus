-- Pillar: 2
-- Add columns for new unified inbox schema but keep backward compatibility
-- 1. Add columns if they do not already exist
alter table if exists ai_inbox_items add column if not exists title text;
alter table if exists ai_inbox_items add column if not exists preview text;
alter table if exists ai_inbox_items add column if not exists sender text;
-- item_type is generally required in updated schema; default to 'email'
alter table if exists ai_inbox_items add column if not exists item_type text default 'email';

-- 2. Backfill values for existing rows (best-effort)
update ai_inbox_items
set title = coalesce(title, subject),
    preview = coalesce(preview, snippet, left(content, 120)),
    sender = coalesce(sender, sender_name, sender_email),
    item_type = coalesce(item_type, 'email')
where true;

-- 3. Create lightweight index on title for search performance (optional but helpful)
create index if not exists idx_ai_inbox_items_title on ai_inbox_items using gin (to_tsvector('english', title)); 