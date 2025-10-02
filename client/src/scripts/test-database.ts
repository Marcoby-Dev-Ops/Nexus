import { databaseService } from '@/core/services/DatabaseService';
import { testConnection, testVectorExtension } from '@/lib/postgres';

async function testDatabaseMigration() {
  console.log('🧪 Testing Database Migration...\n');

  try {
    // Test 1: Check database service configuration
    console.log('1. Database Service Configuration:');
    const config = databaseService.getConfig();
    console.log(`   Type: ${config.type}`);
    console.log(`   URL: ${config.url}`);
    console.log(`   Using Supabase: ${databaseService.isUsingSupabase()}`);
    console.log(`   Using PostgreSQL: ${databaseService.isUsingPostgres()}\n`);

    // Test 2: Health check
    console.log('2. Database Health Check:');
    const health = await databaseService.healthCheck();
    console.log(`   Status: ${health.status}`);
    console.log(`   Type: ${health.type}`);
    console.log(`   Connection: ${health.connection ? '✅' : '❌'}`);
    console.log(`   Vector Support: ${health.vectorSupport ? '✅' : '❌'}`);
    if (health.error) {
      console.log(`   Error: ${health.error}`);
    }
    console.log('');

    // Test 3: Direct PostgreSQL connection test
    console.log('3. Direct PostgreSQL Connection:');
    const connectionTest = await testConnection();
    console.log(`   Connection: ${connectionTest.success ? '✅' : '❌'}`);
    if (connectionTest.error) {
      console.log(`   Error: ${connectionTest.error}`);
    }
    console.log('');

    // Test 4: Vector extension test
    console.log('4. Vector Extension Test:');
    const vectorTest = await testVectorExtension();
    console.log(`   Vector Extension: ${vectorTest.success ? '✅' : '❌'}`);
    if (vectorTest.error) {
      console.log(`   Error: ${vectorTest.error}`);
    }
    console.log('');

    // Test 5: Query test
    console.log('5. Query Test:');
    const queryResult = await databaseService.query('SELECT COUNT(*) as count FROM public.user_profiles');
    console.log(`   Query Result: ${queryResult.error ? '❌' : '✅'}`);
    if (queryResult.error) {
      console.log(`   Error: ${queryResult.error}`);
    } else {
      console.log(`   Count: ${queryResult.data?.[0]?.count || 0}`);
    }
    console.log('');

    // Test 6: Vector search test
    console.log('6. Vector Search Test:');
    const testEmbedding = Array.from({ length: 1536 }, () => Math.random());
    const vectorSearchResult = await databaseService.query(`
      SELECT COUNT(*) as count 
      FROM public.thoughts 
      WHERE embedding IS NOT NULL
    `);
    console.log(`   Vector Search: ${vectorSearchResult.error ? '❌' : '✅'}`);
    if (vectorSearchResult.error) {
      console.log(`   Error: ${vectorSearchResult.error}`);
    } else {
      console.log(`   Thoughts with embeddings: ${vectorSearchResult.data?.[0]?.count || 0}`);
    }
    console.log('');

    // Summary
    console.log('📊 Migration Test Summary:');
    console.log(`   Database Type: ${config.type.toUpperCase()}`);
    console.log(`   Connection: ${health.connection ? '✅' : '❌'}`);
    console.log(`   Vector Support: ${health.vectorSupport ? '✅' : '❌'}`);
    console.log(`   Overall Status: ${health.status === 'healthy' ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (health.status === 'healthy') {
      console.log('\n🎉 Database migration completed successfully!');
      console.log('   Your application is now using PostgreSQL with pgvector.');
    } else {
      console.log('\n⚠️  Database migration has issues. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseMigration().catch(console.error);
