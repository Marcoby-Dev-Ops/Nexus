const { query } = require('./src/database/connection');

async function fixVonUser() {
  try {
    console.log('Fixing Von Jackson user record...\n');
    
    // Check current state
    const vonProfile = await query(`
      SELECT user_id, email, first_name, last_name 
      FROM user_profiles 
      WHERE user_id = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b'
    `);
    console.log('Von Jackson profile:', vonProfile.data);
    
    // Check if user exists in users table
    const vonUser = await query(`
      SELECT id, email 
      FROM users 
      WHERE id = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b'
    `);
    console.log('Von Jackson in users table:', vonUser.data);
    
    if (vonUser.data.length === 0) {
      console.log('Creating missing user record for Von Jackson...');
      
      // Insert the missing user record
      const insertResult = await query(`
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (
          'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b',
          'vonj@marcoby.com',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id, email
      `);
      
      console.log('User record created:', insertResult.data);
    } else {
      console.log('User record already exists');
    }
    
    // Verify the fix
    const verifyUser = await query(`
      SELECT id, email 
      FROM users 
      WHERE id = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b'
    `);
    console.log('Verification - Von Jackson in users table:', verifyUser.data);
    
  } catch (error) {
    console.error('Error fixing Von Jackson user:', error);
  }
}

fixVonUser().then(() => process.exit(0));
