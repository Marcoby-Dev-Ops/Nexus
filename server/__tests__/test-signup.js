// Test signup for vjackson601@gmail.com
async function testSignup() {
  const signupData = {
    businessName: "Von's Test Business",
    businessType: "startup",
    industry: "technology",
    companySize: "1-10",
    firstName: "Von",
    lastName: "Jackson",
    email: "vjackson601@gmail.com",
    phone: "+1 (555) 123-4567",
    fundingStage: "bootstrap",
    revenueRange: "0-100k",
    username: "vjackson601" // Optional, will be generated if not provided
  };

  try {
    console.log('🚀 Testing signup for:', signupData.email);
    console.log('📝 Signup data:', JSON.stringify(signupData, null, 2));

    const response = await fetch('http://localhost:3001/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const result = await response.json();

    console.log('\n📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📄 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Signup successful!');
      console.log('👤 User ID:', result.userId);
      console.log('🔑 Username:', result.username);
      console.log('🔗 Enrollment URL:', result.enrollmentUrl);
      console.log('\n📧 Next steps:');
      console.log('1. Check if user was created in Authentik admin');
      console.log('2. Visit the enrollment URL to complete email verification');
      console.log('3. Check email for verification link');
    } else {
      console.log('\n❌ Signup failed!');
      console.log('🚨 Error:', result.error);
    }

  } catch (error) {
    console.error('\n💥 Network/Server Error:', error.message);
  }
}

// Test user existence check
async function checkUserExists(email) {
  try {
    console.log('\n🔍 Checking if user exists:', email);
    
    const response = await fetch(`http://localhost:3001/api/auth/check-user/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('📊 User exists check result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('💥 Error checking user existence:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting signup flow tests...\n');
  
  // First check if user already exists
  await checkUserExists('vjackson601@gmail.com');
  
  // Then attempt signup
  await testSignup();
  
  console.log('\n🏁 Tests completed!');
}

runTests();
