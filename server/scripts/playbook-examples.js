#!/usr/bin/env node

/**
 * Playbook Management Examples
 * 
 * This script demonstrates how to use the PlaybookManager for dynamic playbook creation and management.
 */

import 'dotenv/config';
import { PlaybookManager } from '../services/PlaybookManager.js';

async function demonstratePlaybookManagement() {
  console.log('🚀 Playbook Management Examples\n');

  const manager = new PlaybookManager();

  try {
    // 1. List all existing playbooks
    console.log('1. 📚 Listing all playbooks...');
    await manager.displayPlaybooksSummary();

    // 2. Create a simple custom playbook
    console.log('\n2. ➕ Creating a custom playbook...');
    const customPlaybook = {
      name: 'Custom Sales Process',
      description: 'A custom sales process tailored for specific needs',
      category: 'sales',
      version: '1.0.0',
      estimatedDuration: 120, // 2 hours
      isActive: true,
      steps: [
        {
          title: 'Lead Qualification',
          description: 'Qualify incoming leads',
          stepType: 'form',
          isRequired: true,
          order: 1,
          estimatedDuration: 15,
          validationSchema: {
            leadSource: { type: 'string', required: true },
            qualificationScore: { type: 'number', required: true, min: 1, max: 10 }
          },
          metadata: {
            component: 'LeadQualificationStep',
            monitoredFields: ['lead_source', 'qualification_score'],
            completionCriteria: {
              qualification_score: { required: true, type: 'number', min: 7 }
            }
          }
        },
        {
          title: 'Initial Contact',
          description: 'Make first contact with qualified leads',
          stepType: 'action',
          isRequired: true,
          order: 2,
          estimatedDuration: 30,
          metadata: {
            component: 'InitialContactStep',
            monitoredFields: ['contact_attempted', 'contact_successful'],
            completionCriteria: {
              contact_attempted: { required: true, type: 'boolean' }
            }
          }
        },
        {
          title: 'Follow-up Schedule',
          description: 'Schedule follow-up activities',
          stepType: 'form',
          isRequired: false,
          order: 3,
          estimatedDuration: 10,
          validationSchema: {
            followUpDate: { type: 'string', required: false, format: 'date' },
            followUpType: { type: 'string', required: false, enum: ['call', 'email', 'meeting'] }
          },
          metadata: {
            component: 'FollowUpScheduleStep',
            monitoredFields: ['follow_up_date', 'follow_up_type']
          }
        }
      ],
      prerequisites: ['CRM System Setup'],
      successMetrics: [
        'Lead qualification rate > 70%',
        'Initial contact success rate > 50%',
        'Follow-up completion rate > 80%'
      ],
      tags: ['sales', 'custom', 'process']
    };

    const createResult = await manager.createPlaybook(customPlaybook);
    if (createResult.success) {
      console.log(`✅ Created playbook: ${createResult.playbookId}`);
      
      // 3. Show the newly created playbook details
      console.log('\n3. 📋 Showing playbook details...');
      await manager.displayPlaybookDetails(createResult.playbookId);

      // 4. Add a new step to the playbook
      console.log('\n4. ➕ Adding a new step...');
      const newStep = {
        title: 'Close Deal',
        description: 'Finalize the sale',
        stepType: 'action',
        isRequired: true,
        estimatedDuration: 45,
        metadata: {
          component: 'CloseDealStep',
          monitoredFields: ['deal_closed', 'deal_value'],
          completionCriteria: {
            deal_closed: { required: true, type: 'boolean' }
          }
        }
      };

      const addStepResult = await manager.addPlaybookStep(createResult.playbookId, newStep);
      if (addStepResult.success) {
        console.log(`✅ Added step: ${addStepResult.step.name}`);

        // 5. Update the step
        console.log('\n5. ✏️ Updating step details...');
        await manager.updatePlaybookStep(addStepResult.step.id, {
          title: 'Close Deal & Documentation',
          description: 'Finalize the sale and complete documentation',
          estimatedDuration: 60
        });

        // 6. Show updated playbook
        console.log('\n6. 📋 Showing updated playbook...');
        await manager.displayPlaybookDetails(createResult.playbookId);

        // 7. Export the playbook to a template file
        console.log('\n7. 📤 Exporting playbook to template...');
        const exportResult = await manager.exportPlaybookToTemplate(
          createResult.playbookId, 
          './custom-sales-process-template.json'
        );
        if (exportResult.success) {
          console.log(`✅ Exported to: ${exportResult.templatePath}`);
        }
      }
    }

    // 8. Show all playbooks again
    console.log('\n8. 📚 Final playbook list...');
    await manager.displayPlaybooksSummary();

  } catch (error) {
    console.error('Error in demonstration:', error);
  }
}

// Run the demonstration
demonstratePlaybookManagement();
