import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOwnershipSystem() {
  console.log('🧪 Testing Company Ownership System...\n');

  try {
    // 1. Check if owner_id column exists
    console.log('1. Checking database schema...');
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'companies')
      .eq('column_name', 'owner_id');

    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError);
      return;
    }

    if (schemaInfo && schemaInfo.length > 0) {
      console.log('✅ owner_id column exists in companies table');
    } else {
      console.log('❌ owner_id column not found in companies table');
      return;
    }

    // 2. Check existing companies and their owners
    console.log('\n2. Checking existing companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        owner_id,
        user_profiles!inner(
          id,
          email,
          first_name,
          last_name,
          role
        )
      `)
      .limit(5);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
      return;
    }

    console.log(`Found ${companies?.length || 0} companies:`);
    companies?.forEach(company => {
      const owner = company.user_profiles?.find(u => u.id === company.owner_id);
      console.log(`  - ${company.name}: Owner = ${owner?.email || 'None'} (${owner?.role || 'N/A'})`);
    });

    // 3. Test ownership functions
    console.log('\n3. Testing ownership functions...');
    
    if (companies && companies.length > 0) {
      const testCompany = companies[0];
      
      // Test get_company_owner function
      const { data: ownerId, error: ownerError } = await supabase.rpc('get_company_owner', {
        company_uuid: testCompany.id
      });

      if (ownerError) {
        console.log('⚠️  get_company_owner function not available:', ownerError.message);
      } else {
        console.log(`✅ get_company_owner function works: ${ownerId}`);
      }

      // Test is_company_owner function
      if (testCompany.owner_id) {
        const { data: isOwner, error: isOwnerError } = await supabase.rpc('is_company_owner', {
          company_uuid: testCompany.id,
          user_uuid: testCompany.owner_id
        });

        if (isOwnerError) {
          console.log('⚠️  is_company_owner function not available:', isOwnerError.message);
        } else {
          console.log(`✅ is_company_owner function works: ${isOwner}`);
        }
      }
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'companies')
      .like('policyname', '%owner%');

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies:', policiesError.message);
    } else {
      console.log(`Found ${policies?.length || 0} ownership-related policies:`);
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname} on ${policy.tablename}`);
      });
    }

    // 5. Test ownership statistics
    console.log('\n5. Testing ownership statistics...');
    const { data: totalCompanies } = await supabase
      .from('companies')
      .select('id', { count: 'exact' });

    const { data: companiesWithOwners } = await supabase
      .from('companies')
      .select('id', { count: 'exact' })
      .not('owner_id', 'is', null);

    console.log(`📊 Ownership Statistics:`);
    console.log(`  - Total companies: ${totalCompanies?.length || 0}`);
    console.log(`  - Companies with owners: ${companiesWithOwners?.length || 0}`);
    console.log(`  - Orphaned companies: ${(totalCompanies?.length || 0) - (companiesWithOwners?.length || 0)}`);

    console.log('\n✅ Ownership system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOwnershipSystem(); 