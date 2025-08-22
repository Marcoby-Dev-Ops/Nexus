import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { centralizedRLSService, type PolicyTemplate, type TablePolicyInfo, type PolicySummary, type PolicyCoverage } from '@/core/services/CentralizedRLSService';
import { useToast } from '@/shared/components/ui/use-toast';

export const useCentralizedRLS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query keys
  const policyTemplatesKey = ['centralized-rls', 'templates'];
  const tablePolicyInfoKey = ['centralized-rls', 'table-info'];
  const policySummaryKey = ['centralized-rls', 'summary'];
  const policyCoverageKey = ['centralized-rls', 'coverage'];
  const policyStatsKey = ['centralized-rls', 'statistics'];
  const tablesNeedingAttentionKey = ['centralized-rls', 'needing-attention'];

  // Get policy templates
  const {
    data: policyTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError
  } = useQuery({
    queryKey: policyTemplatesKey,
    queryFn: () => centralizedRLSService.getPolicyTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get table policy information
  const {
    data: tablePolicyInfo,
    isLoading: isLoadingTableInfo,
    error: tableInfoError
  } = useQuery({
    queryKey: tablePolicyInfoKey,
    queryFn: () => centralizedRLSService.getTablePolicyInfo(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get policy summary
  const {
    data: policySummary,
    isLoading: isLoadingSummary,
    error: summaryError
  } = useQuery({
    queryKey: policySummaryKey,
    queryFn: () => centralizedRLSService.getPolicySummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get policy coverage
  const {
    data: policyCoverage,
    isLoading: isLoadingCoverage,
    error: coverageError
  } = useQuery({
    queryKey: policyCoverageKey,
    queryFn: () => centralizedRLSService.validatePolicyCoverage(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get policy statistics
  const {
    data: policyStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: policyStatsKey,
    queryFn: () => centralizedRLSService.getPolicyStatistics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get tables needing attention
  const {
    data: tablesNeedingAttention,
    isLoading: isLoadingNeedingAttention,
    error: needingAttentionError
  } = useQuery({
    queryKey: tablesNeedingAttentionKey,
    queryFn: () => centralizedRLSService.getTablesNeedingAttention(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation to apply user-level policies
  const applyUserLevelPolicies = useMutation({
    mutationFn: (tableName: string) => centralizedRLSService.applyUserLevelPolicies(tableName),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User-level policies applied successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply user-level policies: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to apply company-level policies
  const applyCompanyLevelPolicies = useMutation({
    mutationFn: (tableName: string) => centralizedRLSService.applyCompanyLevelPolicies(tableName),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Company-level policies applied successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply company-level policies: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to apply hybrid policies
  const applyHybridPolicies = useMutation({
    mutationFn: (tableName: string) => centralizedRLSService.applyHybridPolicies(tableName),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Hybrid policies applied successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply hybrid policies: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to apply read-only policies
  const applyReadOnlyPolicies = useMutation({
    mutationFn: (tableName: string) => centralizedRLSService.applyReadOnlyPolicies(tableName),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Read-only policies applied successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply read-only policies: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to apply policies to new table
  const applyPoliciesToNewTable = useMutation({
    mutationFn: ({ tableName, policyType }: { tableName: string; policyType: string }) =>
      centralizedRLSService.applyPoliciesToNewTable(tableName, policyType),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Policies applied to new table successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply policies to new table: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to migrate to centralized system
  const migrateToCentralizedSystem = useMutation({
    mutationFn: () => centralizedRLSService.migrateToCentralizedSystem(),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Successfully migrated to centralized RLS system',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to migrate to centralized system: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to fix policies for a specific table
  const fixTablePolicies = useMutation({
    mutationFn: (tableName: string) => centralizedRLSService.fixTablePolicies(tableName),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Table policies fixed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to fix table policies: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to fix policies for multiple failing tables
  const fixFailingTables = useMutation({
    mutationFn: (tables: string[]) => centralizedRLSService.fixFailingTables(tables),
    onSuccess: (data) => {
      const { fixed, failed } = data.data || { fixed: [], failed: [] };
      toast({
        title: 'Policy Fix Complete',
        description: `Fixed ${fixed.length} tables, ${failed.length} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to fix failing tables: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Helper function to determine appropriate policy type for a table
  const getRecommendedPolicyType = useCallback((table: TablePolicyInfo): string => {
    if (table.hasUserId && table.hasCompanyId) {
      return 'hybrid';
    } else if (table.hasUserId) {
      return 'user_level';
    } else if (table.hasCompanyId) {
      return 'company_level';
    } else {
      return 'readonly';
    }
  }, []);

  // Helper function to get tables by policy type
  const getTablesByPolicyType = useCallback((policyType: string): TablePolicyInfo[] => {
    if (!tablePolicyInfo?.data) return [];
    
    return tablePolicyInfo.data.filter(table => {
      const recommendedType = getRecommendedPolicyType(table);
      return recommendedType === policyType;
    });
  }, [tablePolicyInfo?.data, getRecommendedPolicyType]);

  // Helper function to get tables with incomplete coverage
  const getTablesWithIncompleteCoverage = useCallback((): TablePolicyInfo[] => {
    if (!tablePolicyInfo?.data || !policyCoverage?.data) return [];
    
    const incompleteTables = policyCoverage.data.filter(
      coverage => coverage.status === 'missing' || coverage.status === 'partial'
    );
    
    return tablePolicyInfo.data.filter(table =>
      incompleteTables.some(coverage => coverage.tableName === table.tableName)
    );
  }, [tablePolicyInfo?.data, policyCoverage?.data]);

  // Helper function to get coverage percentage
  const getCoveragePercentage = useCallback((): number => {
    if (!policyStats?.data) return 0;
    
    const { completeCoverage, totalTables } = policyStats.data;
    return totalTables > 0 ? Math.round((completeCoverage / totalTables) * 100) : 0;
  }, [policyStats?.data]);

  return {
    // Data
    policyTemplates: policyTemplates?.data || [],
    tablePolicyInfo: tablePolicyInfo?.data || [],
    policySummary: policySummary?.data || [],
    policyCoverage: policyCoverage?.data || [],
    policyStats: policyStats?.data,
    tablesNeedingAttention: tablesNeedingAttention?.data || [],

    // Loading states
    isLoadingTemplates,
    isLoadingTableInfo,
    isLoadingSummary,
    isLoadingCoverage,
    isLoadingStats,
    isLoadingNeedingAttention,

    // Error states
    templatesError,
    tableInfoError,
    summaryError,
    coverageError,
    statsError,
    needingAttentionError,

    // Mutations
    applyUserLevelPolicies,
    applyCompanyLevelPolicies,
    applyHybridPolicies,
    applyReadOnlyPolicies,
    applyPoliciesToNewTable,
    migrateToCentralizedSystem,
    fixTablePolicies,
    fixFailingTables,

    // Helper functions
    getRecommendedPolicyType,
    getTablesByPolicyType,
    getTablesWithIncompleteCoverage,
    getCoveragePercentage,

    // Utility functions
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['centralized-rls'] });
    },
  };
};
