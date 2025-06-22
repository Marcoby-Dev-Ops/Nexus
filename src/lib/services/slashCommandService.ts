import { supabase } from '../supabase';

export interface SlashCommand {
  slug: string;       // the token inserted (after the '/')
  title: string;      // human-readable name
  description?: string;
  category?: string;
  templateData?: Record<string, any>;
}

/**
 * Fetch available slash commands from Action Card templates
 */
export async function fetchSlashCommands(): Promise<SlashCommand[]> {
  try {
    const { data, error } = await supabase
      .from('ai_action_card_templates')
      .select('slug, title, description, category, template_data')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('[SlashCommands] Failed to fetch templates:', error);
      // Fall back to static commands if database fetch fails
      return getStaticCommands();
    }

    if (!data || data.length === 0) {
      console.warn('[SlashCommands] No templates found, using static commands');
      return getStaticCommands();
    }

    return data.map(template => ({
      slug: template.slug,
      title: template.title,
      description: template.description || undefined,
      category: template.category || undefined,
      templateData: template.template_data || undefined,
    }));
  } catch (error) {
    console.error('[SlashCommands] Error fetching templates:', error);
    return getStaticCommands();
  }
}

/**
 * Static fallback commands for when database is unavailable
 */
function getStaticCommands(): SlashCommand[] {
  return [
    { slug: 'create-task', title: 'Create Task', description: 'Create a task in your PM tool', category: 'productivity' },
    { slug: 'send-invoice', title: 'Send Invoice', description: 'Send a Stripe invoice', category: 'finance' },
    { slug: 'update-crm', title: 'Update CRM', description: 'Update a customer record in HubSpot', category: 'sales' },
    { slug: 'run-report', title: 'Run Report', description: 'Generate business health report', category: 'analytics' },
  ];
}

/**
 * Cache for slash commands to avoid repeated database calls
 */
let cachedCommands: SlashCommand[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get slash commands with caching
 */
export async function getSlashCommands(): Promise<SlashCommand[]> {
  const now = Date.now();
  
  // Return cached commands if they're still fresh
  if (cachedCommands && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCommands;
  }

  // Fetch fresh commands
  const commands = await fetchSlashCommands();
  cachedCommands = commands;
  cacheTimestamp = now;
  
  return commands;
}

/**
 * Clear the cache (useful for testing or when templates are updated)
 */
export function clearSlashCommandsCache(): void {
  cachedCommands = null;
  cacheTimestamp = 0;
}

/**
 * Filter commands by query string
 */
export function filterSlashCommands(commands: SlashCommand[], query: string): SlashCommand[] {
  if (!query.trim()) return commands;
  
  const lowerQuery = query.toLowerCase();
  return commands.filter(cmd => 
    cmd.slug.toLowerCase().includes(lowerQuery) ||
    cmd.title.toLowerCase().includes(lowerQuery) ||
    (cmd.description && cmd.description.toLowerCase().includes(lowerQuery))
  );
} 