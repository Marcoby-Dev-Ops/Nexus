const { query } = require('./src/database/connection');

async function checkJourneyTables() {
  try {
    console.log('=== Checking Journey Tables Structure ===');
    
    // Check journey_templates table
    const templatesResult = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'journey_templates' 
      ORDER BY ordinal_position
    `);
    
    console.log('\njourney_templates columns:');
    templatesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check user_journey_progress table
    const progressResult = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_journey_progress' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nuser_journey_progress columns:');
    progressResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check user_journey_responses table
    const responsesResult = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_journey_responses' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nuser_journey_responses columns:');
    responsesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error checking journey tables:', error);
  } finally {
    process.exit(0);
  }
}

checkJourneyTables();
