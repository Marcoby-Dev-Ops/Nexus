import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';

export function TestAuth() {
  const { user, loading, signIn, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useUser(user?.id);

  const testDirectQuery = async () => {
    try {
      console.log('🧪 Testing direct Supabase query...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      console.log('✅ Direct query result:', { data, error });
      
      if (error) {
        console.error('❌ Direct query failed:', error);
      } else {
        console.log('✅ Direct query successful:', data);
      }
    } catch (error) {
      console.error('❌ Direct query exception:', error);
    }
  };

  const testSession = async () => {
    try {
      console.log('🧪 Testing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('✅ Session test result:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        email: session?.user?.email,
        error 
      });
    } catch (error) {
      console.error('❌ Session test failed:', error);
    }
  };

  if (loading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="space-y-4">
        {/* Auth Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">Auth Status</h2>
          <p>User: {user ? user.email : 'Not signed in'}</p>
          <p>User ID: {user?.id || 'N/A'}</p>
          <p>Authenticated: {user ? 'Yes' : 'No'}</p>
        </div>

        {/* Profile Data */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">Profile Data</h2>
          {profileLoading ? (
            <p>Loading profile...</p>
          ) : profileError ? (
            <div className="text-red-600">
              <p>Error: {profileError.message}</p>
            </div>
          ) : profile ? (
            <div>
              <p>Name: {profile.first_name} {profile.last_name}</p>
              <p>Email: {profile.email}</p>
              <p>Role: {profile.role}</p>
            </div>
          ) : (
            <p>No profile found</p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">Test Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={testSession}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Session
            </button>
            <button 
              onClick={testDirectQuery}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Direct Query
            </button>
            {user ? (
              <button 
                onClick={signOut}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => signIn('vonj@marcoby.com', 'password123')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Console Instructions */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-semibold mb-2">Debug Instructions</h2>
          <p>Open browser console and run:</p>
          <code className="block bg-gray-100 p-2 rounded text-sm">
            window.testAuth()
          </code>
        </div>
      </div>
    </div>
  );
} 