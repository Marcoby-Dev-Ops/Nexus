-- Fix userid column naming in personal_thoughts to match standard user_id
ALTER TABLE personal_thoughts RENAME COLUMN userid TO user_id;
