import { useState, useCallback } from 'react';
import { selectData as select, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface PayPalTransaction {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const usePayPalTransactions = () => {
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('paypal_transactions', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch PayPal transactions');
        setError('Failed to fetch transactions');
        return;
      }
      setTransactions(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching PayPal transactions');
      setError('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (transactionData: Omit<PayPalTransaction, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('paypal_transactions', transactionData);
      if (error) {
        logger.error({ error }, 'Failed to add PayPal transaction');
        setError('Failed to add transaction');
        return null;
      }
      setTransactions(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error adding PayPal transaction');
      setError('Error adding transaction');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
  };
}; 
