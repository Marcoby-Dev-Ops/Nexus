const { query } = require('./src/database/connection');

async function fixIntegrations() {
  try {
    console.log('Fixing integrations table...');
    
    // Drop the unique constraint temporarily
    await query('DROP INDEX IF EXISTS idx_integrations_slug');
    
    // Update all records with slugs
    await query("UPDATE integrations SET slug = 'openai' WHERE name = 'OpenAI' AND type = 'ai'");
    await query("UPDATE integrations SET slug = 'anthropic' WHERE name = 'Anthropic' AND type = 'ai'");
    await query("UPDATE integrations SET slug = 'hubspot' WHERE name = 'HubSpot' AND type = 'crm'");
    await query("UPDATE integrations SET slug = 'slack' WHERE name = 'Slack' AND type = 'communication'");
    
    console.log('All integrations updated with slugs');
    
    // Remove duplicates by keeping only one record per slug (using DISTINCT ON)
    console.log('Removing duplicate integrations...');
    await query(`
      DELETE FROM integrations 
      WHERE id NOT IN (
        SELECT DISTINCT ON (slug) id
        FROM integrations 
        WHERE slug IS NOT NULL 
        ORDER BY slug, created_at ASC
      )
    `);
    
    // Re-create the unique constraint
    await query('CREATE UNIQUE INDEX idx_integrations_slug ON integrations(slug)');
    
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
    
    // Show final state
    const result = await query('SELECT id, name, type, slug FROM integrations ORDER BY name');
    console.log('\nFinal integrations:');
    result.data.forEach(row => {
      console.log(`- ${row.name} (type: ${row.type}, slug: ${row.slug || 'NULL'})`);
    });
    
  } catch (error) {
    console.error('Error fixing integrations:', error);
  }
}

fixIntegrations();
