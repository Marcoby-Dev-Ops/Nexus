/**
 * Waitlist Service
 * Manages waitlist entries and onboarding queue
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

export interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  industry?: string;
  referralSource?: string;
  status: 'pending' | 'approved' | 'rejected' | 'onboarded';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  joinDate: string;
  approvedDate?: string;
  onboardedDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface WaitlistStats {
  totalEntries: number;
  pendingEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  onboardedEntries: number;
  averageWaitTime: number; // in days
  conversionRate: number; // percentage
  topReferralSources: Array<{
    source: string;
    count: number;
    conversionRate: number;
  }>;
}

export interface WaitlistFilter {
  status?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  referralSource?: string;
  industry?: string;
}

export class WaitlistService extends BaseService {
  private waitlistEntries: Map<string, WaitlistEntry> = new Map();

  constructor() {
    super();
    this.loadWaitlistData();
  }

  /**
   * Add entry to waitlist
   */
  async addWaitlistEntry(entry: Omit<WaitlistEntry, 'id' | 'joinDate' | 'status'>): Promise<ServiceResponse<string>> {
    const emailValidation = this.validateRequiredParam(entry.email, 'email');
    if (emailValidation) {
      return this.createErrorResponse(emailValidation);
    }

    const firstNameValidation = this.validateRequiredParam(entry.firstName, 'firstName');
    if (firstNameValidation) {
      return this.createErrorResponse(firstNameValidation);
    }

    const lastNameValidation = this.validateRequiredParam(entry.lastName, 'lastName');
    if (lastNameValidation) {
      return this.createErrorResponse(lastNameValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Check if email already exists
          const existingEntry = Array.from(this.waitlistEntries.values()).find(
            e => e.email.toLowerCase() === entry.email.toLowerCase()
          );

          if (existingEntry) {
            return { data: '', error: 'Email already exists in waitlist' };
          }

          const newEntry: WaitlistEntry = {
            ...entry,
            id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            joinDate: new Date().toISOString()
          };

          this.waitlistEntries.set(newEntry.id, newEntry);
          await this.saveWaitlistData();

          return { data: newEntry.id, error: null };
        } catch (error) {
          return { data: '', error: error instanceof Error ? error.message : 'Failed to add waitlist entry' };
        }
      },
      'addWaitlistEntry'
    );
  }

  /**
   * Get waitlist entry by ID
   */
  async getWaitlistEntry(entryId: string): Promise<ServiceResponse<WaitlistEntry | null>> {
    const validation = this.validateIdParam(entryId, 'entryId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const entry = this.waitlistEntries.get(entryId) || null;
          return { data: entry, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to get waitlist entry' };
        }
      },
      'getWaitlistEntry'
    );
  }

  /**
   * Get all waitlist entries
   */
  async getWaitlistEntries(filter?: WaitlistFilter): Promise<ServiceResponse<WaitlistEntry[]>> {
    return this.executeDbOperation(
      async () => {
        try {
          let entries = Array.from(this.waitlistEntries.values());

          // Apply filters
          if (filter) {
            if (filter.status) {
              entries = entries.filter(e => e.status === filter.status);
            }
            if (filter.priority) {
              entries = entries.filter(e => e.priority === filter.priority);
            }
            if (filter.referralSource) {
              entries = entries.filter(e => e.referralSource === filter.referralSource);
            }
            if (filter.industry) {
              entries = entries.filter(e => e.industry === filter.industry);
            }
            if (filter.dateRange) {
              entries = entries.filter(e => {
                const joinDate = new Date(e.joinDate);
                const startDate = new Date(filter.dateRange!.start);
                const endDate = new Date(filter.dateRange!.end);
                return joinDate >= startDate && joinDate <= endDate;
              });
            }
          }

          // Sort by join date (newest first)
          entries.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

          return { data: entries, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get waitlist entries' };
        }
      },
      'getWaitlistEntries'
    );
  }

  /**
   * Update waitlist entry status
   */
  async updateWaitlistEntryStatus(entryId: string, status: WaitlistEntry['status'], notes?: string): Promise<ServiceResponse<void>> {
    const entryIdValidation = this.validateIdParam(entryId, 'entryId');
    if (entryIdValidation) {
      return this.createErrorResponse(entryIdValidation);
    }

    const statusValidation = this.validateRequiredParam(status, 'status');
    if (statusValidation) {
      return this.createErrorResponse(statusValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const entry = this.waitlistEntries.get(entryId);
          if (!entry) {
            return { data: null, error: 'Waitlist entry not found' };
          }

          entry.status = status;
          entry.notes = notes;

          // Update relevant dates
          if (status === 'approved' && !entry.approvedDate) {
            entry.approvedDate = new Date().toISOString();
          } else if (status === 'onboarded' && !entry.onboardedDate) {
            entry.onboardedDate = new Date().toISOString();
          }

          await this.saveWaitlistData();

          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to update waitlist entry status' };
        }
      },
      'updateWaitlistEntryStatus'
    );
  }

  /**
   * Update waitlist entry priority
   */
  async updateWaitlistEntryPriority(entryId: string, priority: WaitlistEntry['priority']): Promise<ServiceResponse<void>> {
    const entryIdValidation = this.validateIdParam(entryId, 'entryId');
    if (entryIdValidation) {
      return this.createErrorResponse(entryIdValidation);
    }

    const priorityValidation = this.validateRequiredParam(priority, 'priority');
    if (priorityValidation) {
      return this.createErrorResponse(priorityValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const entry = this.waitlistEntries.get(entryId);
          if (!entry) {
            return { data: null, error: 'Waitlist entry not found' };
          }

          entry.priority = priority;
          await this.saveWaitlistData();

          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to update waitlist entry priority' };
        }
      },
      'updateWaitlistEntryPriority'
    );
  }

  /**
   * Delete waitlist entry
   */
  async deleteWaitlistEntry(entryId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(entryId, 'entryId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const deleted = this.waitlistEntries.delete(entryId);
          if (deleted) {
            await this.saveWaitlistData();
          }
          return { data: deleted, error: null };
        } catch (error) {
          return { data: false, error: error instanceof Error ? error.message : 'Failed to delete waitlist entry' };
        }
      },
      'deleteWaitlistEntry'
    );
  }

  /**
   * Get waitlist statistics
   */
  async getWaitlistStats(): Promise<ServiceResponse<WaitlistStats>> {
    return this.executeDbOperation(
      async () => {
        try {
          const entries = Array.from(this.waitlistEntries.values());
          const totalEntries = entries.length;
          const pendingEntries = entries.filter(e => e.status === 'pending').length;
          const approvedEntries = entries.filter(e => e.status === 'approved').length;
          const rejectedEntries = entries.filter(e => e.status === 'rejected').length;
          const onboardedEntries = entries.filter(e => e.status === 'onboarded').length;

          // Calculate average wait time
          const approvedAndOnboarded = entries.filter(e => e.status === 'approved' || e.status === 'onboarded');
          let totalWaitTime = 0;
          let waitTimeCount = 0;

          for (const entry of approvedAndOnboarded) {
            if (entry.approvedDate) {
              const joinDate = new Date(entry.joinDate);
              const approvedDate = new Date(entry.approvedDate);
              const waitTime = (approvedDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
              totalWaitTime += waitTime;
              waitTimeCount++;
            }
          }

          const averageWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;

          // Calculate conversion rate
          const conversionRate = totalEntries > 0 ? (onboardedEntries / totalEntries) * 100 : 0;

          // Get top referral sources
          const referralSourceCounts = entries.reduce((acc, entry) => {
            if (entry.referralSource) {
              acc[entry.referralSource] = (acc[entry.referralSource] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          const topReferralSources = Object.entries(referralSourceCounts)
            .map(([source, count]) => ({
              source,
              count,
              conversionRate: totalEntries > 0 ? (count / totalEntries) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          return {
            data: {
              totalEntries,
              pendingEntries,
              approvedEntries,
              rejectedEntries,
              onboardedEntries,
              averageWaitTime,
              conversionRate,
              topReferralSources
            },
            error: null
          };
        } catch (error) {
          return {
            data: {
              totalEntries: 0,
              pendingEntries: 0,
              approvedEntries: 0,
              rejectedEntries: 0,
              onboardedEntries: 0,
              averageWaitTime: 0,
              conversionRate: 0,
              topReferralSources: []
            },
            error: error instanceof Error ? error.message : 'Failed to get waitlist statistics'
          };
        }
      },
      'getWaitlistStats'
    );
  }

  /**
   * Get next entries to process
   */
  async getNextEntriesToProcess(limit: number = 10): Promise<ServiceResponse<WaitlistEntry[]>> {
    const limitValidation = this.validateRequiredParam(limit, 'limit');
    if (limitValidation) {
      return this.createErrorResponse(limitValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const pendingEntries = Array.from(this.waitlistEntries.values())
            .filter(e => e.status === 'pending')
            .sort((a, b) => {
              // Sort by priority first, then by join date
              const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
              const aPriority = priorityOrder[a.priority] || 1;
              const bPriority = priorityOrder[b.priority] || 1;
              
              if (aPriority !== bPriority) {
                return bPriority - aPriority;
              }
              
              return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
            })
            .slice(0, limit);

          return { data: pendingEntries, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get next entries to process' };
        }
      },
      'getNextEntriesToProcess'
    );
  }

  /**
   * Search waitlist entries
   */
  async searchWaitlistEntries(query: string): Promise<ServiceResponse<WaitlistEntry[]>> {
    const queryValidation = this.validateRequiredParam(query, 'query');
    if (queryValidation) {
      return this.createErrorResponse(queryValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const entries = Array.from(this.waitlistEntries.values());
          const searchTerm = query.toLowerCase();

          const results = entries.filter(entry => 
            entry.email.toLowerCase().includes(searchTerm) ||
            entry.firstName.toLowerCase().includes(searchTerm) ||
            entry.lastName.toLowerCase().includes(searchTerm) ||
            (entry.companyName && entry.companyName.toLowerCase().includes(searchTerm)) ||
            (entry.industry && entry.industry.toLowerCase().includes(searchTerm))
          );

          return { data: results, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to search waitlist entries' };
        }
      },
      'searchWaitlistEntries'
    );
  }

  /**
   * Export waitlist data
   */
  async exportWaitlistData(format: 'csv' | 'json' = 'csv'): Promise<ServiceResponse<string>> {
    const formatValidation = this.validateRequiredParam(format, 'format');
    if (formatValidation) {
      return this.createErrorResponse(formatValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const entries = Array.from(this.waitlistEntries.values());

          if (format === 'json') {
            return { data: JSON.stringify(entries, null, 2), error: null };
          } else {
            // Generate CSV
            const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Company', 'Industry', 'Status', 'Priority', 'Join Date'];
            const rows = entries.map(entry => [
              entry.id,
              entry.email,
              entry.firstName,
              entry.lastName,
              entry.companyName || '',
              entry.industry || '',
              entry.status,
              entry.priority,
              entry.joinDate
            ]);

            const csvContent = [headers, ...rows]
              .map(row => row.map(field => `"${field}"`).join(','))
              .join('\n');

            return { data: csvContent, error: null };
          }
        } catch (error) {
          return { data: '', error: error instanceof Error ? error.message : 'Failed to export waitlist data' };
        }
      },
      'exportWaitlistData'
    );
  }

  // Private helper methods
  private async loadWaitlistData(): Promise<void> {
    try {
      // Load waitlist data from storage (implementation would load from database)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error loading waitlist data', { error });
    }
  }

  private async saveWaitlistData(): Promise<void> {
    try {
      // Save waitlist data to storage (implementation would save to database)
      // For now, using in-memory storage
    } catch (error) {
      this.logger.error('Error saving waitlist data', { error });
    }
  }
}

// Export singleton instance
export const waitlistService = new WaitlistService(); 
