const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking user_onboarding_phases table structure...\n');

    // Check table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_onboarding_phases' 
      ORDER BY ordinal_position;
    `;

    const structureResult = await pool.query(structureQuery);
    
    console.log('📋 Table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Check if created_at column exists
    const hasCreatedAt = structureResult.rows.some(row => row.column_name === 'created_at');
    console.log(`\n✅ Has created_at column: ${hasCreatedAt}`);

    // Check constraints
    const constraintsQuery = `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_onboarding_phases';
    `;

    const constraintsResult = await pool.query(constraintsQuery);
    
    console.log('\n🔒 Table constraints:');
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    // Check indexes
    const indexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'user_onboarding_phases';
    `;

    const indexesResult = await pool.query(indexesQuery);
    
    console.log('\n📊 Table indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}: ${row.indexdef}`);
    });

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
