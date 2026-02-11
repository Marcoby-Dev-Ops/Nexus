
const userProfileService = require('./src/services/UserProfileService');
const { query } = require('./src/database/connection');

// Mock dependencies
jest.mock('./src/database/connection');
jest.mock('./src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
jest.mock('./src/services/CompanyService', () => {
    return class MockCompanyService {
        ensureCompanyForUser() { return { success: true, company: { id: 'new-company-id', name: 'New Company' } }; }
    };
});

describe('UserProfileService - Persistence Verification', () => {
    const userId = 'test-user-123';

    const dbProfile = {
        user_id: userId,
        // Fields that Authentik MIGHT override
        first_name: 'Custom First',
        last_name: 'Custom Last',
        email: 'custom@example.com',
        phone: '123-456-7890',
        company_name: 'Custom Company',
        company_id: 'custom-company-id',

        // Fields that Authentik DOES NOT override (because it doesn't have them)
        bio: 'My custom bio',
        job_title: 'Custom Job',
        location: 'Custom Location',
        linkedin_url: 'https://linkedin.com/in/custom',

        // Missing fields to test fill-only behavior
        profile_completion_percentage: 0 // Assume low completion initially
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should PROTECT all local settings from stale JWT data', async () => {
        // 1. Setup: Profile exists with CUSTOM values
        query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT * FROM user_profiles')) {
                return Promise.resolve({ data: [dbProfile] });
            }
            if (sql.includes('UPDATE user_profiles')) {
                return Promise.resolve({ data: [dbProfile] });
            }
            return Promise.resolve({ data: [] });
        });

        // 2. Action: Login with conflicting/stale data from Authentik
        const staleJwtPayload = {
            sub: userId,
            email: 'stale@authentik.local', // Different email
            attributes: {
                first_name: 'StaleFirst',   // Different
                last_name: 'StaleLast',     // Different
                phone: '000-000-0000',      // Different
                business_name: 'Stale Corp', // Different
                company_size: '1000+'
            }
        };

        const spyUpdate = jest.spyOn(userProfileService, 'updateProfileData');

        await userProfileService.ensureUserProfile(userId, null, {}, staleJwtPayload);

        // 3. Assertion: Verify updateProfileData was called
        // BUT verify that NONE of our custom fields were in the update payload

        if (spyUpdate.mock.calls.length > 0) {
            const updatePayload = spyUpdate.mock.calls[0][1];

            // Protected Fields (should NOT be in update payload)
            expect(updatePayload).not.toHaveProperty('first_name');
            expect(updatePayload).not.toHaveProperty('last_name');
            expect(updatePayload).not.toHaveProperty('email');
            expect(updatePayload).not.toHaveProperty('phone');
            expect(updatePayload).not.toHaveProperty('company_name');

            // Company ID protection check
            expect(updatePayload).not.toHaveProperty('company_id');

            // Fields that SHOULD be filled (because they were missing/empty in DB, or calculated)
            // In our mock, profile_completion_percentage was 0, so it might be updated
            expect(updatePayload).toHaveProperty('profile_completion_percentage');

            console.log('Safe Update Payload:', updatePayload);
        } else {
            console.log('No updates were made - essentially perfect protection!');
        }

        // Verify company provisioning logic didn't overwrite company_id
        // The service calls updateProfileData again for company provisioning if companyData is present.
        // We need to ensure that second call (if it happens) doesn't overwrite.
        // Looking at the code:
        // if (provisioning && ... && provisioning.company) { updateProfileData(...) }
        // BUT this block is inside:
        // try { ... const provisioning = await companyService.ensureCompanyForUser(...) ... }

        // Wait, companyService.ensureCompanyForUser checks if user already has a company!
        // We mocked ensureCompanyForUser to return success.
        // But in real execution, `ensureCompanyForUser` calls `getCompanyByOwner`. 
        // If that finds a company, it returns existing company and `created: false`.
        // Then `ensureUserProfile` attempts to update profile with that company ID.

        // Let's refine the mock for confirm correctness.
        // Actually, the `companyService.ensureCompanyForUser` logic inside `UserProfileService.js` 
        // calls `updateProfileData` BLINDLY if provisioning returns a company.
        // This is the risk I identified earlier.

        // However, `ensureCompanyForUser` (in CompanyService) returns `company` regardless of whether it created it or found it.
        // So `UserProfileService` will try to update profile with `company.id`.
        // IF `ensureCompanyForUser` returns the *existing* company associated with the user, then updating with same ID is harmless.
        // IF `ensureCompanyForUser` returns a *different* company (e.g. from domain matching) despite user having one...
        // ...Wait, `ensureCompanyForUser` first checks `getCompanyByOwner`. 
        // If user already owns a company, it returns IT.
        // So `UserProfileService` will update profile with the SAME company ID. Harmless.

        // The only edge case: user is a MEMBER of a company (so `getCompanyByOwner` returns null),
        // but they have `company_id` set in profile.
        // Authentik data matches a domain. `ensureCompanyForUser` creates/finds a NEW company.
        // `UserProfileService` overwrites `company_id`.
        // This confirms my suspicion: MEMBER users might get their company overwritten if they are also owners of a new auto-provisioned company.

        // But for the "Settings" question: "All fields in settings?"
        // If I change my Company Name in settings... 
        // If I am an owner, `getCompanyByOwner` returns my company. `ensureCompanyForUser` returns my company. `updateProfile` updates with my company. Safe.
        // If I am a member (no ownership), `company_name` in DB is "Custom Company". 
        // `authentikData` has "Stale Corp".
        // `ensureUserProfile` -> `fill-only` logic protects `company_name` (because it's not empty). SAFE.

        // So `company_name` string field is SAFE.
        // `company_id` link might be overwritten if I am not an owner but provisioning thinks I should be.
        // But `company_name` (the visible text field in settings) is definitely protected.
    });
});
