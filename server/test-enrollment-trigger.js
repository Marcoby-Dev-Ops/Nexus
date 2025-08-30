require('dotenv').config();

async function testEnrollmentTrigger() {
  console.log('🔍 Testing Enrollment Flow Trigger...\n');

  try {
    // Test 1: Try to trigger enrollment flow for an existing user
    console.log('1. Testing enrollment flow trigger...');
    
    // First, let's get a list of users
    const usersResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL}/api/v3/core/users/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Found ${users.results?.length || 0} users`);
      
      if (users.results && users.results.length > 0) {
        const testUser = users.results[0];
        console.log(`📧 Testing with user: ${testUser.username} (${testUser.email})`);
        
        // Try to trigger enrollment flow
        const enrollmentResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL}/api/v3/flows/executor/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flow_slug: 'nexus-enrollment',
            user: testUser.pk
          }),
        });

        if (enrollmentResponse.ok) {
          const enrollmentResult = await enrollmentResponse.json();
          console.log('✅ Enrollment flow triggered successfully');
          console.log('Result:', JSON.stringify(enrollmentResult, null, 2));
        } else {
          console.log('❌ Failed to trigger enrollment flow');
          console.log('Status:', enrollmentResponse.status);
          console.log('Response:', await enrollmentResponse.text());
        }
      }
    } else {
      console.log('❌ Cannot access users');
      console.log('Status:', usersResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnrollmentTrigger();
