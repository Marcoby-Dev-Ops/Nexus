
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
        ensureCompanyForUser() { return { success: true }; }
    };
});

describe('UserProfileService - Overwrite Reproduction', () => {
    const userId = 'test-user-123';
    const initialProfile = {
        user_id: userId,
        first_name: 'Original',
        last_name: 'Name',
        email: 'test@example.com',
        bio: 'My custom bio',
        role: 'user'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should overwrite local changes with stale JWT data', async () => {
        // 1. Setup: Existing profile in DB has custom bio
        query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT * FROM user_profiles')) {
                return Promise.resolve({ data: [initialProfile] });
            }
            if (sql.includes('UPDATE user_profiles')) {
                // Return the "updated" profile (simulating the overwrite)
                return Promise.resolve({ data: [{ ...initialProfile, ...params[1] }] }); // roughly mocking
            }
            return Promise.resolve({ data: [] });
        });

        // 2. Action: Call ensureUserProfile with a JWT that lacks the bio or has old data
        const staleJwtPayload = {
            sub: userId,
            email: 'test@example.com',
            attributes: {
                first_name: 'Authentik', // Different from DB
                last_name: 'Name'
            }
            // Note: No bio in JWT, or just standard fields
        };

        // We verify if updateProfileData is called with fields that might overwrite
        const spyUpdate = jest.spyOn(userProfileService, 'updateProfileData');

        await userProfileService.ensureUserProfile(userId, null, {}, staleJwtPayload);

        // 3. Assertion: Verify that updateProfileData was NOT called with first_name (preserved)
        // But WAS called with profile_completion_percentage (filled)
        expect(spyUpdate).toHaveBeenCalledWith(
            userId,
            expect.not.objectContaining({
                first_name: 'Authentik'
            }),
            staleJwtPayload
        );

        expect(spyUpdate).toHaveBeenCalledWith(
            userId,
            expect.objectContaining({
                profile_completion_percentage: 43
            }),
            staleJwtPayload
        );

        console.log('Update called with:', spyUpdate.mock.calls[0][1]);
    });
});
