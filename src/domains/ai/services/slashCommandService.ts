/**
 * Slash Command Service
 * Manages slash commands for the AI chat interface
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export interface SlashCommand {
  slug: string;
  title: string;
  description?: string;
  category?: string;
  templateData?: Record<string, any>;
  isActive?: boolean;
  usageCount?: number;
  lastUsed?: Date;
}

export interface SlashCommandFilter {
  category?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export interface SlashCommandUsage {
  commandSlug: string;
  userId: string;
  timestamp: Date;
  context?: Record<string, any>;
}

class SlashCommandService {
  private static instance: SlashCommandService;
  private commandCache: Map<string, SlashCommand> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private lastCacheUpdate = 0;

  private constructor() {
    // Only initialize cache if we're not on a public page
    if (typeof window !== 'undefined' && !this.isPublicPage()) {
      this.initializeCache();
    }
  }

  private isPublicPage(): boolean {
    if (typeof window === 'undefined') return false;
    const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
    return publicRoutes.some(route => window.location.pathname.startsWith(route));
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SlashCommandService {
    if (!SlashCommandService.instance) {
      SlashCommandService.instance = new SlashCommandService();
    }
    return SlashCommandService.instance;
  }

  /**
   * Initialize command cache
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.refreshCache();
      logger.info('Slash command cache initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize slash command cache');
    }
  }

  /**
   * Refresh command cache
   */
  private async refreshCache(): Promise<void> {
    try {
      const commands = await this.fetchCommandsFromDatabase();
      this.commandCache.clear();
      
      commands.forEach(command => {
        this.commandCache.set(command.slug, command);
      });
      
      this.lastCacheUpdate = Date.now();
      logger.debug({ commandCount: commands.length }, 'Refreshed slash command cache');
    } catch (error) {
      logger.error({ error }, 'Failed to refresh command cache');
      // Fallback to static commands
      this.loadStaticCommands();
    }
  }

  /**
   * Fetch commands from database
   */
  private async fetchCommandsFromDatabase(): Promise<SlashCommand[]> {
    try {
      const { data, error } = await supabase
        .from('ai_action_card_templates')
        .select('slug, title, description, category, template_data, is_active, usage_count, last_used')
        .eq('is_active', true)
        .order('title');

      if (error) {
        logger.error({ error }, 'Failed to fetch slash commands from database');
        throw error;
      }

      if (!data || data.length === 0) {
        logger.warn('No slash commands found in database, using static commands');
        return this.getStaticCommands();
      }

      return data.map(template => ({
        slug: template.slug,
        title: template.title,
        description: template.description || undefined,
        category: template.category || undefined,
        templateData: template.template_data || undefined,
        isActive: template.is_active ?? true,
        usageCount: template.usage_count || 0,
        lastUsed: template.last_used ? new Date(template.last_used) : undefined
      }));
    } catch (error) {
      logger.error({ error }, 'Error fetching commands from database');
      return this.getStaticCommands();
    }
  }

  /**
   * Load static commands into cache
   */
  private loadStaticCommands(): void {
    const staticCommands = this.getStaticCommands();
    staticCommands.forEach(command => {
      this.commandCache.set(command.slug, command);
    });
    logger.info({ commandCount: staticCommands.length }, 'Loaded static slash commands');
  }

  /**
   * Get all available slash commands
   */
  async getSlashCommands(filter?: SlashCommandFilter): Promise<SlashCommand[]> {
    try {
      // Refresh cache if it's stale
      if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
        await this.refreshCache();
      }

      let commands = Array.from(this.commandCache.values());

      // Apply filters
      if (filter) {
        commands = this.filterCommands(commands, filter);
      }

      return commands;
    } catch (error) {
      logger.error({ error }, 'Error getting slash commands');
      return this.getStaticCommands();
    }
  }

  /**
   * Filter commands based on criteria
   */
  private filterCommands(commands: SlashCommand[], filter: SlashCommandFilter): SlashCommand[] {
    return commands.filter(command => {
      // Category filter
      if (filter.category && command.category !== filter.category) {
        return false;
      }

      // Active status filter
      if (filter.isActive !== undefined && command.isActive !== filter.isActive) {
        return false;
      }

      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesTitle = command.title.toLowerCase().includes(searchLower);
        const matchesDescription = command.description?.toLowerCase().includes(searchLower) || false;
        const matchesSlug = command.slug.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesSlug) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get command by slug
   */
  async getCommandBySlug(slug: string): Promise<SlashCommand | null> {
    try {
      // Refresh cache if it's stale
      if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
        await this.refreshCache();
      }

      return this.commandCache.get(slug) || null;
    } catch (error) {
      logger.error({ slug, error }, 'Error getting command by slug');
      return null;
    }
  }

  /**
   * Track command usage
   */
  async trackCommandUsage(usage: SlashCommandUsage): Promise<void> {
    try {
      // Update usage in database
      const { error: updateError } = await supabase
        .from('ai_action_card_templates')
        .update({
          usagecount: supabase.sql`usage_count + 1`,
          lastused: new Date().toISOString()
        })
        .eq('slug', usage.commandSlug);

      if (updateError) {
        logger.error({ usage, error: updateError }, 'Failed to update command usage');
      }

      // Log usage for analytics
      logger.info({ 
        commandSlug: usage.commandSlug, 
        userId: usage.userId,
        context: usage.context 
      }, 'Slash command used');

      // Update cache
      const command = this.commandCache.get(usage.commandSlug);
      if (command) {
        command.usageCount = (command.usageCount || 0) + 1;
        command.lastUsed = new Date();
      }
    } catch (error) {
      logger.error({ usage, error }, 'Error tracking command usage');
    }
  }

  /**
   * Search commands
   */
  async searchCommands(query: string, limit: number = 10): Promise<SlashCommand[]> {
    try {
      const commands = await this.getSlashCommands();
      
      if (!query.trim()) {
        return commands.slice(0, limit);
      }

      const queryLower = query.toLowerCase();
      const scoredCommands = commands.map(command => {
        let score = 0;
        
        // Exact matches get highest score
        if (command.slug === queryLower) score += 100;
        if (command.title.toLowerCase() === queryLower) score += 90;
        
        // Partial matches
        if (command.slug.includes(queryLower)) score += 50;
        if (command.title.toLowerCase().includes(queryLower)) score += 40;
        if (command.description?.toLowerCase().includes(queryLower)) score += 30;
        
        // Category matches
        if (command.category?.toLowerCase().includes(queryLower)) score += 20;
        
        return { command, score };
      });

      return scoredCommands
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.command);
    } catch (error) {
      logger.error({ query, error }, 'Error searching commands');
      return [];
    }
  }

  /**
   * Get popular commands
   */
  async getPopularCommands(limit: number = 5): Promise<SlashCommand[]> {
    try {
      const commands = await this.getSlashCommands();
      
      return commands
        .filter(command => command.usageCount && command.usageCount > 0)
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, limit);
    } catch (error) {
      logger.error({ error }, 'Error getting popular commands');
      return [];
    }
  }

  /**
   * Get commands by category
   */
  async getCommandsByCategory(category: string): Promise<SlashCommand[]> {
    return this.getSlashCommands({ category });
  }

  /**
   * Validate command slug
   */
  validateCommandSlug(slug: string): boolean {
    // Slash commands should start with / and contain only alphanumeric characters, hyphens, and underscores
    const slugRegex = /^\/[a-zA-Z0-9_-]+$/;
    return slugRegex.test(slug);
  }

  /**
   * Get command suggestions based on partial input
   */
  async getCommandSuggestions(partialInput: string, limit: number = 5): Promise<SlashCommand[]> {
    try {
      if (!partialInput.startsWith('/')) {
        return [];
      }

      const query = partialInput.slice(1); // Remove leading slash
      return this.searchCommands(query, limit);
    } catch (error) {
      logger.error({ partialInput, error }, 'Error getting command suggestions');
      return [];
    }
  }

  /**
   * Static fallback commands for when database is unavailable
   */
  private getStaticCommands(): SlashCommand[] {
    return [
      { 
        slug: 'create-task', 
        title: 'Create Task', 
        description: 'Create a task in your PM tool', 
        category: 'productivity',
        isActive: true,
        usageCount: 0
      },
      { 
        slug: 'send-invoice', 
        title: 'Send Invoice', 
        description: 'Send a Stripe invoice', 
        category: 'finance',
        isActive: true,
        usageCount: 0
      },
      { 
        slug: 'update-crm', 
        title: 'Update CRM', 
        description: 'Update a customer record in HubSpot', 
        category: 'sales',
        isActive: true,
        usageCount: 0
      },
      { 
        slug: 'run-report', 
        title: 'Run Report', 
        description: 'Generate business health report', 
        category: 'analytics',
        isActive: true,
        usageCount: 0
      },
      { 
        slug: 'schedule-meeting', 
        title: 'Schedule Meeting', 
        description: 'Schedule a meeting with team members', 
        category: 'productivity',
        isActive: true,
        usageCount: 0
      },
      { 
        slug: 'analyze-data', 
        title: 'Analyze Data', 
        description: 'Analyze business data and generate insights', 
        category: 'analytics',
        isActive: true,
        usageCount: 0
      }
    ];
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalCommands: number; lastUpdate: Date; cacheAge: number } {
    const now = Date.now();
    return {
      totalCommands: this.commandCache.size,
      lastUpdate: new Date(this.lastCacheUpdate),
      cacheAge: now - this.lastCacheUpdate
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.commandCache.clear();
    this.lastCacheUpdate = 0;
    logger.info('Cleared slash command cache');
  }

  /**
   * Force refresh cache
   */
  async forceRefreshCache(): Promise<void> {
    await this.refreshCache();
  }
}

// Export singleton instance
export const slashCommandService = SlashCommandService.getInstance();

// Export convenience functions
export const getSlashCommands = (filter?: SlashCommandFilter) => slashCommandService.getSlashCommands(filter);
export const filterSlashCommands = (commands: SlashCommand[], filter: SlashCommandFilter) => slashCommandService['filterCommands'](commands, filter); 