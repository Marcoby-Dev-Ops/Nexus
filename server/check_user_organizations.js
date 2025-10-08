const { query } = require('./src/database/connection');

async function checkUserOrganizations() {
  try {
    console.log('Checking user_organizations table structure...');
    
    // Check user_organizations table structure
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_organizations'
      ORDER BY ordinal_position
    `);
    
    console.log('User organizations structure:', structure);
    
    // Check sample data
    const sampleData = await query(`
      SELECT * FROM user_organizations LIMIT 3
    `);
    
    console.log('Sample data:', sampleData);
    
    // Check user_mappings structure
    const mappingsStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_mappings'
      ORDER BY ordinal_position
    `);
    
    console.log('User mappings structure:', mappingsStructure);
    
    // Check sample mappings data
    const mappingsData = await query(`
      SELECT * FROM user_mappings LIMIT 3
    `);
    
    console.log('Mappings sample data:', mappingsData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserOrganizations();
