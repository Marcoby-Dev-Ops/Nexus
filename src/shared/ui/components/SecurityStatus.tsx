/**
 * Security Status Widget
 * Compact component to show current security health
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from "@/core/supabase";

interface SecurityStatus {
  level: 'secure' | 'warning' | 'critical';
  score: number;
  recentEvents: number;
  failedLogins: number;
  lastCheck: Date;
}

export const SecurityStatus: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus>({
    level: 'secure',
    score: 95,
    recentEvents: 0,
    failedLogins: 0,
    lastCheck: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSecurityStatus();
    
    // Update every 5 minutes
    const interval = setInterval(loadSecurityStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityStatus = async (): Promise<void> => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent events
      const { data: events } = await supabase
        .from('security_audit_log')
        .select('event_type')
        .eq('user_id', user.id)
        .gte('created_at', last24h.toISOString());

      const recentEvents = events?.length || 0;
      const failedLogins = events?.filter(e => e.event_type === 'failed_login').length || 0;
      const suspiciousActivity = events?.filter(e => e.event_type === 'suspicious_activity').length || 0;

      // Calculate security level and score
      let level: 'secure' | 'warning' | 'critical' = 'secure';
      let score = 95;

      if (failedLogins >= 5 || suspiciousActivity > 0) {
        level = 'critical';
        score = Math.max(30, 95 - (failedLogins * 10) - (suspiciousActivity * 20));
      } else if (failedLogins >= 2) {
        level = 'warning';
        score = Math.max(60, 95 - (failedLogins * 5));
      }

      setStatus({
        level,
        score,
        recentEvents,
        failedLogins,
        lastCheck: now,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to load security status: ', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (): React.ReactNode => {
    switch (status.level) {
      case 'secure':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusColor = (): string => {
    switch (status.level) {
      case 'secure':
        return 'bg-success/10 text-success hover: bg-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning hover:bg-warning/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    }
  };

  const getStatusText = (): string => {
    switch (status.level) {
      case 'secure':
        return 'Secure';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="h-3 w-3 animate-spin" />
        <span className="text-xs">Checking...</span>
      </Badge>
    );
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`h-8 px-2 ${getStatusColor()}`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
          <span className="text-xs opacity-75">{status.score}%</span>
        </div>
      </Button>

      <Modal 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        title="Security Status"
        className="w-80"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Security Score</span>
              <span className="font-medium">{status.score}%</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Recent Events (24h)</span>
              <span className="font-medium">{status.recentEvents}</span>
            </div>

            {status.failedLogins > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Failed Logins</span>
                <span className="font-medium">{status.failedLogins}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Last Check</span>
                <span>{status.lastCheck.toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-medium text-muted-foreground">Active Security Features</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Encryption</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>RLS</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Audit Log</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span>Monitoring</span>
                </div>
              </div>
            </div>

            {status.level === 'critical' && (
              <div className="p-2 bg-destructive/5 rounded text-xs text-destructive">
                <p className="font-medium">Action Required</p>
                <p>Multiple security events detected. Please review your security dashboard.</p>
              </div>
            )}

            {status.level === 'warning' && (
              <div className="p-2 bg-warning/5 rounded text-xs text-warning">
                <p className="font-medium">Attention</p>
                <p>Some security events require your attention.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}; 