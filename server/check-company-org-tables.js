const { Pool } = require('pg');

async function checkCompanyOrgTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking company and organization tables...\n');
    
    // Check for company-related tables
    console.log('📋 Company-related tables:');
    const companyTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%company%'
      ORDER BY table_name
    `);
    
    if (companyTables.rows.length === 0) {
      console.log('  ❌ No company tables found');
    } else {
      companyTables.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // Check for organization-related tables
    console.log('\n📋 Organization-related tables:');
    const orgTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%organization%'
      ORDER BY table_name
    `);
    
    if (orgTables.rows.length === 0) {
      console.log('  ❌ No organization tables found');
    } else {
      orgTables.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // Check what's in the companies table if it exists
    if (companyTables.rows.some(row => row.table_name === 'companies')) {
      console.log('\n🔍 Checking companies table structure:');
      const companyColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        ORDER BY ordinal_position
      `);
      
      console.log('  Columns:');
      companyColumns.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check for sample data
      const companyCount = await pool.query('SELECT COUNT(*) as count FROM companies');
      console.log(`  Records: ${companyCount.rows[0].count}`);
    }
    
    // Check what's in the organizations table if it exists
    if (orgTables.rows.some(row => row.table_name === 'organizations')) {
      console.log('\n🔍 Checking organizations table structure:');
      const orgColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        ORDER BY ordinal_position
      `);
      
      console.log('  Columns:');
      orgColumns.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check for sample data
      const orgCount = await pool.query('SELECT COUNT(*) as count FROM organizations');
      console.log(`  Records: ${orgCount.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkCompanyOrgTables();
