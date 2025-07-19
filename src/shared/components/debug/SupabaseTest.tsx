import { useState, useEffect } from 'react';
import { supabase, authUtils, dbUtils } from '@/core/supabase';

export function SupabaseTest() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authUtils.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestResult('Testing connection...');
      
      // Test basic query
      const { data, error } = await supabase
        .from('service_health')
        .select('*')
        .limit(1);

      if (error) {
        setTestResult(`❌ Connection failed: ${error.message}`);
        return;
      }

      setTestResult(`✅ Connection successful! Found ${data?.length || 0} records`);
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    }
  };

  const testUserData = async () => {
    if (!user) {
      setTestResult('❌ No authenticated user');
      return;
    }

    try {
      setTestResult('Testing user data access...');

      // Test user-specific query
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .limit(5);

      if (error) {
        setTestResult(`❌ User data access failed: ${error.message}`);
        return;
      }

      setTestResult(`✅ User data access successful! Found ${data?.length || 0} debug logs`);
    } catch (error) {
      setTestResult(`❌ User data test failed: ${error}`);
    }
  };

  const createTestTask = async () => {
    if (!user) {
      setTestResult('❌ No authenticated user');
      return;
    }

    try {
      setTestResult('Creating test task...');

      const newTask = await dbUtils.safeInsert('tasks', {
        title: `Test Task ${Date.now()}`,
        description: 'This is a test task created by the Supabase test component',
        user_id: user.id,
        status: 'pending',
        priority: 'medium'
      });

      setTestResult(`✅ Test task created successfully! ID: ${newTask.id}`);
      
      // Refresh tasks list
      loadTasks();
    } catch (error) {
      setTestResult(`❌ Failed to create task: ${error}`);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to load tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔍 Supabase Connection Test</h2>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">🔍 Supabase Connection Test</h2>
      
      <div className="space-y-2">
        <div className="text-sm">
          <strong>User:</strong> {user ? user.email : 'Not authenticated'}
        </div>
        <div className="text-sm">
          <strong>User ID:</strong> {user?.id || 'N/A'}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Database Connection
        </button>

        <button
          onClick={testUserData}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Test User Data Access
        </button>

        <button
          onClick={createTestTask}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-2"
        >
          Create Test Task
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-white rounded border">
          <strong>Test Result:</strong> {testResult}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Recent Tasks:</h3>
          <div className="space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className="p-2 bg-white rounded border text-sm">
                <div className="font-medium">{task.title}</div>
                <div className="text-gray-600">{task.description}</div>
                <div className="text-xs text-gray-500">
                  Status: {task.status} | Priority: {task.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 mt-4">
        <strong>Available Tables:</strong> user_profiles, activities, user_licenses, 
        chat_usage_tracking, ai_action_card_templates, audit_log_events, recents, 
        pins, tasks, notifications, communication_events, company_status, debug_logs, 
        analytics_events, realtime_sync_events, service_health
      </div>
    </div>
  );
} 