require('dotenv').config();

async function checkStages() {
  console.log('🔍 Checking Authentik Configuration...\n');

  try {
    // Check stages
    console.log('1. Checking stages...');
    const stagesResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL}/api/v3/stages/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (stagesResponse.ok) {
      const stages = await stagesResponse.json();
      console.log(`✅ Found ${stages.results?.length || 0} stages`);
      
      // Look for default-source-enrollment-write
      const enrollmentWriteStage = stages.results?.find(stage => 
        stage.slug === 'default-source-enrollment-write' || 
        stage.name?.toLowerCase().includes('enrollment-write')
      );
      
      if (enrollmentWriteStage) {
        console.log(`\n🎯 Found enrollment write stage:`);
        console.log(`   Name: ${enrollmentWriteStage.name}`);
        console.log(`   Slug: ${enrollmentWriteStage.slug}`);
        console.log(`   Type: ${enrollmentWriteStage.type}`);
      }
      
      // Check for email stages
      const emailStages = stages.results?.filter(stage => 
        stage.type === 'ak-stage-email'
      ) || [];
      
      console.log(`\n📧 Email stages: ${emailStages.length}`);
      emailStages.forEach(stage => {
        console.log(`   - ${stage.name} (${stage.slug})`);
      });
    } else {
      console.log('❌ Cannot access stages');
    }

    // Check flows
    console.log('\n2. Checking flows...');
    const flowsResponse = await fetch(`${process.env.AUTHENTIK_BASE_URL}/api/v3/core/flows/`, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTHENTIK_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (flowsResponse.ok) {
      const flows = await flowsResponse.json();
      console.log(`✅ Found ${flows.results?.length || 0} flows`);
      
      // Look for enrollment flows
      const enrollmentFlows = flows.results?.filter(flow => 
        flow.designation === 'enrollment'
      ) || [];
      
      console.log(`\n📧 Enrollment flows: ${enrollmentFlows.length}`);
      enrollmentFlows.forEach(flow => {
        console.log(`   - ${flow.name} (${flow.slug})`);
        console.log(`     Stages: ${flow.stages?.length || 0}`);
      });
    } else {
      console.log('❌ Cannot access flows');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkStages();
