import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { realTimeCrossDepartmentalSync, type DepartmentDataSource, type CrossDepartmentalData } from '../../lib/core/realTimeCrossDepartmentalSync';

export const RealTimeSyncDemo: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [dataSources, setDataSources] = useState<DepartmentDataSource[]>([]);
  const [recentData, setRecentData] = useState<CrossDepartmentalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateData = () => {
      try {
        const status = realTimeCrossDepartmentalSync.getSystemStatus();
        const sources = realTimeCrossDepartmentalSync.getDataSources();
        const recent = realTimeCrossDepartmentalSync.getRecentData(8);

        setSystemStatus(status);
        setDataSources(sources);
        setRecentData(recent);
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating real-time sync data:', error);
      }
    };

    // Initial load
    updateData();

    // Update every 5 seconds
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success bg-success/10';
      case 'syncing': return 'text-primary bg-primary/10';
      case 'error': return 'text-destructive bg-destructive/10';
      case 'disconnected': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-destructive bg-destructive/10';
      case 'high': return 'text-warning bg-orange-100';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'Sales': return '💼';
      case 'Finance': return '💰';
      case 'Operations': return '⚙️';
      case 'Marketing': return '📢';
      case 'Customer Success': return '🎯';
      case 'HR': return '👥';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-muted-foreground">Loading Real-Time Sync...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          🔄 Real-Time Cross-Departmental Data Synchronization
        </h2>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          <strong>Phase 2: Intelligence Amplification</strong> - All business data flows through the unified brain 
          with real-time processing and cross-departmental intelligence generation.
        </p>
      </div>

      {/* System Status Overview */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            System Status
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${systemStatus?.isProcessing ? 'bg-success' : 'bg-destructive'}`}></div>
            <span className="text-sm font-medium">
              {systemStatus?.isProcessing ? 'Processing' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Data Sources</p>
                <p className="text-2xl font-bold text-blue-900">{systemStatus?.dataSources || 0}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-success/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Active Streams</p>
                <p className="text-2xl font-bold text-green-900">{systemStatus?.activeStreams || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-secondary/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">Throughput</p>
                <p className="text-2xl font-bold text-purple-900">
                  {systemStatus?.performanceMetrics?.throughput?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-secondary">data points/min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warning">Latency</p>
                <p className="text-2xl font-bold text-orange-900">
                  {systemStatus?.performanceMetrics?.ingestion_latency || 0}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Grid */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Department Data Sources
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <div key={source.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getDepartmentIcon(source.department)}</span>
                  <div>
                    <h4 className="font-semibold text-foreground">{source.department}</h4>
                    <p className="text-sm text-muted-foreground">{source.system}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                  {source.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {new Date(source.lastSync).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Recent Metrics:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(source.metrics).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="truncate">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">
                          {typeof value === 'number' ? 
                            (value > 1 ? Math.round(value) : value.toFixed(2)) : 
                            String(value).slice(0, 8)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Intelligence Data */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-primary" />
          Real-Time Intelligence Stream
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {recentData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent data available</p>
          ) : (
            recentData.map((data) => (
              <div key={data.id} className="border rounded-lg p-4 hover:bg-background transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg">{getDepartmentIcon(data.department)}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{data.department}</h4>
                      <p className="text-sm text-muted-foreground">{data.sourceSystem}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(data.businessContext.urgency)}`}>
                      {data.businessContext.urgency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium text-foreground/90 mb-1">Business Context:</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {data.businessContext.impact.length > 0 && (
                        <div>
                          <span className="font-medium">Impact:</span> {data.businessContext.impact.join(', ')}
                        </div>
                      )}
                      {data.businessContext.relatedDepartments.length > 0 && (
                        <div>
                          <span className="font-medium">Related:</span> {data.businessContext.relatedDepartments.join(', ')}
                        </div>
                      )}
                      {data.businessContext.actionRequired && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          <span className="font-medium text-warning">Action Required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground/90 mb-1">Intelligence:</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {data.intelligence.insights.length > 0 && (
                        <div>
                          <span className="font-medium">Insights:</span> {data.intelligence.insights.slice(0, 2).join(', ')}
                        </div>
                      )}
                      {data.intelligence.recommendations.length > 0 && (
                        <div>
                          <span className="font-medium">Recommendations:</span> {data.intelligence.recommendations.slice(0, 2).join(', ')}
                        </div>
                      )}
                      {data.intelligence.patterns.length > 0 && (
                        <div>
                          <span className="font-medium">Patterns:</span> {data.intelligence.patterns.slice(0, 1).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-foreground/90 mb-2">Key Metrics:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(data.data).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">
                          {typeof value === 'number' ? 
                            (value > 1 ? Math.round(value) : value.toFixed(2)) : 
                            String(value).slice(0, 10)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          🚀 Phase 2 Intelligence Amplification Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Unified Data Pipeline</p>
                <p className="text-sm text-muted-foreground">All business data flows through central brain system</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Real-time Processing</p>
                <p className="text-sm text-muted-foreground">Data updates trigger immediate intelligence generation</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Cross-System Integration</p>
                <p className="text-sm text-muted-foreground">CRM, ERP, Analytics, Communication tools connected</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Holistic Business View</p>
                <p className="text-sm text-muted-foreground">360° perspective on all business operations</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Pattern Recognition</p>
                <p className="text-sm text-muted-foreground">Identifies trends and opportunities across departments</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Predictive Analytics</p>
                <p className="text-sm text-muted-foreground">Forecasts business outcomes with 85%+ accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          📊 Real-Time Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Data Latency</h4>
            <p className="text-2xl font-bold text-primary">
              {systemStatus?.performanceMetrics?.ingestion_latency || 0}ms
            </p>
            <p className="text-sm text-primary">Target: &lt;5 seconds</p>
          </div>
          
          <div className="bg-success/5 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Error Rate</h4>
            <p className="text-2xl font-bold text-success">
              {((systemStatus?.performanceMetrics?.error_rate || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-success">Target: &lt;5%</p>
          </div>
          
          <div className="bg-secondary/5 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Uptime</h4>
            <p className="text-2xl font-bold text-secondary">
              {((systemStatus?.performanceMetrics?.uptime || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-secondary">Target: 99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 