const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'vector_db'
});

async function updateQuantumSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if quantum_business_profiles table exists...');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'quantum_business_profiles'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Table exists, updating schema...');
      
      // Add organization_id column if it doesn't exist
      const hasOrgId = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'quantum_business_profiles' 
          AND column_name = 'organization_id'
        );
      `);
      
      if (!hasOrgId.rows[0].exists) {
        console.log('➕ Adding organization_id column...');
        await client.query(`
          ALTER TABLE quantum_business_profiles 
          ADD COLUMN organization_id UUID;
        `);
      } else {
        console.log('✅ organization_id column already exists');
      }
      
      // Create index on organization_id
      const hasIndex = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = 'idx_quantum_business_profiles_organization_id'
        );
      `);
      
      if (!hasIndex.rows[0].exists) {
        console.log('➕ Creating index on organization_id...');
        await client.query(`
          CREATE INDEX idx_quantum_business_profiles_organization_id 
          ON quantum_business_profiles(organization_id);
        `);
      } else {
        console.log('✅ Index already exists');
      }
      
      // Check if RLS is enabled - use a simpler approach
      console.log('ℹ️ Skipping RLS policy updates for now (can be added later)');
      
    } else {
      console.log('🆕 Table does not exist, creating it...');
      
      await client.query(`
        CREATE TABLE quantum_business_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL,
          profile_data JSONB NOT NULL,
          health_score INTEGER DEFAULT 0,
          maturity_level TEXT DEFAULT 'startup',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_quantum_business_profiles_organization_id 
        ON quantum_business_profiles(organization_id);
      `);
      
      await client.query(`
        CREATE INDEX idx_quantum_business_profiles_health_score 
        ON quantum_business_profiles(health_score);
      `);
      
      await client.query(`
        CREATE INDEX idx_quantum_business_profiles_maturity_level 
        ON quantum_business_profiles(maturity_level);
      `);
      
      // Enable RLS
      await client.query(`
        ALTER TABLE quantum_business_profiles ENABLE ROW LEVEL SECURITY;
      `);
      
      // Create RLS policy
      await client.query(`
        CREATE POLICY "Users can manage quantum profiles for their organization" 
        ON quantum_business_profiles FOR ALL 
        USING (
          organization_id IN (
            SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
          )
        );
      `);
      
      console.log('✅ Table created successfully');
    }
    
    // Verify the table structure
    console.log('📋 Verifying table structure...');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quantum_business_profiles' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Table structure:');
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('✅ Quantum business profiles schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateQuantumSchema().catch(console.error);
