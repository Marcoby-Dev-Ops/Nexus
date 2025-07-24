#!/usr/bin/env node

/**
 * Script to insert sample email data for testing email intelligence
 * Run with: node scripts/insert-sample-emails.js
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertSampleEmails() {
  try {
    console.log('Starting to insert sample email data...');

    // First, let's get the user integration ID for Gmail
    const { data: integrations, error: integrationError } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('integration_name', 'Gmail')
      .limit(1);

    if (integrationError) {
      console.error('Error fetching user integration:', integrationError);
      return;
    }

    if (!integrations || integrations.length === 0) {
      console.error('No Gmail integration found. Please set up a Gmail integration first.');
      return;
    }

    const userIntegrationId = integrations[0].id;

    // Get the data point definition ID for email
    const { data: dataPoints, error: dataPointError } = await supabase
      .from('data_point_definitions')
      .select('id')
      .eq('data_point_name', 'email')
      .limit(1);

    if (dataPointError) {
      console.error('Error fetching data point definition:', dataPointError);
      return;
    }

    if (!dataPoints || dataPoints.length === 0) {
      console.error('No email data point definition found. Please create one first.');
      return;
    }

    const dataPointDefinitionId = dataPoints[0].id;

    // Sample email data
    const sampleEmails = [
      {
        external_id: 'email_001',
        data_content: {
          subject: 'Podcast Interview Opportunity',
          body: 'Hi there! I host a popular tech podcast called "Innovation Insights" and I would love to have you as a guest. Your work on AI and business automation is exactly what our audience is interested in. We have over 50,000 monthly listeners and would love to feature your insights. Would you be available for a 30-minute interview next week? Best regards, Sarah Johnson',
          sender: 'sarah.johnson@techpodcast.com',
          senderName: 'Sarah Johnson',
          receivedAt: '2024-01-15T10:30:00Z'
        },
        business_value: 'high'
      },
      {
        external_id: 'email_002',
        data_content: {
          subject: 'Media Interview Request',
          body: 'Hello! I am a journalist from TechCrunch and I am writing an article about the future of AI in business. I have been following your work and would love to include your perspective in my piece. Would you be available for a brief interview this week? The article will be published next month and could provide great exposure for your company. Thanks, Mike Chen',
          sender: 'mike.chen@techcrunch.com',
          senderName: 'Mike Chen',
          receivedAt: '2024-01-14T14:15:00Z'
        },
        business_value: 'high'
      },
      {
        external_id: 'email_003',
        data_content: {
          subject: 'Speaking Opportunity at AI Conference',
          body: 'Hi! I am organizing the upcoming AI Business Summit in San Francisco and I would love to have you as a keynote speaker. The event will have over 500 attendees from leading tech companies and investors. Your expertise in AI automation would be perfect for our main stage. The event is in March and we can offer a speaking fee plus travel expenses. Would you be interested? Best, Lisa Rodriguez',
          sender: 'lisa.rodriguez@aiconference.com',
          senderName: 'Lisa Rodriguez',
          receivedAt: '2024-01-13T09:45:00Z'
        },
        business_value: 'high'
      },
      {
        external_id: 'email_004',
        data_content: {
          subject: 'Partnership Discussion',
          body: 'Hello! I am the CEO of DataFlow Solutions and I have been impressed by your AI platform. I think there could be a great partnership opportunity between our companies. We have a large customer base that could benefit from your automation tools, and you could leverage our data processing capabilities. Would you be interested in discussing a potential collaboration? We could set up a call next week. Regards, David Kim',
          sender: 'david.kim@dataflowsolutions.com',
          senderName: 'David Kim',
          receivedAt: '2024-01-12T16:20:00Z'
        },
        business_value: 'high'
      },
      {
        external_id: 'email_005',
        data_content: {
          subject: 'Weekly Team Update',
          body: 'Hi team, Here is this week\'s update on our project progress. We have completed the user authentication module and are now working on the dashboard integration. The deadline is still on track for next month. Please let me know if you have any questions. Thanks, John',
          sender: 'john.smith@company.com',
          senderName: 'John Smith',
          receivedAt: '2024-01-11T11:00:00Z'
        },
        business_value: 'medium'
      }
    ];

    // Insert each email
    for (const email of sampleEmails) {
      const { data, error } = await supabase
        .from('integration_data')
        .insert({
          user_integration_id: userIntegrationId,
          data_type: 'email',
          external_id: email.external_id,
          data_content: email.data_content,
          processed_data: email.data_content,
          data_point_definition_id: dataPointDefinitionId,
          data_category: 'communication',
          business_value: email.business_value,
          refresh_frequency: 'realtime',
          is_required: true,
          validation_rules: { required_fields: ['subject', 'body', 'sender'] },
          sample_value: 'Sample email content'
        });

      if (error) {
        console.error(`Error inserting email ${email.external_id}:`, error);
      } else {
        console.log(`Successfully inserted email: ${email.external_id}`);
      }
    }

    console.log('Sample email data insertion completed!');
    console.log('You can now visit /email-intelligence to test the functionality.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
insertSampleEmails(); 