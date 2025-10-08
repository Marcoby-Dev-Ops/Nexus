/**
 * Migration Script: Static Onboarding Template to Dynamic Database
 * 
 * This script migrates the hardcoded ONBOARDING_TEMPLATE from UnifiedPlaybookService.ts
 * to the database-driven playbook system.
 */

require('dotenv/config');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Static onboarding template data from UnifiedPlaybookService.ts
const ONBOARDING_TEMPLATE = {
  id: uuidv4(), // Generate UUID for database
  name: 'Business Foundation Setup',
  description: 'Complete your business profile to train Nexus AI with your unique context and goals',
  category: 'onboarding',
  version: '1.0.0',
  estimatedDuration: 15,
  complexity: 'beginner',
  isActive: true,
  steps: [
    {
      id: uuidv4(),
      title: 'Welcome to Nexus',
      description: 'Your business transformation journey starts here',
      stepType: 'step',
      isRequired: true,
      order: 1,
      estimatedDuration: 2,
      metadata: { component: 'WelcomeStep' }
    },
    {
      id: uuidv4(),
      title: 'About Your Business',
      description: 'A few simple questions to understand your business better',
      stepType: 'step',
      isRequired: true,
      order: 2,
      estimatedDuration: 5,
      validationSchema: {
        firstName: { type: 'string', required: true, minLength: 1 },
        lastName: { type: 'string', required: true, minLength: 1 },
        email: { type: 'string', required: true, format: 'email' },
        company: { type: 'string', required: true, minLength: 1 },
        industry: { type: 'string', required: true, minLength: 1 },
        companySize: { type: 'string', required: true, minLength: 1 },
        keyPriorities: { type: 'array', required: true, minItems: 1 }
      },
      metadata: { component: 'CoreIdentityStep' }
    },
    {
      id: uuidv4(),
      title: 'Your Business Tools',
      description: 'Tell us what tools you\'re already using',
      stepType: 'step',
      isRequired: false,
      order: 3,
      estimatedDuration: 3,
      metadata: { component: 'ToolIdentificationStep' }
    },
    {
      id: uuidv4(),
      title: 'What Do You Want to Achieve?',
      description: 'Based on your business, here are some common goals that help companies grow',
      stepType: 'step',
      isRequired: true,
      order: 4,
      estimatedDuration: 3,
      validationSchema: {
        selectedGoals: { type: 'array', required: true, minItems: 1 },
        maturityScore: { type: 'number', required: true, min: 0, max: 100 }
      },
      metadata: { component: 'AIPoweredGoalsStep' }
    },
    {
      id: uuidv4(),
      title: 'Your First Insights',
      description: 'See your personalized dashboard and opportunities',
      stepType: 'step',
      isRequired: true,
      order: 5,
      estimatedDuration: 2,
      metadata: { component: 'DayOneInsightStep' }
    }
  ],
  prerequisites: [],
  successMetrics: [
    'Complete business profile established',
    'Unified brain trained with user context',
    'Personalized AI guidance activated',
    'Business intelligence foundation ready'
  ],
  tags: ['foundation', 'brain-training', 'profile-setup', 'ai-context'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function migrateOnboardingTemplate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration of static onboarding template to database...');
    
    // Check if onboarding template already exists
    const existingTemplate = await client.query(
      'SELECT id FROM playbook_templates WHERE name = $1',
      [ONBOARDING_TEMPLATE.name]
    );
    
    if (existingTemplate.rows.length > 0) {
      console.log('⚠️  Onboarding template already exists in database');
      console.log('   Template ID:', existingTemplate.rows[0].id);
      
      // Ask if we should update it
      const shouldUpdate = process.argv.includes('--force');
      if (!shouldUpdate) {
        console.log('   Use --force flag to update existing template');
        return;
      }
      
      console.log('🔄 Updating existing template...');
      await updateExistingTemplate(client, existingTemplate.rows[0].id);
    } else {
      console.log('✨ Creating new onboarding template...');
      await createNewTemplate(client);
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function createNewTemplate(client) {
  // Insert playbook template
  const templateResult = await client.query(`
    INSERT INTO playbook_templates (
      id, name, description, version, is_active, category, 
      estimated_duration_hours, prerequisites, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    ONBOARDING_TEMPLATE.id,
    ONBOARDING_TEMPLATE.name,
    ONBOARDING_TEMPLATE.description,
    ONBOARDING_TEMPLATE.version,
    ONBOARDING_TEMPLATE.isActive,
    ONBOARDING_TEMPLATE.category,
    Math.ceil(ONBOARDING_TEMPLATE.estimatedDuration / 60), // Convert minutes to hours
    JSON.stringify(ONBOARDING_TEMPLATE.prerequisites),
    ONBOARDING_TEMPLATE.createdAt,
    ONBOARDING_TEMPLATE.updatedAt
  ]);
  
  const templateId = templateResult.rows[0].id;
  console.log('   Template created with ID:', templateId);
  
  // Insert playbook items
  for (const step of ONBOARDING_TEMPLATE.steps) {
    await client.query(`
      INSERT INTO playbook_items (
        id, playbook_id, name, description, item_type, order_index,
        is_required, estimated_duration_minutes, validation_schema,
        component_name, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      step.id,
      templateId,
      step.title,
      step.description,
      step.stepType,
      step.order,
      step.isRequired,
      step.estimatedDuration,
      JSON.stringify(step.validationSchema || {}),
      step.metadata?.component || null,
      JSON.stringify(step.metadata || {}),
      ONBOARDING_TEMPLATE.createdAt,
      ONBOARDING_TEMPLATE.updatedAt
    ]);
    
    console.log(`   Step "${step.title}" created`);
  }
}

async function updateExistingTemplate(client, templateId) {
  // Update template
  await client.query(`
    UPDATE playbook_templates SET
      description = $1,
      version = $2,
      is_active = $3,
      category = $4,
      estimated_duration_hours = $5,
      prerequisites = $6,
      updated_at = $7
    WHERE id = $8
  `, [
    ONBOARDING_TEMPLATE.description,
    ONBOARDING_TEMPLATE.version,
    ONBOARDING_TEMPLATE.isActive,
    ONBOARDING_TEMPLATE.category,
    Math.ceil(ONBOARDING_TEMPLATE.estimatedDuration / 60),
    JSON.stringify(ONBOARDING_TEMPLATE.prerequisites),
    new Date().toISOString(),
    templateId
  ]);
  
  // Delete existing items
  await client.query('DELETE FROM playbook_items WHERE playbook_id = $1', [templateId]);
  console.log('   Existing items deleted');
  
  // Insert new items
  for (const step of ONBOARDING_TEMPLATE.steps) {
    await client.query(`
      INSERT INTO playbook_items (
        id, playbook_id, name, description, item_type, order_index,
        is_required, estimated_duration_minutes, validation_schema,
        component_name, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      step.id,
      templateId,
      step.title,
      step.description,
      step.stepType,
      step.order,
      step.isRequired,
      step.estimatedDuration,
      JSON.stringify(step.validationSchema || {}),
      step.metadata?.component || null,
      JSON.stringify(step.metadata || {}),
      ONBOARDING_TEMPLATE.createdAt,
      ONBOARDING_TEMPLATE.updatedAt
    ]);
    
    console.log(`   Step "${step.title}" updated`);
  }
}

// Run migration
if (require.main === module) {
  migrateOnboardingTemplate()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOnboardingTemplate };
