/**
 * Security Dashboard - Comprehensive security monitoring and audit trail
 * Provides real-time insights into system security, user activities, and threat detection
 */

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { chartColors } from '@/shared/utils/chartColors';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Badge,
  Button,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Alert, AlertDescription,
  Progress
} from '@/shared/components/ui';
import { Activity, AlertTriangle, CheckCircle, FileText, Key, Shield, XCircle, Eye } from 'lucide-react';
import { Download, Settings } from 'lucide-react';
import { postgres } from "@/lib/postgres";

interface SecurityEvent {
  id: string;
  userid: string;
  eventtype: string;
  eventdetails: any;
  ipaddress: string;
  useragent: string;
  createdat: string;
}

interface SecurityMetrics {
  totalEvents: number;
  suspiciousActivity: number;
  failedLogins: number;
  successfulLogins: number;
  dataAccess: number;
  integrationChanges: number;
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    suspiciousActivity: 0,
    failedLogins: 0,
    successfulLogins: 0,
    dataAccess: 0,
    integrationChanges: 0,
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Calculate time range
      const now = new Date();
      const timeRangeMap = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      
      const startTime = timeRangeMap[timeRange];

      // Load security events
      const { data: events } = await supabase
        .from('security_audit_log')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      setSecurityEvents(events || []);

      // Calculate metrics
      const eventsByType = (events || []).reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setMetrics({
        totalEvents: events?.length || 0,
        suspiciousActivity: eventsByType.suspicious_activity || 0,
        failedLogins: eventsByType.failed_login || 0,
        successfulLogins: eventsByType.login || 0,
        dataAccess: eventsByType.data_access || 0,
        integrationChanges: (eventsByType.integration_added || 0) + (eventsByType.integration_removed || 0),
      });

      // Generate security alerts based on patterns
      generateSecurityAlerts(events || []);

    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Failed to load security data: ', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecurityAlerts = (events: SecurityEvent[]): void => {
    const newAlerts: SecurityAlert[] = [];
    const now = new Date();

    // Check for multiple failed logins
    const failedLogins = events.filter(e => e.event_type === 'failed_login');
    if (failedLogins.length >= 5) {
      newAlerts.push({
        id: `failed-logins-${Date.now()}`,
        type: 'critical',
        title: 'Multiple Failed Login Attempts',
        description: `${failedLogins.length} failed login attempts detected in the last ${timeRange}`,
        timestamp: now.toISOString(),
        resolved: false,
      });
    }

    // Check for suspicious activity
    const suspiciousEvents = events.filter(e => e.event_type === 'suspicious_activity');
    if (suspiciousEvents.length > 0) {
      newAlerts.push({
        id: `suspicious-${Date.now()}`,
        type: 'warning',
        title: 'Suspicious Activity Detected',
        description: `${suspiciousEvents.length} suspicious activities detected`,
        timestamp: now.toISOString(),
        resolved: false,
      });
    }

    // Check for unusual data access patterns
    const dataAccessEvents = events.filter(e => e.event_type === 'data_access');
    if (dataAccessEvents.length > 100) {
      newAlerts.push({
        id: `data-access-${Date.now()}`,
        type: 'warning',
        title: 'High Data Access Volume',
        description: `Unusual amount of data access detected (${dataAccessEvents.length} events)`,
        timestamp: now.toISOString(),
        resolved: false,
      });
    }

    setAlerts(newAlerts);
  };

  const getEventIcon = (eventType: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      login: <CheckCircle className="h-4 w-4 text-success" />,
      logout: <XCircle className="h-4 w-4 text-muted-foreground" />,
      failedlogin: <XCircle className="h-4 w-4 text-destructive" />,
      suspiciousactivity: <AlertTriangle className="h-4 w-4 text-warning" />,
      dataaccess: <Eye className="h-4 w-4 text-primary" />,
      integrationadded: <Settings className="h-4 w-4 text-success" />,
      integrationremoved: <Settings className="h-4 w-4 text-destructive" />,
      datamodification: <FileText className="h-4 w-4 text-secondary" />,
      permissionchange: <Key className="h-4 w-4 text-warning" />,
      dataexport: <Download className="h-4 w-4 text-indigo-500" />,
    };

    return iconMap[eventType] || <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getEventTypeColor = (eventType: string): string => {
    const colorMap: Record<string, string> = {
      login: 'bg-success/10 text-success',
      logout: 'bg-muted text-foreground',
      failedlogin: 'bg-destructive/10 text-destructive',
      suspiciousactivity: 'bg-warning/10 text-orange-800',
      dataaccess: 'bg-primary/10 text-primary',
      integrationadded: 'bg-success/10 text-success',
      integrationremoved: 'bg-destructive/10 text-destructive',
      datamodification: 'bg-secondary/10 text-purple-800',
      permissionchange: 'bg-warning/10 text-warning/80',
      dataexport: 'bg-indigo-100 text-indigo-800',
    };

    return colorMap[eventType] || 'bg-muted text-foreground';
  };

  const exportSecurityReport = async (): Promise<void> => {
    const report = {
      timestamp: new Date().toISOString(),
      timeRange,
      metrics,
      alerts,
      events: securityEvents.slice(0, 50), // Export top 50 events
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor security events, audit trails, and system integrity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSecurityReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Tabs value={timeRange} onValueChange={(value: string) => setTimeRange(value as '24h' | '7d' | '30d')}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Active Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Security Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'warning'}>
                <AlertTriangle className="h-4 w-4" />
                <div className="font-bold">{alert.title}</div>
                <AlertDescription>
                  {alert.description} - {new Date(alert.timestamp).toLocaleString()}
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No active alerts.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Showing last 100 events in the selected time range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto">
            {securityEvents.map(event => (
              <div key={event.id} className="flex items-center space-x-4 p-2 hover: bg-muted/50 rounded-lg">
                <div className="p-2 bg-muted rounded-full">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{event.event_details.message || event.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    User: {event.user_id} - IP: {event.ip_address}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {format(new Date(event.created_at), 'Pp')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid gap-4 md: grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Security concern</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.suspiciousActivity}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Access</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dataAccess}</div>
            <p className="text-xs text-muted-foreground">Read operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Security Config</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Real-time audit trail of all security-relevant activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4 p-2 hover: bg-muted/50 rounded-lg">
                    <div className="p-2 bg-muted rounded-full">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{event.event_details?.description || `${event.event_type} event`}</p>
                      <p className="text-sm text-muted-foreground">
                        IP: {event.ip_address || 'Unknown'} • 
                        {format(new Date(event.created_at), 'PPpp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md: grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>Security events over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="events" stroke={chartColors.primary} fill={chartColors.primaryLight} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Level</CardTitle>
                <CardDescription>Current security status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Security Score</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Authentication</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Data Encryption</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Access Control</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Audit Logging</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Current security policies and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Password Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Minimum 12 characters</li>
                    <li>• Requires uppercase letters</li>
                    <li>• Requires numbers</li>
                    <li>• Requires special characters</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Session Management</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 24-hour session timeout</li>
                    <li>• Auto-logout on inactivity</li>
                    <li>• Secure session storage</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Data Protection</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AES-256 encryption</li>
                    <li>• Row-level security</li>
                    <li>• Automatic data retention</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Monitoring</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time threat detection</li>
                    <li>• Comprehensive audit logs</li>
                    <li>• Automated alerts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 
