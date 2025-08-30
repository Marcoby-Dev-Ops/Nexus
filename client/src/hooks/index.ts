export { useAuth } from './useAuth';
export { useUser } from './useUser';
export { useOrganization } from '@/shared/hooks/useOrganization';
export { usePageOrchestration } from './orchestration/usePageOrchestration';
export { useDataConnectivityHealth } from './dashboard/useDataConnectivityHealth';
export { useKPICalculation } from './dashboard/useKPICalculation';
export { useFinancialData } from './dashboard/useFinancialData';
export { useAuthenticatedApi } from './useAuthenticatedApi';
export { useMicrosoft365Token } from './useMicrosoft365Token';

// Database hooks
export {
  useDatabaseHealth,
  useDatabaseQuery,
  useDatabaseTransaction,
  useDatabaseConfig,
  useDatabaseClient,
  useDatabaseConnection,
  useVectorOperations,
  type DatabaseHealth
} from './useDatabase'; 
