-- Fix missing title column in personal_thoughts
ALTER TABLE personal_thoughts ADD COLUMN IF NOT EXISTS title VARCHAR(255);
