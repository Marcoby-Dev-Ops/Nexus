// Load environment variables
require('./loadEnv');

async function testEnrollmentFlow() {
  console.log('🔍 Testing Authentik Enrollment Flow Configuration...\n');
  console.log('Using API Token:', process.env.AUTHENTIK_API_TOKEN ? '✅ Set' : '❌ Not set');
  console.log('Base URL:', process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com');
  console.log('');

  try {
    // Test 1: Check if flows endpoint is accessible
    console.log('1. Testing Authentik API connectivity...');
    const flowsResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/api/v3/core/flows/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (flowsResponse.ok) {
      const flows = await flowsResponse.json();
      console.log('✅ Authentik API is accessible');
      console.log(`📊 Found ${flows.results?.length || 0} flows`);
      
      // Look for enrollment flows
      const enrollmentFlows = flows.results?.filter(flow => 
        flow.designation === 'enrollment' || 
        flow.slug?.includes('enrollment') ||
        flow.name?.toLowerCase().includes('enrollment')
      ) || [];
      
      console.log(`📧 Found ${enrollmentFlows.length} enrollment flows:`);
      enrollmentFlows.forEach(flow => {
        console.log(`   - ${flow.name} (${flow.slug}) - ${flow.designation}`);
      });

      // Look specifically for nexus-enrollment
      const nexusFlow = flows.results?.find(flow => 
        flow.slug === 'nexus-enrollment' || 
        flow.name?.toLowerCase().includes('nexus')
      );
      
      if (nexusFlow) {
        console.log(`\n🎯 Found nexus enrollment flow:`);
        console.log(`   Name: ${nexusFlow.name}`);
        console.log(`   Slug: ${nexusFlow.slug}`);
        console.log(`   Designation: ${nexusFlow.designation}`);
        console.log(`   Stages: ${nexusFlow.stages?.length || 0} stages`);
      }
    } else {
      console.log('❌ Cannot access Authentik API');
      console.log('   Status:', flowsResponse.status);
      console.log('   Response:', await flowsResponse.text());
    }

    // Test 2: Check email providers
    console.log('\n2. Testing email provider configuration...');
    const emailResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/api/v3/providers/email/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (emailResponse.ok) {
      const emailProviders = await emailResponse.json();
      console.log('✅ Email providers endpoint accessible');
      console.log(`📧 Found ${emailProviders.results?.length || 0} email providers`);
      
      emailProviders.results?.forEach(provider => {
        console.log(`   - ${provider.name} (${provider.host}:${provider.port})`);
      });
    } else {
      console.log('❌ Cannot access email providers');
      console.log('   Status:', emailResponse.status);
      console.log('   Response:', await emailResponse.text());
    }

    // Test 3: Check stages
    console.log('\n3. Testing flow stages...');
    const stagesResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com'}/api/v3/stages/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (stagesResponse.ok) {
      const stages = await stagesResponse.json();
      console.log('✅ Stages endpoint accessible');
      console.log(`🔧 Found ${stages.results?.length || 0} stages`);
      
      // Look for email and user write stages
      const emailStages = stages.results?.filter(stage => 
        stage.type === 'ak-stage-email' || 
        stage.name?.toLowerCase().includes('email')
      ) || [];
      
      const userWriteStages = stages.results?.filter(stage => 
        stage.type === 'ak-stage-user-write' || 
        stage.name?.toLowerCase().includes('user write')
      ) || [];
      
      console.log(`📧 Email stages: ${emailStages.length}`);
      emailStages.forEach(stage => {
        console.log(`   - ${stage.name} (${stage.type})`);
      });
      
      console.log(`✍️ User write stages: ${userWriteStages.length}`);
      userWriteStages.forEach(stage => {
        console.log(`   - ${stage.name} (${stage.type})`);
      });
    } else {
      console.log('❌ Cannot access stages');
      console.log('   Status:', stagesResponse.status);
      console.log('   Response:', await stagesResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnrollmentFlow();
