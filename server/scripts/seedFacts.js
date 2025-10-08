// Simple seed script to insert example facts for testing
const { query } = require('../src/database/connection');
const { NexusAIGatewayService } = require('../src/services/NexusAIGatewayService');
const aiGateway = new NexusAIGatewayService();

async function seed() {
  try {
    const examples = [
      { key: 'remote_work_policy', kind: 'policy', value: 'Employees may work remotely up to 3 days per week unless otherwise approved by management.' },
      { key: 'quarter_end_reporting', kind: 'policy', value: 'All teams must submit quarter-end reports by the 5th business day following quarter close.' },
      { key: 'company_vision', kind: 'org', value: 'Become the most trusted self-hosted AI business OS.' }
    ];

    for (const ex of examples) {
      const embedRes = await aiGateway.generateEmbeddings({ text: ex.value, model: 'text-embedding-ada-002', tenantId: 'seed' });
      const embedding = embedRes.success ? embedRes.data.embedding : null;
      const vectorString = embedding ? `[${embedding.join(',')}]` : null;

      const sql = `
        INSERT INTO facts (org_id, user_id, kind, key, value, metadata, importance, embedding, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, ${vectorString ? "$8::vector" : 'NULL'}, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, metadata = EXCLUDED.metadata, importance = EXCLUDED.importance, embedding = EXCLUDED.embedding, updated_at = NOW()
      `;

      const params = [null, null, ex.kind, ex.key, ex.value, JSON.stringify({ seeded: true }), 7];
      if (vectorString) params.push(vectorString);

      const result = await query(sql, params);
      if (result.error) console.error('Seed insert failed', result.error);
      else console.log('Seeded fact:', ex.key);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed script failed', err);
    process.exit(1);
  }
}

seed();
