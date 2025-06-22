import type { SlashCommand } from '@/lib/services/slashCommandService';

/**
 * Static command registry for slash commands
 * This provides fallback commands when the database is unavailable
 */
export const COMMAND_REGISTRY: SlashCommand[] = [
  {
    slug: 'create-task',
    title: 'Create Task',
    description: 'Create a task in your project management tool',
    category: 'productivity',
    templateData: {
      type: 'task',
      fields: ['title', 'description', 'priority', 'assignee']
    }
  },
  {
    slug: 'send-invoice',
    title: 'Send Invoice',
    description: 'Send a Stripe invoice to a customer',
    category: 'finance',
    templateData: {
      type: 'invoice',
      fields: ['customer_email', 'amount', 'description', 'due_date']
    }
  },
  {
    slug: 'update-crm',
    title: 'Update CRM',
    description: 'Update a customer record in HubSpot',
    category: 'sales',
    templateData: {
      type: 'crm_update',
      fields: ['contact_id', 'field_name', 'field_value']
    }
  },
  {
    slug: 'run-report',
    title: 'Run Report',
    description: 'Generate business health report',
    category: 'analytics',
    templateData: {
      type: 'report',
      fields: ['report_type', 'date_range', 'metrics']
    }
  },
  {
    slug: 'schedule-meeting',
    title: 'Schedule Meeting',
    description: 'Schedule a meeting with automatic calendar invite',
    category: 'productivity',
    templateData: {
      type: 'meeting',
      fields: ['attendees', 'title', 'duration', 'agenda']
    }
  },
  {
    slug: 'create-lead',
    title: 'Create Lead',
    description: 'Add a new lead to your CRM pipeline',
    category: 'sales',
    templateData: {
      type: 'lead',
      fields: ['name', 'email', 'company', 'source']
    }
  },
  {
    slug: 'sync-data',
    title: 'Sync Data',
    description: 'Sync data between integrated platforms',
    category: 'automation',
    templateData: {
      type: 'sync',
      fields: ['source_platform', 'target_platform', 'data_type']
    }
  },
  {
    slug: 'send-email',
    title: 'Send Email',
    description: 'Send an email using your connected email service',
    category: 'communication',
    templateData: {
      type: 'email',
      fields: ['to', 'subject', 'body', 'template']
    }
  }
];

/**
 * Get command by slug
 */
export function getCommandBySlug(slug: string): SlashCommand | undefined {
  return COMMAND_REGISTRY.find(cmd => cmd.slug === slug);
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: string): SlashCommand[] {
  return COMMAND_REGISTRY.filter(cmd => cmd.category === category);
}

/**
 * Get all available categories
 */
export function getCommandCategories(): string[] {
  const categories = new Set(
    COMMAND_REGISTRY
      .map(cmd => cmd.category)
      .filter((category): category is string => Boolean(category))
  );
  return Array.from(categories).sort();
} 