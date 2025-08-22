import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Shield, 
  Database, 
  Users, 
  Building, 
  Eye, 
  Edit, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  FileText,
  Zap
} from 'lucide-react';
import { useService } from '@/shared/hooks/useService';
import { logger } from '@/shared/utils/logger';
import { toast } from 'sonner';

interface PolicySummary {
  table_name: string;
  policy_name: string;
  command: string;
  condition: string;
}

interface PolicyCoverage {
  table_name: string;
  has_rls: boolean;
  policy_count: number;
  status: string;
}

interface TableInfo {
  table_name: string;
  has_user_id: boolean;
  has_company_id: boolean;
  has_deleted_at: boolean;
  policy_type: 'user_level' | 'company_level' | 'hybrid' | 'readonly' | 'none';
}

export const PolicyManagementPage: React.FC = () => {
  const supabaseService = useService('supabase');
  const [policySummary, setPolicySummary] = useState<PolicySummary[]>([]);
  const [policyCoverage, setPolicyCoverage] = useState<PolicyCoverage[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>('');
  const [applyingPolicy, setApplyingPolicy] = useState(false);

  const loadPolicyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load policy summary
      const summaryResult = await supabaseService.executeRPC('list_policy_summary', {});
      if (summaryResult.success) {
        setPolicySummary(summaryResult.data || []);
      }

      // Load policy coverage
      const coverageResult = await supabaseService.executeRPC('validate_policy_coverage', {});
      if (coverageResult.success) {
        setPolicyCoverage(coverageResult.data || []);
      }

      // Load table information
      const tablesResult = await supabaseService.executeSQL(`
        SELECT 
          t.table_name,
          EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id') as has_user_id,
          EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'company_id') as has_company_id,
          EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'deleted_at') as has_deleted_at
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name NOT LIKE 'pg_%'
        ORDER BY t.table_name
      `);
      
      if (tablesResult.success) {
        const tables = (tablesResult.data || []).map((table: any) => ({
          ...table,
          policy_type: determinePolicyType(table.has_user_id, table.has_company_id)
        }));
        setTableInfo(tables);
      }

    } catch (err) {
      setError('Failed to load policy data');
      logger.error('Policy management data load failed', { error: err });
    } finally {
      setLoading(false);
    }
  }, [supabaseService]);

  const determinePolicyType = (hasUserId: boolean, hasCompanyId: boolean): TableInfo['policy_type'] => {
    if (hasUserId && hasCompanyId) return 'hybrid';
    if (hasUserId) return 'user_level';
    if (hasCompanyId) return 'company_level';
    return 'readonly';
  };

  const applyPolicyToTable = async (tableName: string, policyType: string) => {
    try {
      setApplyingPolicy(true);
      
      let functionName = '';
      switch (policyType) {
        case 'user_level':
          functionName = 'apply_user_level_policies';
          break;
        case 'company_level':
          functionName = 'apply_company_level_policies';
          break;
        case 'hybrid':
          functionName = 'apply_hybrid_policies';
          break;
        case 'readonly':
          functionName = 'apply_readonly_policies';
          break;
        default:
          throw new Error('Invalid policy type');
      }

      const result = await supabaseService.executeRPC(functionName, { table_name: tableName });
      
      if (result.success) {
        toast.success(`Applied ${policyType} policies to ${tableName}`);
        await loadPolicyData(); // Refresh data
      } else {
        throw new Error(result.error || 'Failed to apply policies');
      }
    } catch (err) {
      toast.error(`Failed to apply policies: ${err instanceof Error ? err.message : 'Unknown error'}`);
      logger.error('Policy application failed', { tableName, policyType, error: err });
    } finally {
      setApplyingPolicy(false);
    }
  };

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'user_level': return 'bg-blue-100 text-blue-800';
      case 'company_level': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      case 'readonly': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'INCOMPLETE': return 'bg-yellow-100 text-yellow-800';
      case 'NO_POLICIES': return 'bg-red-100 text-red-800';
      case 'RLS_DISABLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadPolicyData();
  }, [loadPolicyData]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Policy Management</h1>
            <p className="text-muted-foreground">
              Manage Row Level Security (RLS) policies across your database tables
            </p>
          </div>
          <Button onClick={loadPolicyData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tables">Table Policies</TabsTrigger>
            <TabsTrigger value="apply">Apply Policies</TabsTrigger>
            <TabsTrigger value="details">Policy Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tableInfo.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{policySummary.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Complete Coverage</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {policyCoverage.filter(p => p.status === 'COMPLETE').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Policy Coverage Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Coverage Status</CardTitle>
                <CardDescription>
                  Overview of RLS policy coverage across all tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>RLS Status</TableHead>
                      <TableHead>Policy Count</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policyCoverage.map((coverage) => (
                      <TableRow key={coverage.table_name}>
                        <TableCell className="font-medium">{coverage.table_name}</TableCell>
                        <TableCell>
                          <Badge variant={coverage.has_rls ? "default" : "secondary"}>
                            {coverage.has_rls ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>{coverage.policy_count}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(coverage.status)}>
                            {coverage.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Table Policy Analysis</CardTitle>
                <CardDescription>
                  Detailed view of table structure and recommended policy types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Structure</TableHead>
                      <TableHead>Recommended Policy</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableInfo.map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="font-medium">{table.table_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {table.has_user_id && <Badge variant="outline">user_id</Badge>}
                            {table.has_company_id && <Badge variant="outline">company_id</Badge>}
                            {table.has_deleted_at && <Badge variant="outline">deleted_at</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPolicyTypeColor(table.policy_type)}>
                            {table.policy_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => applyPolicyToTable(table.table_name, table.policy_type)}
                            disabled={applyingPolicy}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Apply Policies Tab */}
          <TabsContent value="apply" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Apply Policies Manually</CardTitle>
                <CardDescription>
                  Apply specific policy types to individual tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Table</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tableInfo.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            {table.table_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Policy Type</label>
                    <Select value={selectedPolicyType} onValueChange={setSelectedPolicyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_level">User Level</SelectItem>
                        <SelectItem value="company_level">Company Level</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="readonly">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => applyPolicyToTable(selectedTable, selectedPolicyType)}
                    disabled={!selectedTable || !selectedPolicyType || applyingPolicy}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Apply Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy Details</CardTitle>
                <CardDescription>
                  Complete list of all RLS policies in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policySummary.map((policy, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{policy.table_name}</TableCell>
                        <TableCell>{policy.policy_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.command}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate" title={policy.condition}>
                          {policy.condition}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};
