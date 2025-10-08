async function testEmailVerification() {
  const testData = {
    businessName: "Test Business",
    firstName: "Test",
    lastName: "User", 
    email: "test@example.com",
    businessType: "startup",
    industry: "technology",
    companySize: "1-10"
  };

  try {
    console.log('Testing user creation and email verification...');
    
    const response = await fetch('http://localhost:3001/api/auth/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ User created successfully');
      console.log('User ID:', result.userId);
      console.log('Username:', result.username);
      console.log('\n📧 Check if email verification was triggered...');
    } else {
      console.log('❌ User creation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function checkAuthentikFlows() {
  try {
    console.log('\n🔍 Checking Authentik flows...');
    
    // This would need the AUTHENTIK_API_TOKEN environment variable
    const response = await fetch('https://identity.marcoby.com/api/v3/core/flows/', {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const flows = await response.json();
      console.log('Available flows:', JSON.stringify(flows, null, 2));
    } else {
      console.log('Failed to fetch flows:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Failed to check flows:', error.message);
  }
}

// Run both tests
testEmailVerification();
// checkAuthentikFlows(); // Uncomment if you have AUTHENTIK_API_TOKEN set
