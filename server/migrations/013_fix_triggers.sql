-- Fix incorrect triggers that are calling the wrong function
-- These triggers should call update_updated_at_column() instead of update_user_profiles_updated_at()

-- Drop and recreate all incorrect triggers
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_personal_thoughts_updated_at ON personal_thoughts;
CREATE TRIGGER trigger_update_personal_thoughts_updated_at
    BEFORE UPDATE ON personal_thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_deals_updated_at ON deals;
CREATE TRIGGER trigger_update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log the fix
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "013_fix_triggers", "triggers_fixed": 5, "status": "completed"}');
