import React from 'react';
import { getIndustryLabel } from '@/lib/identity/industry-options';
import { useService } from '@/shared/hooks/useService';
import type { Company, Department } from '@/services/core';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Loader2, Building, Users, BarChart3, Shield, Settings } from 'lucide-react';

interface CompanyProfileExampleProps {
  companyId: string;
}

export const CompanyProfileExample: React.FC<CompanyProfileExampleProps> = ({ companyId }) => {
  const { useGet, useUpdate } = useService<Company>('company');
  const { data: company, isLoading, error, refetch } = useGet(companyId);
  const { mutate: updateCompany, isLoading: isUpdating } = useUpdate();

  const [editMode, setEditMode] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Company>>({});

  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        description: company.description,
      });
    }
  }, [company]);

  const handleUpdate = () => {
    if (formData) {
      updateCompany(companyId, formData);
      setEditMode(false);
    }
  };

  const handleInputChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading company profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error Loading Company</h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={refetch} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-800 font-semibold">Company Not Found</h3>
        <p className="text-yellow-600">The requested company could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <CardTitle>Company Profile</CardTitle>
            </div>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "destructive" : "outline"}
              disabled={isUpdating}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <Input
                    value={formData.domain || ''}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <Input
                    value={formData.industry || ''}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <Input
                    value={formData.size || ''}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="Small, Medium, Large"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Company description..."
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button onClick={() => setEditMode(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900">Company Information</h4>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name:</span>
                      <p className="font-medium">{company.name}</p>
                    </div>
                    {company.domain && (
                      <div>
                        <span className="text-sm text-gray-500">Domain:</span>
                        <p className="font-medium">{company.domain}</p>
                      </div>
                    )}
                    {company.industry && (
                      <div>
                        <span className="text-sm text-gray-500">Industry:</span>
                        <Badge variant="secondary">{getIndustryLabel(company.industry)}</Badge>
                      </div>
                    )}
                    {company.size && (
                      <div>
                        <span className="text-sm text-gray-500">Size:</span>
                        <Badge variant="outline">{company.size}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Business Metrics</h4>
                  <div className="mt-2 space-y-2">
                    {company.mrr && (
                      <div>
                        <span className="text-sm text-gray-500">MRR:</span>
                        <p className="font-medium">${company.mrr.toLocaleString()}</p>
                      </div>
                    )}
                    {company.employee_count && (
                      <div>
                        <span className="text-sm text-gray-500">Employees:</span>
                        <p className="font-medium">{company.employee_count}</p>
                      </div>
                    )}
                    {company.founded && (
                      <div>
                        <span className="text-sm text-gray-500">Founded:</span>
                        <p className="font-medium">{company.founded}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {company.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{company.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Analytics Score</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Security Score</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 
