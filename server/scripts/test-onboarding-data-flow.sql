-- Test Onboarding Data Flow
-- This script tests the complete data flow from form submission to database storage

-- Test user ID (replace with actual user ID for testing)
DO $$
DECLARE
    test_user_id VARCHAR := 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    test_step_id VARCHAR := 'core-identity-priorities';
    test_data JSONB;
BEGIN
    -- Test data that would come from the updated onboarding form
    test_data := '{
        "userId": "' || test_user_id || '",
        "firstName": "Von",
        "lastName": "Jackson", 
        "email": "von.jackson@marcoby.com",
        "jobTitle": "CEO",
        "phone": "+1 (555) 123-4567",
        "displayName": "Von Jackson",
        "company": "Marcoby",
        "industry": "technology",
        "companySize": "1-10 employees",
        "keyPriorities": ["Improve efficiency", "Automate processes", "Better decision making"]
    }'::jsonb;

    -- Test 1: Insert step data (simulates saveStep call)
    INSERT INTO user_onboarding_steps (user_id, step_id, step_data, completed_at)
    VALUES (test_user_id, test_step_id, test_data, NOW())
    ON CONFLICT (user_id, step_id) 
    DO UPDATE SET 
        step_data = EXCLUDED.step_data,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();

    RAISE NOTICE '✅ Test 1: Step data inserted/updated successfully';

    -- Test 2: Verify step data was saved
    IF EXISTS (
        SELECT 1 FROM user_onboarding_steps 
        WHERE user_id = test_user_id 
        AND step_id = test_step_id
    ) THEN
        RAISE NOTICE '✅ Test 2: Step data verification passed';
    ELSE
        RAISE NOTICE '❌ Test 2: Step data verification failed';
    END IF;

    -- Test 3: Verify all required fields are present
    IF (
        SELECT step_data->>'email' IS NOT NULL 
        AND step_data->>'firstName' IS NOT NULL 
        AND step_data->>'lastName' IS NOT NULL 
        AND step_data->>'company' IS NOT NULL
        FROM user_onboarding_steps 
        WHERE user_id = test_user_id 
        AND step_id = test_step_id
    ) THEN
        RAISE NOTICE '✅ Test 3: Required fields verification passed';
    ELSE
        RAISE NOTICE '❌ Test 3: Required fields verification failed';
    END IF;

    -- Test 4: Verify new fields (jobTitle, phone) are present
    IF (
        SELECT step_data->>'jobTitle' IS NOT NULL 
        AND step_data->>'phone' IS NOT NULL
        FROM user_onboarding_steps 
        WHERE user_id = test_user_id 
        AND step_id = test_step_id
    ) THEN
        RAISE NOTICE '✅ Test 4: New fields (jobTitle, phone) verification passed';
    ELSE
        RAISE NOTICE '❌ Test 4: New fields verification failed';
    END IF;

END $$;

-- Display the test results
SELECT 
    user_id,
    step_id,
    step_data->>'firstName' as first_name,
    step_data->>'lastName' as last_name,
    step_data->>'email' as email,
    step_data->>'jobTitle' as job_title,
    step_data->>'phone' as phone,
    step_data->>'company' as company,
    step_data->>'industry' as industry,
    step_data->>'companySize' as company_size,
    completed_at
FROM user_onboarding_steps 
WHERE user_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3'
AND step_id = 'core-identity-priorities';
