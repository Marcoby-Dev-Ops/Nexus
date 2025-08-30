/**
 * Security Status Widget
 * Compact component to show current security health
 */

import React, { useState, useEffect } from 'react';
import { selectData } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { Badge } from '@/shared/components/ui/Badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityStatusProps {
  userId: string;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ userId }) => {
  const [securityChecks, setSecurityChecks] = useState({
    twoFactorEnabled: false,
    passwordStrength: 'strong',
    lastLogin: null,
    suspiciousActivity: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await select('user_security', '*', { user_id: userId });
        if (error) {
          logger.error({ error }, 'Failed to fetch security status');
          return;
        }
        if (data && data.length > 0) {
          const security = data[0];
          setSecurityChecks({
            twoFactorEnabled: security.two_factor_enabled || false,
            passwordStrength: security.password_strength || 'strong',
            lastLogin: security.last_login,
            suspiciousActivity: security.suspicious_activity || false,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error fetching security status');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSecurityStatus();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span className="text-sm">Checking security...</span>
      </div>
    );
  }

  const hasIssues = securityChecks.suspiciousActivity || securityChecks.passwordStrength === 'weak';

  return (
    <div className="flex items-center gap-2">
      {hasIssues ? (
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
      <Badge variant={hasIssues ? 'destructive' : 'default'}>
        {hasIssues ? 'Security Issues' : 'Secure'}
      </Badge>
    </div>
  );
}; 
