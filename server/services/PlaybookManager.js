/**
 * Playbook Manager
 * 
 * Handles dynamic creation, updates, and management of all playbook templates and items.
 * This replaces the need for migration files for every new playbook.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class PlaybookManager {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Create a complete playbook with all its items
   */
  async createPlaybook(playbookData) {
    try {
      console.log(`Creating playbook: ${playbookData.name}`);

      // 1. Create playbook template
      const { data: playbookTemplate, error: templateError } = await this.supabase
        .from('playbook_templates')
        .insert({
          name: playbookData.name,
          description: playbookData.description,
          category: playbookData.category,
          version: playbookData.version || '1.0.0',
          estimated_duration_hours: Math.ceil((playbookData.estimatedDuration || 60) / 60),
          prerequisites: playbookData.prerequisites || [],
          is_active: playbookData.isActive !== false
        })
        .select()
        .single();

      if (templateError) {
        throw new Error(`Failed to create playbook template: ${templateError.message}`);
      }

      console.log(`✅ Created playbook template: ${playbookTemplate.id}`);

      // 2. Create playbook items if they exist
      if (playbookData.steps && playbookData.steps.length > 0) {
        const playbookItems = playbookData.steps.map(step => ({
          playbook_id: playbookTemplate.id,
          name: step.title,
          description: step.description,
          item_type: step.stepType || 'step',
          order_index: step.order,
          is_required: step.isRequired !== false,
          estimated_duration_minutes: step.estimatedDuration || 5,
          validation_schema: step.validationSchema || {},
          component_name: step.metadata?.component || null,
          metadata: step.metadata || {}
        }));

        const { data: items, error: itemsError } = await this.supabase
          .from('playbook_items')
          .insert(playbookItems)
          .select();

        if (itemsError) {
          // If items fail, clean up the template
          await this.supabase.from('playbook_templates').delete().eq('id', playbookTemplate.id);
          throw new Error(`Failed to create playbook items: ${itemsError.message}`);
        }

        console.log(`✅ Created ${items.length} playbook items`);
      }

      return {
        success: true,
        playbookId: playbookTemplate.id,
        template: playbookTemplate,
        itemsCount: playbookData.steps?.length || 0
      };

    } catch (error) {
      console.error('Error creating playbook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing playbook
   */
  async updatePlaybook(playbookId, updates) {
    try {
      console.log(`Updating playbook: ${playbookId}`);

      // Update template
      const templateUpdates = {};
      if (updates.name) templateUpdates.name = updates.name;
      if (updates.description) templateUpdates.description = updates.description;
      if (updates.category) templateUpdates.category = updates.category;
      if (updates.version) templateUpdates.version = updates.version;
      if (updates.estimatedDuration) templateUpdates.estimated_duration_hours = Math.ceil(updates.estimatedDuration / 60);
      if (updates.prerequisites) templateUpdates.prerequisites = updates.prerequisites;
      if (updates.isActive !== undefined) templateUpdates.is_active = updates.isActive;

      if (Object.keys(templateUpdates).length > 0) {
        const { error: templateError } = await this.supabase
          .from('playbook_templates')
          .update(templateUpdates)
          .eq('id', playbookId);

        if (templateError) {
          throw new Error(`Failed to update playbook template: ${templateError.message}`);
        }
      }

      // Update items if provided
      if (updates.steps) {
        // Delete existing items
        await this.supabase
          .from('playbook_items')
          .delete()
          .eq('playbook_id', playbookId);

        // Insert new items
        const playbookItems = updates.steps.map(step => ({
          playbook_id: playbookId,
          name: step.title,
          description: step.description,
          item_type: step.stepType || 'step',
          order_index: step.order,
          is_required: step.isRequired !== false,
          estimated_duration_minutes: step.estimatedDuration || 5,
          validation_schema: step.validationSchema || {},
          component_name: step.metadata?.component || null,
          metadata: step.metadata || {}
        }));

        const { error: itemsError } = await this.supabase
          .from('playbook_items')
          .insert(playbookItems);

        if (itemsError) {
          throw new Error(`Failed to update playbook items: ${itemsError.message}`);
        }

        console.log(`✅ Updated ${updates.steps.length} playbook items`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error updating playbook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a playbook and all its items
   */
  async deletePlaybook(playbookId) {
    try {
      console.log(`Deleting playbook: ${playbookId}`);

      // Delete items first (due to foreign key constraint)
      await this.supabase
        .from('playbook_items')
        .delete()
        .eq('playbook_id', playbookId);

      // Delete template
      const { error } = await this.supabase
        .from('playbook_templates')
        .delete()
        .eq('id', playbookId);

      if (error) {
        throw new Error(`Failed to delete playbook: ${error.message}`);
      }

      console.log('✅ Playbook deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error deleting playbook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all playbooks with detailed information
   */
  async getAllPlaybooks(includeItems = true) {
    try {
      const selectQuery = includeItems ? `
        *,
        playbook_items (
          *,
          order_index,
          estimated_duration_minutes
        )
      ` : '*';

      const { data: playbooks, error } = await this.supabase
        .from('playbook_templates')
        .select(selectQuery)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get playbooks: ${error.message}`);
      }

      // Sort items by order_index
      if (includeItems) {
        playbooks.forEach(playbook => {
          if (playbook.playbook_items) {
            playbook.playbook_items.sort((a, b) => a.order_index - b.order_index);
          }
        });
      }

      return { success: true, playbooks };

    } catch (error) {
      console.error('Error getting playbooks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get playbook items for a specific playbook
   */
  async getPlaybookItems(playbookId) {
    try {
      const { data: items, error } = await this.supabase
        .from('playbook_items')
        .select('*')
        .eq('playbook_id', playbookId)
        .order('order_index', { ascending: true });

      if (error) {
        throw new Error(`Failed to get playbook items: ${error.message}`);
      }

      return { success: true, items };

    } catch (error) {
      console.error('Error getting playbook items:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a specific playbook item
   */
  async getPlaybookItem(itemId) {
    try {
      const { data: item, error } = await this.supabase
        .from('playbook_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        throw new Error(`Failed to get playbook item: ${error.message}`);
      }

      return { success: true, item };

    } catch (error) {
      console.error('Error getting playbook item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add a new step to an existing playbook
   */
  async addPlaybookStep(playbookId, stepData) {
    try {
      console.log(`Adding step "${stepData.title}" to playbook ${playbookId}`);

      // Get current max order_index
      const { data: existingItems } = await this.supabase
        .from('playbook_items')
        .select('order_index')
        .eq('playbook_id', playbookId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingItems && existingItems.length > 0 
        ? existingItems[0].order_index + 1 
        : 1;

      const stepRecord = {
        playbook_id: playbookId,
        name: stepData.title,
        description: stepData.description,
        item_type: stepData.stepType || 'step',
        order_index: stepData.order || nextOrderIndex,
        is_required: stepData.isRequired !== false,
        estimated_duration_minutes: stepData.estimatedDuration || 5,
        validation_schema: stepData.validationSchema || {},
        component_name: stepData.metadata?.component || null,
        metadata: stepData.metadata || {}
      };

      const { data: newStep, error } = await this.supabase
        .from('playbook_items')
        .insert(stepRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add playbook step: ${error.message}`);
      }

      console.log(`✅ Added step: ${newStep.name}`);
      return { success: true, step: newStep };

    } catch (error) {
      console.error('Error adding playbook step:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing playbook step
   */
  async updatePlaybookStep(itemId, updates) {
    try {
      console.log(`Updating playbook step: ${itemId}`);

      const stepUpdates = {};
      if (updates.title) stepUpdates.name = updates.title;
      if (updates.description) stepUpdates.description = updates.description;
      if (updates.stepType) stepUpdates.item_type = updates.stepType;
      if (updates.order !== undefined) stepUpdates.order_index = updates.order;
      if (updates.isRequired !== undefined) stepUpdates.is_required = updates.isRequired;
      if (updates.estimatedDuration) stepUpdates.estimated_duration_minutes = updates.estimatedDuration;
      if (updates.validationSchema) stepUpdates.validation_schema = updates.validationSchema;
      if (updates.metadata) stepUpdates.metadata = updates.metadata;
      if (updates.metadata?.component) stepUpdates.component_name = updates.metadata.component;

      const { data: updatedStep, error } = await this.supabase
        .from('playbook_items')
        .update(stepUpdates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update playbook step: ${error.message}`);
      }

      console.log(`✅ Updated step: ${updatedStep.name}`);
      return { success: true, step: updatedStep };

    } catch (error) {
      console.error('Error updating playbook step:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a playbook step
   */
  async deletePlaybookStep(itemId) {
    try {
      console.log(`Deleting playbook step: ${itemId}`);

      const { error } = await this.supabase
        .from('playbook_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to delete playbook step: ${error.message}`);
      }

      console.log('✅ Step deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error deleting playbook step:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reorder playbook steps
   */
  async reorderPlaybookSteps(playbookId, stepOrders) {
    try {
      console.log(`Reordering steps for playbook: ${playbookId}`);

      // Update each step's order_index
      for (const { itemId, newOrder } of stepOrders) {
        const { error } = await this.supabase
          .from('playbook_items')
          .update({ order_index: newOrder })
          .eq('id', itemId)
          .eq('playbook_id', playbookId);

        if (error) {
          throw new Error(`Failed to reorder step ${itemId}: ${error.message}`);
        }
      }

      console.log('✅ Steps reordered successfully');
      return { success: true };

    } catch (error) {
      console.error('Error reordering playbook steps:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Duplicate a playbook step
   */
  async duplicatePlaybookStep(itemId, newOrder = null) {
    try {
      console.log(`Duplicating playbook step: ${itemId}`);

      // Get the original step
      const { data: originalStep, error: fetchError } = await this.supabase
        .from('playbook_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to get original step: ${fetchError.message}`);
      }

      // Get next order index if not provided
      let orderIndex = newOrder;
      if (orderIndex === null) {
        const { data: existingItems } = await this.supabase
          .from('playbook_items')
          .select('order_index')
          .eq('playbook_id', originalStep.playbook_id)
          .order('order_index', { ascending: false })
          .limit(1);

        orderIndex = existingItems && existingItems.length > 0 
          ? existingItems[0].order_index + 1 
          : 1;
      }

      // Create duplicate
      const duplicateStep = {
        playbook_id: originalStep.playbook_id,
        name: `${originalStep.name} (Copy)`,
        description: originalStep.description,
        item_type: originalStep.item_type,
        order_index: orderIndex,
        is_required: originalStep.is_required,
        estimated_duration_minutes: originalStep.estimated_duration_minutes,
        validation_schema: originalStep.validation_schema,
        component_name: originalStep.component_name,
        metadata: originalStep.metadata
      };

      const { data: newStep, error: insertError } = await this.supabase
        .from('playbook_items')
        .insert(duplicateStep)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to duplicate step: ${insertError.message}`);
      }

      console.log(`✅ Duplicated step: ${newStep.name}`);
      return { success: true, step: newStep };

    } catch (error) {
      console.error('Error duplicating playbook step:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a specific playbook by ID
   */
  async getPlaybook(playbookId) {
    try {
      const { data: playbook, error } = await this.supabase
        .from('playbook_templates')
        .select(`
          *,
          playbook_items (*)
        `)
        .eq('id', playbookId)
        .single();

      if (error) {
        throw new Error(`Failed to get playbook: ${error.message}`);
      }

      return { success: true, playbook };

    } catch (error) {
      console.error('Error getting playbook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize default playbooks
   */
  async initializeDefaultPlaybooks() {
    console.log('🚀 Initializing default playbooks...');

    const defaultPlaybooks = [
      // User Profile Completion Playbook
      {
        name: 'User Profile Completion',
        description: 'Complete your user profile to get the most out of Nexus',
        category: 'onboarding',
        version: '1.0.0',
        estimatedDuration: 60,
        isActive: true,
        steps: [
          {
            title: 'Basic Information',
            description: 'Tell us about yourself',
            stepType: 'form',
            isRequired: true,
            order: 1,
            estimatedDuration: 3,
            validationSchema: {
              firstName: { type: 'string', required: true, minLength: 1 },
              lastName: { type: 'string', required: true, minLength: 1 },
              displayName: { type: 'string', required: false },
              bio: { type: 'string', required: false, maxLength: 500 }
            },
            metadata: {
              component: 'BasicInfoStep',
              monitoredFields: ['first_name', 'last_name', 'display_name', 'bio'],
              completionCriteria: {
                first_name: { required: true, type: 'string' },
                last_name: { required: true, type: 'string' }
              }
            }
          },
          {
            title: 'Contact Information',
            description: 'How can we reach you?',
            stepType: 'form',
            isRequired: true,
            order: 2,
            estimatedDuration: 2,
            validationSchema: {
              businessEmail: { type: 'string', required: true, format: 'email' },
              personalEmail: { type: 'string', required: false, format: 'email' },
              phone: { type: 'string', required: false },
              mobile: { type: 'string', required: false },
              workPhone: { type: 'string', required: false }
            },
            metadata: {
              component: 'ContactInfoStep',
              monitoredFields: ['business_email', 'personal_email', 'phone', 'mobile', 'work_phone'],
              completionCriteria: {
                business_email: { required: true, type: 'email' }
              }
            }
          },
          {
            title: 'Work Information',
            description: 'Tell us about your role and company',
            stepType: 'form',
            isRequired: true,
            order: 3,
            estimatedDuration: 3,
            validationSchema: {
              jobTitle: { type: 'string', required: true, minLength: 1 },
              department: { type: 'string', required: false },
              workLocation: { type: 'string', required: false, enum: ['office', 'remote', 'hybrid'] },
              timezone: { type: 'string', required: true },
              role: { type: 'string', required: true, enum: ['owner', 'admin', 'manager', 'user'] }
            },
            metadata: {
              component: 'WorkInfoStep',
              monitoredFields: ['job_title', 'department', 'work_location', 'timezone', 'role'],
              completionCriteria: {
                job_title: { required: true, type: 'string' },
                timezone: { required: true, type: 'string' },
                role: { required: true, type: 'string', enum: ['owner', 'admin', 'manager', 'user'] }
              }
            }
          },
          {
            title: 'Social & Professional Links',
            description: 'Connect your professional profiles',
            stepType: 'form',
            isRequired: false,
            order: 4,
            estimatedDuration: 2,
            validationSchema: {
              linkedinUrl: { type: 'string', required: false, format: 'url' },
              githubUrl: { type: 'string', required: false, format: 'url' },
              twitterUrl: { type: 'string', required: false, format: 'url' },
              website: { type: 'string', required: false, format: 'url' }
            },
            metadata: {
              component: 'SocialLinksStep',
              monitoredFields: ['linkedin_url', 'github_url', 'twitter_url', 'website'],
              completionCriteria: {}
            }
          },
          {
            title: 'Skills & Interests',
            description: 'What are you good at?',
            stepType: 'form',
            isRequired: false,
            order: 5,
            estimatedDuration: 2,
            validationSchema: {
              skills: { type: 'array', required: false, items: { type: 'string' } },
              certifications: { type: 'array', required: false, items: { type: 'string' } },
              languages: { type: 'array', required: false, items: { type: 'string' } }
            },
            metadata: {
              component: 'SkillsInterestsStep',
              monitoredFields: ['skills', 'certifications', 'languages'],
              completionCriteria: {}
            }
          },
          {
            title: 'Profile Complete!',
            description: 'Your profile is now set up. Let\'s see what you can do next.',
            stepType: 'completion',
            isRequired: true,
            order: 6,
            estimatedDuration: 1,
            validationSchema: {},
            metadata: {
              component: 'ProfileCompleteStep',
              monitoredFields: ['profile_completion_percentage'],
              completionCriteria: {
                profile_completion_percentage: { required: true, type: 'number', min: 100 }
              }
            }
          }
        ],
        prerequisites: [],
        successMetrics: [
          'Profile completion percentage reaches 100%',
          'All required fields are filled',
          'User understands their role in the system',
          'Professional network is connected'
        ],
        tags: ['profile', 'onboarding', 'setup', 'user-info']
      },

      // Business Onboarding Playbook
      {
        name: 'Business Foundation Setup',
        description: 'Complete your business profile to train Nexus AI with your unique context and goals',
        category: 'onboarding',
        version: '1.0.0',
        estimatedDuration: 1440, // 24 hours
        isActive: true,
        steps: [
          {
            title: 'Welcome to Nexus',
            description: 'Let\'s get you set up with your business foundation',
            stepType: 'introduction',
            isRequired: true,
            order: 1,
            estimatedDuration: 2,
            metadata: {
              component: 'WelcomeStep'
            }
          },
          {
            title: 'About Your Business',
            description: 'Tell us about your business',
            stepType: 'form',
            isRequired: true,
            order: 2,
            estimatedDuration: 5,
            validationSchema: {
              companyName: { type: 'string', required: true, minLength: 1 },
              industry: { type: 'string', required: true },
              companySize: { type: 'string', required: true, enum: ['startup', 'small', 'medium', 'large', 'enterprise'] },
              businessType: { type: 'string', required: true },
              website: { type: 'string', required: false, format: 'url' }
            },
            metadata: {
              component: 'BusinessInfoStep',
              monitoredFields: ['company_name', 'industry', 'company_size', 'business_type', 'website']
            }
          },
          {
            title: 'Your Business Tools',
            description: 'What tools do you currently use?',
            stepType: 'form',
            isRequired: false,
            order: 3,
            estimatedDuration: 3,
            validationSchema: {
              tools: { type: 'array', required: false, items: { type: 'string' } },
              integrations: { type: 'array', required: false, items: { type: 'string' } }
            },
            metadata: {
              component: 'BusinessToolsStep'
            }
          },
          {
            title: 'Your First Insights',
            description: 'Preview your personalized dashboard',
            stepType: 'action',
            isRequired: true,
            order: 4,
            estimatedDuration: 5,
            metadata: {
              component: 'DashboardPreviewStep'
            }
          },
          {
            title: 'What Do You Want to Achieve?',
            description: 'Set your business goals',
            stepType: 'form',
            isRequired: true,
            order: 5,
            estimatedDuration: 3,
            validationSchema: {
              goals: { type: 'array', required: true, items: { type: 'string' } },
              priorities: { type: 'array', required: true, items: { type: 'string' } },
              timeframe: { type: 'string', required: true }
            },
            metadata: {
              component: 'GoalsStep'
            }
          },
          {
            title: 'Your Next Steps',
            description: 'Plan your immediate actions',
            stepType: 'form',
            isRequired: true,
            order: 6,
            estimatedDuration: 2,
            validationSchema: {
              nextActions: { type: 'array', required: true, items: { type: 'string' } },
              timeline: { type: 'string', required: true }
            },
            metadata: {
              component: 'NextStepsStep'
            }
          },
          {
            title: 'Your Business DNA',
            description: 'Define your unique business characteristics',
            stepType: 'form',
            isRequired: false,
            order: 7,
            estimatedDuration: 2,
            validationSchema: {
              values: { type: 'array', required: false, items: { type: 'string' } },
              culture: { type: 'string', required: false },
              mission: { type: 'string', required: false }
            },
            metadata: {
              component: 'BusinessDNAStep'
            }
          },
          {
            title: 'Business Context',
            description: 'Final setup and context gathering',
            stepType: 'form',
            isRequired: true,
            order: 8,
            estimatedDuration: 3,
            validationSchema: {
              challenges: { type: 'array', required: false, items: { type: 'string' } },
              opportunities: { type: 'array', required: false, items: { type: 'string' } },
              marketPosition: { type: 'string', required: false }
            },
            metadata: {
              component: 'BusinessContextStep'
            }
          }
        ],
        prerequisites: [],
        successMetrics: [
          'Business profile completion',
          'Goal setting completion',
          'Tool integration setup',
          'Dashboard activation'
        ],
        tags: ['business', 'onboarding', 'foundation', 'setup']
      }
    ];

    const results = [];
    for (const playbookData of defaultPlaybooks) {
      const result = await this.createPlaybook(playbookData);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n🎉 Default playbooks initialization complete!`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    return results;
  }

  /**
   * Create a playbook from a template file
   */
  async createPlaybookFromTemplate(templatePath) {
    try {
      const fs = await import('fs/promises');
      const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
      return await this.createPlaybook(templateData);
    } catch (error) {
      console.error('Error creating playbook from template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export a playbook to a template file
   */
  async exportPlaybookToTemplate(playbookId, outputPath) {
    try {
      const { playbook } = await this.getPlaybook(playbookId);
      if (!playbook) {
        throw new Error('Playbook not found');
      }

      const templateData = {
        name: playbook.name,
        description: playbook.description,
        category: playbook.category,
        version: playbook.version,
        estimatedDuration: (playbook.estimated_duration_hours || 0) * 60,
        isActive: playbook.is_active,
        steps: playbook.playbook_items?.map(item => ({
          title: item.name,
          description: item.description,
          stepType: item.item_type,
          isRequired: item.is_required,
          order: item.order_index,
          estimatedDuration: item.estimated_duration_minutes,
          validationSchema: item.validation_schema,
          metadata: {
            ...item.metadata,
            component: item.component_name
          }
        })) || [],
        prerequisites: playbook.prerequisites || [],
        successMetrics: [], // TODO: Add to database schema
        tags: [] // TODO: Add to database schema
      };

      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, JSON.stringify(templateData, null, 2));

      return { success: true, templatePath: outputPath };

    } catch (error) {
      console.error('Error exporting playbook to template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

  /**
   * Display playbook details in a formatted way
   */
  async displayPlaybookDetails(playbookId) {
    try {
      const { playbook } = await this.getPlaybook(playbookId);
      if (!playbook) {
        console.error('Playbook not found');
        return;
      }

      console.log(`\n📋 ${playbook.name}`);
      console.log(`   ID: ${playbook.id}`);
      console.log(`   Category: ${playbook.category}`);
      console.log(`   Version: ${playbook.version}`);
      console.log(`   Duration: ${playbook.estimated_duration_hours}h`);
      console.log(`   Active: ${playbook.is_active ? '✅' : '❌'}`);
      console.log(`   Description: ${playbook.description}`);
      
      if (playbook.playbook_items && playbook.playbook_items.length > 0) {
        console.log(`\n   Steps (${playbook.playbook_items.length}):`);
        playbook.playbook_items.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step.name} (${step.item_type})`);
          console.log(`      ID: ${step.id}`);
          console.log(`      Required: ${step.is_required ? '✅' : '❌'}`);
          console.log(`      Duration: ${step.estimated_duration_minutes}m`);
          console.log(`      Component: ${step.component_name || 'N/A'}`);
          console.log(`      Description: ${step.description}`);
          if (step.metadata?.monitoredFields) {
            console.log(`      Monitored Fields: ${step.metadata.monitoredFields.join(', ')}`);
          }
          if (step.metadata?.completionCriteria && Object.keys(step.metadata.completionCriteria).length > 0) {
            console.log(`      Completion Criteria: ${Object.keys(step.metadata.completionCriteria).join(', ')}`);
          }
          console.log('');
        });
      } else {
        console.log('\n   No steps defined');
      }

    } catch (error) {
      console.error('Error displaying playbook details:', error);
    }
  }

  /**
   * Display all playbooks in a summary format
   */
  async displayPlaybooksSummary() {
    try {
      const { playbooks } = await this.getAllPlaybooks(true);
      if (!playbooks || playbooks.length === 0) {
        console.log('No playbooks found');
        return;
      }

      console.log(`\n📚 Available Playbooks (${playbooks.length}):`);
      console.log('=' .repeat(80));
      
      playbooks.forEach((playbook, index) => {
        const stepCount = playbook.playbook_items?.length || 0;
        const totalDuration = playbook.playbook_items?.reduce((sum, step) => 
          sum + (step.estimated_duration_minutes || 0), 0) || 0;
        
        console.log(`${index + 1}. ${playbook.name}`);
        console.log(`   ID: ${playbook.id}`);
        console.log(`   Category: ${playbook.category} | Version: ${playbook.version}`);
        console.log(`   Steps: ${stepCount} | Duration: ${totalDuration}m | Active: ${playbook.is_active ? '✅' : '❌'}`);
        console.log(`   Description: ${playbook.description}`);
        console.log('');
      });

    } catch (error) {
      console.error('Error displaying playbooks summary:', error);
    }
  }

  /**
   * Interactive step editor
   */
  async editStep(stepId) {
    try {
      const { item: step } = await this.getPlaybookItem(stepId);
      if (!step) {
        console.error('Step not found');
        return;
      }

      console.log(`\n✏️  Editing Step: ${step.name}`);
      console.log(`   Current ID: ${step.id}`);
      console.log(`   Current Order: ${step.order_index}`);
      console.log(`   Current Type: ${step.item_type}`);
      console.log(`   Required: ${step.is_required ? 'Yes' : 'No'}`);
      console.log(`   Duration: ${step.estimated_duration_minutes}m`);
      console.log(`   Component: ${step.component_name || 'N/A'}`);
      console.log(`   Description: ${step.description}`);
      
      if (step.metadata?.monitoredFields) {
        console.log(`   Monitored Fields: ${step.metadata.monitoredFields.join(', ')}`);
      }
      
      console.log('\n📝 Step Details:');
      console.log(`   Validation Schema: ${JSON.stringify(step.validation_schema, null, 2)}`);
      console.log(`   Metadata: ${JSON.stringify(step.metadata, null, 2)}`);

    } catch (error) {
      console.error('Error editing step:', error);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new PlaybookManager();
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await manager.initializeDefaultPlaybooks();
      break;
    case 'create':
      const templatePath = process.argv[3];
      if (!templatePath) {
        console.error('Usage: node PlaybookManager.js create <template-path>');
        process.exit(1);
      }
      await manager.createPlaybookFromTemplate(templatePath);
      break;
    case 'list':
      await manager.displayPlaybooksSummary();
      break;
    case 'show':
      const playbookId = process.argv[3];
      if (!playbookId) {
        console.error('Usage: node PlaybookManager.js show <playbook-id>');
        process.exit(1);
      }
      await manager.displayPlaybookDetails(playbookId);
      break;
    case 'steps':
      const stepsPlaybookId = process.argv[3];
      if (!stepsPlaybookId) {
        console.error('Usage: node PlaybookManager.js steps <playbook-id>');
        process.exit(1);
      }
      const { items } = await manager.getPlaybookItems(stepsPlaybookId);
      if (items) {
        console.log(`\n📋 Steps for Playbook ${stepsPlaybookId}:`);
        items.forEach((step, index) => {
          console.log(`${index + 1}. ${step.name} (ID: ${step.id})`);
          console.log(`   Type: ${step.item_type} | Required: ${step.is_required ? 'Yes' : 'No'}`);
          console.log(`   Order: ${step.order_index} | Duration: ${step.estimated_duration_minutes}m`);
          console.log(`   Component: ${step.component_name || 'N/A'}`);
          console.log(`   Description: ${step.description}`);
          console.log('');
        });
      }
      break;
    case 'edit-step':
      const stepId = process.argv[3];
      if (!stepId) {
        console.error('Usage: node PlaybookManager.js edit-step <step-id>');
        process.exit(1);
      }
      await manager.editStep(stepId);
      break;
    case 'add-step':
      const addPlaybookId = process.argv[3];
      const stepTitle = process.argv[4];
      if (!addPlaybookId || !stepTitle) {
        console.error('Usage: node PlaybookManager.js add-step <playbook-id> <step-title>');
        process.exit(1);
      }
      const stepData = {
        title: stepTitle,
        description: 'New step description',
        stepType: 'form',
        isRequired: true,
        estimatedDuration: 5,
        metadata: {
          component: 'NewStepComponent'
        }
      };
      await manager.addPlaybookStep(addPlaybookId, stepData);
      break;
    case 'update-step':
      const updateStepId = process.argv[3];
      const updateField = process.argv[4];
      const updateValue = process.argv[5];
      if (!updateStepId || !updateField || !updateValue) {
        console.error('Usage: node PlaybookManager.js update-step <step-id> <field> <value>');
        console.error('Fields: title, description, stepType, isRequired, estimatedDuration, order');
        process.exit(1);
      }
      const updates = {};
      if (updateField === 'isRequired') {
        updates[updateField] = updateValue === 'true';
      } else if (updateField === 'estimatedDuration' || updateField === 'order') {
        updates[updateField] = parseInt(updateValue);
      } else {
        updates[updateField] = updateValue;
      }
      await manager.updatePlaybookStep(updateStepId, updates);
      break;
    case 'delete-step':
      const deleteStepId = process.argv[3];
      if (!deleteStepId) {
        console.error('Usage: node PlaybookManager.js delete-step <step-id>');
        process.exit(1);
      }
      await manager.deletePlaybookStep(deleteStepId);
      break;
    case 'duplicate-step':
      const duplicateStepId = process.argv[3];
      if (!duplicateStepId) {
        console.error('Usage: node PlaybookManager.js duplicate-step <step-id>');
        process.exit(1);
      }
      await manager.duplicatePlaybookStep(duplicateStepId);
      break;
    case 'export':
      const exportPlaybookId = process.argv[3];
      const exportOutputPath = process.argv[4];
      if (!exportPlaybookId || !exportOutputPath) {
        console.error('Usage: node PlaybookManager.js export <playbook-id> <output-path>');
        process.exit(1);
      }
      await manager.exportPlaybookToTemplate(exportPlaybookId, exportOutputPath);
      break;
    default:
      console.log('Available commands:');
      console.log('  init                    - Initialize default playbooks');
      console.log('  create <path>           - Create playbook from template file');
      console.log('  list                    - List all playbooks (summary)');
      console.log('  show <playbook-id>      - Show detailed playbook information');
      console.log('  steps <playbook-id>     - List steps for a playbook');
      console.log('  edit-step <step-id>     - Edit step details');
      console.log('  add-step <playbook-id> <title> - Add new step to playbook');
      console.log('  update-step <step-id> <field> <value> - Update step field');
      console.log('  delete-step <step-id>   - Delete a step');
      console.log('  duplicate-step <step-id> - Duplicate a step');
      console.log('  export <id> <path>      - Export playbook to template file');
      console.log('');
      console.log('Examples:');
      console.log('  node PlaybookManager.js list');
      console.log('  node PlaybookManager.js show <playbook-id>');
      console.log('  node PlaybookManager.js steps <playbook-id>');
      console.log('  node PlaybookManager.js add-step <playbook-id> "New Step"');
      console.log('  node PlaybookManager.js update-step <step-id> title "Updated Title"');
      console.log('  node PlaybookManager.js update-step <step-id> isRequired false');
  }
}
