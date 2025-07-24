import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status...');
    
    // List all users to find your account
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return;
    }
    
    console.log(`📊 Found ${users.length} users in the system`);
    
    // Look for your email
    const yourEmail = 'vonj@marcoby.com'; // Update this to your email
    const yourUser = users.find(user => user.email === yourEmail);
    
    if (!yourUser) {
      console.log(`❌ User with email ${yourEmail} not found`);
      console.log('\n📧 Available users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.email_confirmed_at ? '✅ Confirmed' : '❌ Not confirmed'})`);
      });
      return;
    }
    
    console.log(`✅ Found user: ${yourUser.email}`);
    console.log(`   ID: ${yourUser.id}`);
    console.log(`   Created: ${yourUser.created_at}`);
    console.log(`   Email confirmed: ${yourUser.email_confirmed_at ? '✅ Yes' : '❌ No'}`);
    console.log(`   Last sign in: ${yourUser.last_sign_in_at || 'Never'}`);
    console.log(`   Role: ${yourUser.role}`);
    
    if (!yourUser.email_confirmed_at) {
      console.log('\n🔧 To manually confirm your email, run this SQL in Supabase:');
      console.log(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${yourEmail}';`);
      
      console.log('\n🔧 Or disable email confirmation in Supabase Dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/kqclbpimkraenvbffnpk/auth/providers');
      console.log('2. Click on "Email" provider');
      console.log('3. Disable "Confirm email" option');
      console.log('4. Save changes');
    } else {
      console.log('\n✅ Your email is confirmed! You should be able to login.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserStatus(); 