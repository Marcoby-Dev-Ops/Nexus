// Test enrollment flow access
async function testEnrollmentFlow() {
  const enrollmentUrl = "https://identity.marcoby.com/if/flow/nexus-enrollment/?next=%2Fnexus%2Fdashboard";
  
  console.log('🔗 Testing enrollment flow access...');
  console.log('📧 Enrollment URL:', enrollmentUrl);
  console.log('\n📋 Instructions:');
  console.log('1. Open this URL in your browser:');
  console.log('   ' + enrollmentUrl);
  console.log('\n2. You should see the enrollment flow (no login required)');
  console.log('3. The flow should start with email verification');
  console.log('4. Check if vjackson601@gmail.com receives an email');
  console.log('\n🔍 Expected Flow:');
  console.log('- Welcome message (Order 0)');
  console.log('- Email verification (Order 1) - should send email to vjackson601@gmail.com');
  console.log('- User data collection (Order 2)');
  console.log('- Login/activation (Order 3)');
  
  // Test if the URL is accessible
  try {
    console.log('\n🌐 Testing URL accessibility...');
    const response = await fetch(enrollmentUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ Enrollment flow is accessible!');
    } else if (response.status === 302 || response.status === 301) {
      console.log('🔄 Enrollment flow redirecting (normal for flows)');
    } else {
      console.log('❌ Enrollment flow not accessible');
    }
    
  } catch (error) {
    console.log('⚠️ Could not test URL directly (CORS/security restrictions)');
    console.log('💡 This is normal - you need to test in a browser');
  }
}

// Check user status
async function checkUserStatus() {
  try {
    console.log('\n👤 Checking user status...');
    
    const response = await fetch('http://localhost:3001/api/auth/check-user/vjackson601@gmail.com', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('📊 User exists:', result.exists);
    
    if (result.exists) {
      console.log('✅ User vjackson601@gmail.com exists in system');
      console.log('📧 Ready for email verification via enrollment flow');
    } else {
      console.log('❌ User not found - may need to recreate');
    }

  } catch (error) {
    console.error('💥 Error checking user status:', error.message);
  }
}

// Run enrollment test
async function runEnrollmentTest() {
  console.log('🧪 Testing Enrollment Flow Access...\n');
  
  await checkUserStatus();
  await testEnrollmentFlow();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Visit the enrollment URL in your browser');
  console.log('2. Complete the email verification step');
  console.log('3. Check vjackson601@gmail.com for verification email');
  console.log('4. Verify the user becomes active in Authentik admin');
  
  console.log('\n🏁 Enrollment test completed!');
}

runEnrollmentTest();

