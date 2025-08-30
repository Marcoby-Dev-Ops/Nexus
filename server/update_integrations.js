const { query } = require('./src/database/connection');

async function updateIntegrations() {
  try {
    console.log('Updating existing integrations with slugs...');
    
    // Update ALL existing integrations with slugs (including duplicates)
    await query("UPDATE integrations SET slug = 'openai' WHERE name = 'OpenAI' AND type = 'ai'");
    await query("UPDATE integrations SET slug = 'anthropic' WHERE name = 'Anthropic' AND type = 'ai'");
    await query("UPDATE integrations SET slug = 'hubspot' WHERE name = 'HubSpot' AND type = 'crm'");
    await query("UPDATE integrations SET slug = 'slack' WHERE name = 'Slack' AND type = 'communication'");
    
    console.log('Existing integrations updated with slugs');
    
    // Insert Microsoft 365 integration if it doesn't exist
    const microsoftResult = await query("SELECT 1 FROM integrations WHERE slug = 'microsoft365'");
    if (microsoftResult.data.length === 0) {
      await query(`
        INSERT INTO integrations (id, name, type, slug, description, config_schema, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'Microsoft 365',
          'productivity',
          'microsoft365',
          'Microsoft 365 integration for email, calendar, and file access',
          '{"access_token": "string", "refresh_token": "string", "scope": "string", "expires_at": "string"}',
          true,
          NOW(),
          NOW()
        )
      `);
      console.log('Microsoft 365 integration created');
    } else {
      console.log('Microsoft 365 integration already exists');
    }
    
    // Remove duplicates by keeping only one record per slug
    console.log('Removing duplicate integrations...');
    await query(`
      DELETE FROM integrations 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM integrations 
        WHERE slug IS NOT NULL 
        GROUP BY slug
      )
    `);
    
    // Show final state
    const result = await query('SELECT id, name, type, slug FROM integrations ORDER BY name');
    console.log('\nFinal integrations:');
    result.data.forEach(row => {
      console.log(`- ${row.name} (type: ${row.type}, slug: ${row.slug || 'NULL'})`);
    });
    
  } catch (error) {
    console.error('Error updating integrations:', error);
  }
}

updateIntegrations();
