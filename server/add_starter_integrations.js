const { query } = require('./src/database/connection');

async function addStarterIntegrations() {
  try {
    console.log('Adding starter integrations...');
    
    const starterIntegrations = [
      // AI & Machine Learning
      {
        name: 'Google AI (Gemini)',
        type: 'ai',
        slug: 'google-ai',
        description: 'Google AI integration for Gemini models and AI services',
        config_schema: '{"api_key": "string", "model": "string", "temperature": "number"}'
      },
      
      // Communication & Collaboration
      {
        name: 'Discord',
        type: 'communication',
        slug: 'discord',
        description: 'Discord integration for team communication and notifications',
        config_schema: '{"webhook_url": "string", "bot_token": "string", "channel_id": "string"}'
      },
      {
        name: 'Microsoft Teams',
        type: 'communication',
        slug: 'microsoft-teams',
        description: 'Microsoft Teams integration for chat and notifications',
        config_schema: '{"webhook_url": "string", "tenant_id": "string", "client_id": "string"}'
      },
      {
        name: 'Zoom',
        type: 'communication',
        slug: 'zoom',
        description: 'Zoom integration for video meetings and webinars',
        config_schema: '{"api_key": "string", "api_secret": "string", "account_id": "string"}'
      },
      
      // CRM & Sales
      {
        name: 'Salesforce',
        type: 'crm',
        slug: 'salesforce',
        description: 'Salesforce CRM integration for customer management',
        config_schema: '{"instance_url": "string", "access_token": "string", "refresh_token": "string"}'
      },
      {
        name: 'Pipedrive',
        type: 'crm',
        slug: 'pipedrive',
        description: 'Pipedrive CRM integration for sales pipeline management',
        config_schema: '{"api_token": "string", "domain": "string"}'
      },
      {
        name: 'Zoho CRM',
        type: 'crm',
        slug: 'zoho-crm',
        description: 'Zoho CRM integration for customer relationship management',
        config_schema: '{"access_token": "string", "refresh_token": "string", "api_domain": "string"}'
      },
      
      // Marketing & Analytics
      {
        name: 'Google Analytics',
        type: 'analytics',
        slug: 'google-analytics',
        description: 'Google Analytics integration for website and app analytics',
        config_schema: '{"access_token": "string", "refresh_token": "string", "property_id": "string"}'
      },
      {
        name: 'Mailchimp',
        type: 'marketing',
        slug: 'mailchimp',
        description: 'Mailchimp integration for email marketing campaigns',
        config_schema: '{"api_key": "string", "server_prefix": "string"}'
      },
      {
        name: 'ConvertKit',
        type: 'marketing',
        slug: 'convertkit',
        description: 'ConvertKit integration for email marketing and automation',
        config_schema: '{"api_key": "string", "api_secret": "string"}'
      },
      
      // Finance & Accounting
      {
        name: 'QuickBooks',
        type: 'finance',
        slug: 'quickbooks',
        description: 'QuickBooks integration for accounting and financial management',
        config_schema: '{"access_token": "string", "refresh_token": "string", "realm_id": "string"}'
      },
      {
        name: 'Stripe',
        type: 'finance',
        slug: 'stripe',
        description: 'Stripe integration for payment processing and billing',
        config_schema: '{"publishable_key": "string", "secret_key": "string", "webhook_secret": "string"}'
      },
      {
        name: 'PayPal',
        type: 'finance',
        slug: 'paypal',
        description: 'PayPal integration for payment processing',
        config_schema: '{"client_id": "string", "client_secret": "string", "mode": "string"}'
      },
      
      // Project Management
      {
        name: 'Asana',
        type: 'project-management',
        slug: 'asana',
        description: 'Asana integration for project and task management',
        config_schema: '{"access_token": "string", "workspace_id": "string"}'
      },
      {
        name: 'Trello',
        type: 'project-management',
        slug: 'trello',
        description: 'Trello integration for kanban board project management',
        config_schema: '{"api_key": "string", "token": "string"}'
      },
      {
        name: 'Notion',
        type: 'productivity',
        slug: 'notion',
        description: 'Notion integration for workspace and knowledge management',
        config_schema: '{"access_token": "string", "database_id": "string"}'
      },
      
      // Development & Tools
      {
        name: 'GitHub',
        type: 'development',
        slug: 'github',
        description: 'GitHub integration for code repository and project management',
        config_schema: '{"access_token": "string", "webhook_secret": "string"}'
      },
      {
        name: 'GitLab',
        type: 'development',
        slug: 'gitlab',
        description: 'GitLab integration for code repository and CI/CD',
        config_schema: '{"access_token": "string", "webhook_secret": "string"}'
      },
      {
        name: 'Jira',
        type: 'project-management',
        slug: 'jira',
        description: 'Jira integration for issue tracking and project management',
        config_schema: '{"domain": "string", "email": "string", "api_token": "string"}'
      },
      
      // Cloud & Storage
      {
        name: 'Google Drive',
        type: 'storage',
        slug: 'google-drive',
        description: 'Google Drive integration for file storage and sharing',
        config_schema: '{"access_token": "string", "refresh_token": "string", "folder_id": "string"}'
      },
      {
        name: 'Dropbox',
        type: 'storage',
        slug: 'dropbox',
        description: 'Dropbox integration for file storage and sharing',
        config_schema: '{"access_token": "string", "app_key": "string"}'
      },
      {
        name: 'OneDrive',
        type: 'storage',
        slug: 'onedrive',
        description: 'OneDrive integration for file storage and sharing',
        config_schema: '{"access_token": "string", "refresh_token": "string", "drive_id": "string"}'
      },
      
      // Customer Support
      {
        name: 'Zendesk',
        type: 'support',
        slug: 'zendesk',
        description: 'Zendesk integration for customer support and ticketing',
        config_schema: '{"domain": "string", "email": "string", "api_token": "string"}'
      },
      {
        name: 'Intercom',
        type: 'support',
        slug: 'intercom',
        description: 'Intercom integration for customer messaging and support',
        config_schema: '{"access_token": "string", "app_id": "string"}'
      },
      
      // E-commerce
      {
        name: 'Shopify',
        type: 'ecommerce',
        slug: 'shopify',
        description: 'Shopify integration for e-commerce store management',
        config_schema: '{"shop_url": "string", "access_token": "string", "webhook_secret": "string"}'
      },
      {
        name: 'WooCommerce',
        type: 'ecommerce',
        slug: 'woocommerce',
        description: 'WooCommerce integration for WordPress e-commerce',
        config_schema: '{"store_url": "string", "consumer_key": "string", "consumer_secret": "string"}'
      },
      
      // Social Media
      {
        name: 'LinkedIn',
        type: 'social-media',
        slug: 'linkedin',
        description: 'LinkedIn integration for professional networking and content',
        config_schema: '{"access_token": "string", "refresh_token": "string", "organization_id": "string"}'
      },
      {
        name: 'Twitter/X',
        type: 'social-media',
        slug: 'twitter',
        description: 'Twitter/X integration for social media management',
        config_schema: '{"api_key": "string", "api_secret": "string", "access_token": "string", "access_token_secret": "string"}'
      },
      
      // Email & Calendar
      {
        name: 'Gmail',
        type: 'email',
        slug: 'gmail',
        description: 'Gmail integration for email management',
        config_schema: '{"access_token": "string", "refresh_token": "string", "user_id": "string"}'
      },
      {
        name: 'Google Calendar',
        type: 'calendar',
        slug: 'google-calendar',
        description: 'Google Calendar integration for scheduling and events',
        config_schema: '{"access_token": "string", "refresh_token": "string", "calendar_id": "string"}'
      },
      
      // Marcoby Specific
      {
        name: 'Marcoby Cloud',
        type: 'productivity',
        slug: 'marcoby-cloud',
        description: 'Marcoby Cloud email integration',
        config_schema: '{"imap_host": "string", "imap_port": "number", "smtp_host": "string", "smtp_port": "number", "username": "string", "password": "string"}'
      }
    ];
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const integration of starterIntegrations) {
      try {
        // Check if integration already exists
        const existingResult = await query("SELECT 1 FROM integrations WHERE slug = $1", [integration.slug]);
        
        if (existingResult.data.length === 0) {
          await query(`
            INSERT INTO integrations (id, name, type, slug, description, config_schema, is_active, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              $4,
              $5,
              true,
              NOW(),
              NOW()
            )
          `, [integration.name, integration.type, integration.slug, integration.description, integration.config_schema]);
          
          console.log(`✅ Added: ${integration.name}`);
          addedCount++;
        } else {
          console.log(`⏭️  Skipped: ${integration.name} (already exists)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding ${integration.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Added: ${addedCount} integrations`);
    console.log(`- Skipped: ${skippedCount} integrations`);
    
    // Show final state
    const result = await query('SELECT name, type, slug FROM integrations ORDER BY type, name');
    console.log('\n📋 All integrations:');
    
    const groupedByType = {};
    result.data.forEach(row => {
      if (!groupedByType[row.type]) {
        groupedByType[row.type] = [];
      }
      groupedByType[row.type].push(row);
    });
    
    Object.keys(groupedByType).sort().forEach(type => {
      console.log(`\n${type.toUpperCase()}:`);
      groupedByType[type].forEach(row => {
        console.log(`  - ${row.name} (${row.slug})`);
      });
    });
    
  } catch (error) {
    console.error('Error adding starter integrations:', error);
  }
}

addStarterIntegrations();
