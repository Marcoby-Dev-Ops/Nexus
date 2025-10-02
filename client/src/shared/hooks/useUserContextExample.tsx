/**
 * Example: How to use the new UserContext
 * 
 * This file shows how to replace existing user profile calls with the new UserContext.
 * The UserContext provides centralized user data with caching and reduces redundant API calls.
 */

import { useUserContext, useUserProfile, useUserCompany, useUserPreferences } from '@/shared/contexts/UserContext';
import { getIndustryLabel } from '@/lib/identity/industry-options';

// Example 1: Using the full UserContext
export const ExampleUserComponent = () => {
  const { 
    profile, 
    company, 
    loading, 
    error, 
    userDisplayName,
    refreshProfile,
    updateProfile 
  } = useUserContext();

  if (loading) return <div>Loading user data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {userDisplayName}!</h1>
      <p>Role: {profile?.role}</p>
      <p>Company: {company?.name}</p>
      <button onClick={refreshProfile}>Refresh Profile</button>
    </div>
  );
};

// Example 2: Using specific hooks for better performance
export const ExampleProfileComponent = () => {
  const { profile, loading, error, updateProfile } = useUserProfile();

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Profile error: {error}</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {profile?.full_name}</p>
      <p>Email: {profile?.email}</p>
      <p>Department: {profile?.department}</p>
    </div>
  );
};

// Example 3: Using company data
export const ExampleCompanyComponent = () => {
  const { company, loading, error } = useUserCompany();

  if (loading) return <div>Loading company...</div>;
  if (error) return <div>Company error: {error}</div>;

  return (
    <div>
      <h2>Company</h2>
      <p>Name: {company?.name}</p>
  <p>Industry: {getIndustryLabel(company?.industry)}</p>
      <p>Size: {company?.size}</p>
    </div>
  );
};

// Example 4: Using preferences
export const ExamplePreferencesComponent = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleThemeChange = (theme: string) => {
    updatePreferences({ theme });
  };

  return (
    <div>
      <h2>Preferences</h2>
      <p>Current theme: {preferences.theme || 'default'}</p>
      <button onClick={() => handleThemeChange('dark')}>Dark Theme</button>
      <button onClick={() => handleThemeChange('light')}>Light Theme</button>
    </div>
  );
};

// Example 5: Replacing existing useUser calls
// Before:
// const { user } = useUser();
// const [profile, setProfile] = useState(null);
// useEffect(() => {
//   if (user?.id) {
//     // Direct API call
//     userService.get(user.id).then(result => {
//       setProfile(result.data);
//     });
//   }
// }, [user?.id]);

// After:
export const ExampleReplacementComponent = () => {
  const { profile, loading } = useUserProfile();
  
  // No need for useState or useEffect - UserContext handles everything!
  // No need for direct API calls - UserContext caches and manages data!

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {profile?.full_name}</p>
      <p>Role: {profile?.role}</p>
    </div>
  );
};

/**
 * Benefits of using UserContext:
 * 
 * 1. **Reduced API Calls**: Data is cached for 5 minutes, preventing duplicate requests
 * 2. **Centralized State**: All user data in one place
 * 3. **Automatic Loading States**: Built-in loading and error handling
 * 4. **Type Safety**: Full TypeScript support
 * 5. **Performance**: Only re-renders when relevant data changes
 * 6. **Error Handling**: Graceful fallbacks and error recovery
 * 7. **Consistency**: Same data across all components
 * 
 * Migration Steps:
 * 
 * 1. Replace direct useUser() calls with useUserContext()
 * 2. Replace direct API calls with UserContext hooks
 * 3. Remove local state management for user data
 * 4. Use the convenience hooks (useUserProfile, useUserCompany, useUserPreferences)
 * 5. Update components to use the centralized loading and error states
 */
