-- Migration: Drop old tables after data migration
-- Safe to run even if tables are already dropped

DROP TABLE IF EXISTS personal_thoughts CASCADE;
DROP TABLE IF EXISTS manual_tasks CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS goal_assessments CASCADE;
-- Add more DROP TABLE IF EXISTS statements for any other legacy tables as needed 