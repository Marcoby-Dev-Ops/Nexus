import React, { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { IntegrationCard } from '../components/IntegrationCard';
import { IntegrationWizard } from '../components/IntegrationWizard';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import type { Integration, IntegrationFilter, CreateIntegrationRequest } from '../types/integration';
import { Plus, Search, Filter } from 'lucide-react';

export const IntegrationsDashboard: React.FC = () => {
  const [filter, setFilter] = useState<IntegrationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const {
    integrations,
    loading,
    error,
    createIntegration,
    deleteIntegration,
    testIntegration,
    activateIntegration,
    deactivateIntegration,
  } = useIntegrations(filter);

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateIntegration = async (data: CreateIntegrationRequest) => {
    try {
      await createIntegration(data);
      setShowCreateModal(false);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleDelete = async (integration: Integration) => {
    if (window.confirm(`Are you sure you want to delete "${integration.name}"?`)) {
      try {
        await deleteIntegration(integration.id);
      } catch (error) {
        // Error logging removed for production
      }
    }
  };

  const handleTest = async (integration: Integration) => {
    try {
      const result = await testIntegration(integration.id);
      alert(`Test result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleToggleStatus = async (integration: Integration) => {
    try {
      if (integration.status === 'active') {
        await deactivateIntegration(integration.id);
      } else {
        await activateIntegration(integration.id);
      }
    } catch (error) {
      // Error logging removed for production
    }
  };

  const getStatusCounts = () => {
    const counts = { active: 0, inactive: 0, error: 0, pending: 0 };
    integrations.forEach(integration => {
      counts[integration.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integrations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Manage your external service connections</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Integration
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{statusCounts.inactive}</div>
          <div className="text-sm text-gray-700">Inactive</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
          <div className="text-sm text-red-700">Error</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filter.status || ''}
          onValueChange={(value) => setFilter(prev => ({ 
            ...prev, 
            status: (value as Integration['status']) || undefined 
          }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.type || ''}
          onValueChange={(value) => setFilter(prev => ({ 
            ...prev, 
            type: (value as Integration['type']) || undefined 
          }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="oauth">OAuth</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Integrations Grid */}
      {filteredIntegrations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No integrations found</div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first integration
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConfigure={() => {/* TODO: Open configuration modal */}}
              onTest={() => handleTest(integration)}
              onDelete={() => handleDelete(integration)}
            />
          ))}
        </div>
      )}

      {/* Integration Wizard Modal */}
      {showCreateModal && (
        <IntegrationWizard
          onComplete={handleCreateIntegration}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
