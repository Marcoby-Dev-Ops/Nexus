/**
 * Adapter Registry
 * 
 * Central registry for all integration adapters with metadata and capabilities.
 */

export interface AdapterMetadata {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api_key' | 'webhook';
  scopes: string[];
  capabilities: string[];
  setupTime: string;
  isPopular?: boolean;
  category: string;
}

export interface Adapter {
  id: string;
  metadata: AdapterMetadata;
  connect: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  sync: () => Promise<{ success: boolean; recordsProcessed: number; error?: string }>;
}

class AdapterRegistry {
  private adapters = new Map<string, Adapter>();

  /**
   * Register an adapter
   */
  register(adapter: Adapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get an adapter by ID
   */
  get(id: string): Adapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all adapters
   */
  getAll(): Adapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters by category
   */
  getByCategory(category: string): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.category === category);
  }

  /**
   * Get popular adapters
   */
  getPopular(): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.isPopular);
  }

  /**
   * Get adapters by auth type
   */
  getByAuthType(authType: string): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.authType === authType);
  }

  /**
   * Check if adapter exists
   */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Get adapter metadata
   */
  getMetadata(id: string): AdapterMetadata | undefined {
    const adapter = this.get(id);
    return adapter?.metadata;
  }
}

// Create singleton instance
export const adapterRegistry = new AdapterRegistry();

// Register default adapters
const defaultAdapters: Adapter[] = [
  {
    id: 'hubspot',
    metadata: {
      name: 'hubspot',
      displayName: 'HubSpot',
      description: 'CRM and marketing automation platform',
      icon: 'hubspot',
      authType: 'oauth',
      scopes: ['contacts', 'companies', 'deals'],
      capabilities: ['CRM', 'Marketing', 'Sales'],
      setupTime: '5 minutes',
      isPopular: true,
      category: 'CRM'
    },
    connect: async () => ({ success: true }),
    disconnect: async () => ({ success: true }),
    testConnection: async () => ({ success: true }),
    sync: async () => ({ success: true, recordsProcessed: 0 })
  },
  {
    id: 'google_workspace',
    metadata: {
      name: 'google_workspace',
      displayName: 'Google Workspace',
      description: 'Email, calendar, and productivity tools',
      icon: 'google',
      authType: 'oauth',
      scopes: ['gmail', 'calendar', 'drive'],
      capabilities: ['Email', 'Calendar', 'Storage'],
      setupTime: '3 minutes',
      isPopular: true,
      category: 'Productivity'
    },
    connect: async () => ({ success: true }),
    disconnect: async () => ({ success: true }),
    testConnection: async () => ({ success: true }),
    sync: async () => ({ success: true, recordsProcessed: 0 })
  },
  {
    id: 'microsoft_365',
    metadata: {
      name: 'microsoft_365',
      displayName: 'Microsoft 365',
      description: 'Office productivity and collaboration tools',
      icon: 'microsoft',
      authType: 'oauth',
      scopes: ['mail', 'calendar', 'files'],
      capabilities: ['Email', 'Calendar', 'Documents'],
      setupTime: '5 minutes',
      isPopular: true,
      category: 'Productivity'
    },
    connect: async () => ({ success: true }),
    disconnect: async () => ({ success: true }),
    testConnection: async () => ({ success: true }),
    sync: async () => ({ success: true, recordsProcessed: 0 })
  }
];

// Register default adapters
defaultAdapters.forEach(adapter => adapterRegistry.register(adapter)); 