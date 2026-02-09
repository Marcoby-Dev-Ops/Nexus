const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('../loadEnv');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db',
    });

    try {
        console.log('Reading migration file...');
        const sqlPath = path.join(__dirname, '../update-quantum-profile-schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await pool.query(sql);
        console.log('Migration applied successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
