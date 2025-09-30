// Test default enrollment flow access
async function testDefaultEnrollmentFlow() {
  const enrollmentUrl = "https://identity.marcoby.com/if/flow/default-enrollment-flow/?next=%2Fnexus%2Fdashboard";
  
  console.log('🔗 Testing Default Enrollment Flow Access...');
  console.log('📧 Enrollment URL:', enrollmentUrl);
  console.log('\n📋 Instructions:');
  console.log('1. Open this URL in your browser:');
  console.log('   ' + enrollmentUrl);
  console.log('\n2. You should see the default enrollment flow (no login required)');
  console.log('3. The flow should start with welcome message');
  console.log('4. Follow the enrollment process to create a new account');
  
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
      console.log('✅ Default enrollment flow is accessible!');
    } else if (response.status === 302 || response.status === 301) {
      console.log('🔄 Default enrollment flow redirecting (normal for flows)');
    } else {
      console.log('❌ Default enrollment flow not accessible');
    }
    
  } catch (error) {
    console.log('⚠️ Could not test URL directly (CORS/security restrictions)');
    console.log('💡 This is normal - you need to test in a browser');
  }
}

// Run enrollment test
async function runDefaultEnrollmentTest() {
  console.log('🧪 Testing Default Enrollment Flow Access...\n');
  
  await testDefaultEnrollmentFlow();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Visit the enrollment URL in your browser');
  console.log('2. Complete the enrollment process');
  console.log('3. Verify the flow works correctly');
  console.log('4. Check if new users can be created successfully');
  
  console.log('\n🏁 Default enrollment test completed!');
}

runDefaultEnrollmentTest();
