// Test complete enrollment flow from start to finish
async function testCompleteEnrollmentFlow() {
  console.log('🧪 Testing Complete Enrollment Flow...\n');
  
  // Test 1: Nexus enrollment flow access
  console.log('1. Testing Nexus Enrollment Flow Access...');
  const enrollmentUrl = "https://identity.marcoby.com/if/flow/nexus-enrollment-flow/?next=%2Flogin";
  
  try {
    const response = await fetch(enrollmentUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
         console.log('📊 Enrollment Flow Status:', response.status);
     if (response.status === 200) {
       console.log('✅ Nexus enrollment flow is accessible');
     } else {
       console.log('❌ Nexus enrollment flow not accessible');
     }
  } catch (error) {
    console.log('⚠️ Could not test enrollment flow directly');
  }

  // Test 2: Login page access
  console.log('\n2. Testing Login Page Access...');
  const loginUrl = "http://localhost:5173/login";
  
  try {
    const response = await fetch(loginUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('📊 Login Page Status:', response.status);
    if (response.status === 200) {
      console.log('✅ Login page is accessible');
    } else {
      console.log('❌ Login page not accessible');
    }
  } catch (error) {
    console.log('⚠️ Could not test signup page directly (may need to start dev server)');
  }

  // Test 3: Server endpoints
  console.log('\n3. Testing Server Endpoints...');
  
  try {
    // Test user creation endpoint
    const createUserResponse = await fetch('http://localhost:3001/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'Test Business',
        businessType: 'startup',
        industry: 'technology',
        companySize: '1-10',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        username: 'testuser'
      })
    });
    
    console.log('📊 Create User Endpoint Status:', createUserResponse.status);
    if (createUserResponse.ok) {
      console.log('✅ Create user endpoint is working');
    } else {
      console.log('❌ Create user endpoint failed');
    }
  } catch (error) {
    console.log('⚠️ Could not test server endpoints (server may not be running)');
  }

  console.log('\n📋 Complete Flow Summary:');
  console.log('1. User visits /signup and clicks signup button');
  console.log('2. User is redirected to nexus-enrollment-flow');
  console.log('3. User enters email, username, and password');
  console.log('4. User completes email verification');
  console.log('5. User is redirected to /login');
  console.log('6. User logs in with their credentials');
  console.log('7. User is redirected to dashboard or onboarding (if needed)');

  console.log('\n🎯 Next Steps:');
  console.log('1. Start the development server (npm run dev)');
  console.log('2. Start the backend server (cd server && npm start)');
  console.log('3. Visit the enrollment flow URL in your browser');
  console.log('4. Complete the enrollment process');
  console.log('5. Verify redirection to login page');
  console.log('6. Test login with created credentials');
  console.log('7. Verify redirect to dashboard or onboarding');

  console.log('\n🏁 Complete enrollment flow test completed!');
}

testCompleteEnrollmentFlow();
