const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
    connectionString: 'postgresql://nexus:postgres@mar-ubu01:5432/nexus_db'
});

async function check() {
    try {
        await client.connect();
        console.log('Connected to DB on mar-ubu01');

        // Check if user_licenses table exists
        const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_licenses'
      );
    `);
        console.log('user_licenses exists:', res.rows[0].exists);

        // Check migrations table
        const mig = await client.query("SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 5");
        console.log('Recent migrations:', mig.rows);

    } catch (err) {
        console.error('DB Check Error:', err);
    } finally {
        await client.end();
    }
}

check();
