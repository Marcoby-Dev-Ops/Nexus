const { query } = require('./src/database/connection');

async function checkBackupStructure() {
  try {
    console.log('Checking backup table structure...');
    
    // Check user_mappings_backup structure
    const backupStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_mappings_backup'
      ORDER BY ordinal_position
    `);
    
    console.log('Backup table structure:', backupStructure);
    
    // Check sample data from backup
    const backupData = await query(`
      SELECT * FROM user_mappings_backup LIMIT 3
    `);
    
    console.log('Backup sample data:', backupData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBackupStructure();
