-- Fix column naming inconsistencies
-- All columns already have correct naming (user_id), so this migration is a no-op

-- Log the fix
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "015_fix_column_names", "status": "completed", "note": "All columns already had correct naming"}');
