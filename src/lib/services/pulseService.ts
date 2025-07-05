/**
 * Pulse Integration Service
 * Integrates with Pulse client management platform for project and client data
 * Pillar: 1,2 - Automated client management and business health assessment
 */

import { supabase } from '../core/supabase';
import { logger } from '../security/logger';

export interface PulseConfig {
  apiKey: string;
  baseUrl: string;
  organizationId: string;
}

export interface PulseClient {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive' | 'prospect';
  totalValue: number;
  projectsCount: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes?: string;
}

export interface PulseProject {
  id: string;
  name: string;
  clientId: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  budget: number;
  timeSpent: number;
  timeEstimate: number;
  startDate: string;
  endDate?: string;
  completionPercentage: number;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PulseInvoice {
  id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export interface PulseMetrics {
  clients: {
    total: number;
    active: number;
    prospects: number;
    newThisMonth: number;
    churnRate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onTime: number;
    overBudget: number;
    avgCompletionRate: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurring: number;
    outstandingInvoices: number;
    avgProjectValue: number;
    revenueGrowth: number;
  };
  productivity: {
    billableHours: number;
    utilization: number;
    avgHourlyRate: number;
    projectEfficiency: number;
  };
}

export class PulseService {
  private config: PulseConfig | null = null;

  async initialize(): Promise<boolean> {
    try {
      const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('config, credentials')
        .eq('integration_slug', 'pulse')
        .eq('status', 'active')
        .maybeSingle();

      if (error || !integration) {
        logger.warn('Pulse integration not found or inactive');
        return false;
      }

      this.config = {
        apiKey: integration.credentials?.api_key,
        baseUrl: integration.config?.base_url || 'https://api.pulse.marcoby.com',
        organizationId: integration.config?.organization_id
      };

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Pulse service');
      return false;
    }
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config?.apiKey) {
      throw new Error('Pulse not properly configured');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Organization-ID': this.config.organizationId,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Pulse API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test connection to Pulse API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.apiRequest('/api/v1/health');
      return { success: true, message: 'Connected to Pulse successfully' };
    } catch (error) {
      logger.error({ error }, 'Failed to test Pulse connection');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Get all clients from Pulse
   */
  async getClients(): Promise<PulseClient[]> {
    try {
      const response = await this.apiRequest('/api/v1/clients');
      return response.data || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Pulse clients');
      return [];
    }
  }

  /**
   * Get client by ID
   */
  async getClient(clientId: string): Promise<PulseClient | null> {
    try {
      const response = await this.apiRequest(`/api/v1/clients/${clientId}`);
      return response.data || null;
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to fetch Pulse client');
      return null;
    }
  }

  /**
   * Get projects for a client or all projects
   */
  async getProjects(clientId?: string): Promise<PulseProject[]> {
    try {
      const endpoint = clientId 
        ? `/api/v1/clients/${clientId}/projects`
        : '/api/v1/projects';
      
      const response = await this.apiRequest(endpoint);
      return response.data || [];
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to fetch Pulse projects');
      return [];
    }
  }

  /**
   * Get invoices for a client or all invoices
   */
  async getInvoices(clientId?: string): Promise<PulseInvoice[]> {
    try {
      const endpoint = clientId 
        ? `/api/v1/clients/${clientId}/invoices`
        : '/api/v1/invoices';
      
      const response = await this.apiRequest(endpoint);
      return response.data || [];
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to fetch Pulse invoices');
      return [];
    }
  }

  /**
   * Get comprehensive metrics from Pulse
   */
  async getMetrics(): Promise<PulseMetrics> {
    try {
      const [clients, projects, invoices] = await Promise.all([
        this.getClients(),
        this.getProjects(),
        this.getInvoices()
      ]);

      // Calculate client metrics
      const activeClients = clients.filter(c => c.status === 'active');
      const prospects = clients.filter(c => c.status === 'prospect');
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const newClientsThisMonth = clients.filter(c => 
        new Date(c.createdAt) >= currentMonth
      ).length;

      // Calculate project metrics
      const activeProjects = projects.filter(p => p.status === 'active');
      const completedProjects = projects.filter(p => p.status === 'completed');
      const onTimeProjects = completedProjects.filter(p => 
        p.endDate && new Date(p.endDate) <= new Date(p.endDate) // Simplified logic
      ).length;
      
      const avgCompletionRate = projects.length > 0 
        ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
        : 0;

      // Calculate revenue metrics
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
      const outstandingAmount = invoices
        .filter(i => ['sent', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + i.amount, 0);

      const avgProjectValue = completedProjects.length > 0
        ? completedProjects.reduce((sum, p) => sum + p.budget, 0) / completedProjects.length
        : 0;

      // Calculate productivity metrics
      const totalTimeSpent = projects.reduce((sum, p) => sum + p.timeSpent, 0);
      const totalTimeEstimate = projects.reduce((sum, p) => sum + p.timeEstimate, 0);
      const projectEfficiency = totalTimeEstimate > 0 
        ? (totalTimeSpent / totalTimeEstimate) * 100
        : 100;

      return {
        clients: {
          total: clients.length,
          active: activeClients.length,
          prospects: prospects.length,
          newThisMonth: newClientsThisMonth,
          churnRate: 0 // Would need historical data to calculate
        },
        projects: {
          total: projects.length,
          active: activeProjects.length,
          completed: completedProjects.length,
          onTime: onTimeProjects,
          overBudget: 0, // Would need budget tracking
          avgCompletionRate: Math.round(avgCompletionRate)
        },
        revenue: {
          totalRevenue,
          monthlyRecurring: 0, // Would need subscription tracking
          outstandingInvoices: outstandingAmount,
          avgProjectValue,
          revenueGrowth: 0 // Would need historical data
        },
        productivity: {
          billableHours: totalTimeSpent,
          utilization: 85, // Would need team capacity data
          avgHourlyRate: totalRevenue > 0 && totalTimeSpent > 0 
            ? totalRevenue / totalTimeSpent 
            : 0,
          projectEfficiency: Math.round(projectEfficiency)
        }
      };

    } catch (error) {
      logger.error({ error }, 'Failed to calculate Pulse metrics');
      throw error;
    }
  }

  /**
   * Create a new client
   */
  async createClient(clientData: Partial<PulseClient>): Promise<PulseClient> {
    try {
      const response = await this.apiRequest('/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify(clientData)
      });
      
      return response.data;
    } catch (error) {
      logger.error({ error, clientData }, 'Failed to create Pulse client');
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Partial<PulseProject>): Promise<PulseProject> {
    try {
      const response = await this.apiRequest('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      
      return response.data;
    } catch (error) {
      logger.error({ error, projectData }, 'Failed to create Pulse project');
      throw error;
    }
  }

  /**
   * Update business health KPIs with Pulse data
   */
  async updateBusinessHealthKPIs(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      
      const snapshots = [
        // Client Acquisition KPI
        {
          department_id: 'sales',
          kpi_id: 'client_acquisition',
          value: metrics.clients.newThisMonth,
          source: 'pulse_api',
          captured_at: new Date().toISOString(),
          metadata: {
            total_clients: metrics.clients.total,
            active_clients: metrics.clients.active,
            prospects: metrics.clients.prospects,
            churn_rate: metrics.clients.churnRate
          }
        },
        // Project Delivery KPI
        {
          department_id: 'operations',
          kpi_id: 'project_delivery',
          value: metrics.projects.avgCompletionRate,
          source: 'pulse_api',
          captured_at: new Date().toISOString(),
          metadata: {
            active_projects: metrics.projects.active,
            completed_projects: metrics.projects.completed,
            on_time_projects: metrics.projects.onTime,
            project_efficiency: metrics.productivity.projectEfficiency
          }
        },
        // Revenue Growth KPI
        {
          department_id: 'finance',
          kpi_id: 'revenue_growth',
          value: metrics.revenue.totalRevenue,
          source: 'pulse_api',
          captured_at: new Date().toISOString(),
          metadata: {
            monthly_recurring: metrics.revenue.monthlyRecurring,
            outstanding_invoices: metrics.revenue.outstandingInvoices,
            avg_project_value: metrics.revenue.avgProjectValue,
            billable_hours: metrics.productivity.billableHours
          }
        }
      ];

      // Update using the secure edge function
      const { error } = await supabase.functions.invoke('upsert_kpis', {
        body: { snapshots }
      });

      if (error) {
        logger.error({ error }, 'Failed to update Pulse KPIs');
        throw error;
      }

      logger.info('Successfully updated business health KPIs with Pulse data');

    } catch (error) {
      logger.error({ error }, 'Error updating Pulse business health KPIs');
      throw error;
    }
  }

  /**
   * Get key metrics for dashboard display
   */
  async getKeyMetrics(): Promise<Array<{
    name: string;
    value: string | number;
    trend: 'up' | 'down' | 'stable';
    unit?: string;
  }>> {
    const metrics = await this.getMetrics();

    return [
      {
        name: 'Active Clients',
        value: metrics.clients.active,
        trend: metrics.clients.newThisMonth > 0 ? 'up' : 'stable',
        unit: 'clients'
      },
      {
        name: 'Active Projects',
        value: metrics.projects.active,
        trend: 'stable',
        unit: 'projects'
      },
      {
        name: 'Project Completion',
        value: `${metrics.projects.avgCompletionRate}%`,
        trend: metrics.projects.avgCompletionRate > 80 ? 'up' : 'down',
        unit: '%'
      },
      {
        name: 'Total Revenue',
        value: `$${metrics.revenue.totalRevenue.toLocaleString()}`,
        trend: 'up',
        unit: 'USD'
      },
      {
        name: 'Outstanding Invoices',
        value: `$${metrics.revenue.outstandingInvoices.toLocaleString()}`,
        trend: metrics.revenue.outstandingInvoices > 0 ? 'down' : 'up',
        unit: 'USD'
      }
    ];
  }
}

export const pulseService = new PulseService(); 