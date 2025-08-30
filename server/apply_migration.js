const fs = require('fs');
const path = require('path');
const { query } = require('./src/database/connection');

async function applyMigration(migrationFile) {
  try {
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Applying migration: ${migrationFile}`);
    
    const result = await query(sql);
    
    if (result.error) {
      console.error('Migration failed:', result.error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node apply_migration.js <migration_file>');
  process.exit(1);
}

applyMigration(migrationFile);
