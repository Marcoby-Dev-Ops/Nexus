import React from 'react';
import { Shield, AlertTriangle, FileText, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { owaInboxService } from '@/services/email/owaInboxService';
import { useQuery } from '@tanstack/react-query';

const ComplianceDashboard: React.FC = () => {
  const { isLoading } = useQuery({
    queryKey: ['complianceDashboard'],
    queryFn: () => owaInboxService.getComplianceDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        No compliance data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Compliance & Risk Analysis</h2>
        <p className="text-muted-foreground">
          Real-time analysis of your email data - no storage required
        </p>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{dashboard.riskDistribution.low}</div>
              <div className="text-sm text-green-600">Low Risk</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{dashboard.riskDistribution.medium}</div>
              <div className="text-sm text-yellow-600">Medium Risk</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{dashboard.riskDistribution.high}</div>
              <div className="text-sm text-red-600">High Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Compliance Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Compliance Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard.topComplianceFlags.map((flag, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">{flag.flag}</span>
                <span className="text-sm text-muted-foreground">{flag.count} emails</span>
              </div>
            ))}
            {dashboard.topComplianceFlags.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No compliance flags detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Classification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard.dataClassification.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium capitalize">{item.classification}</span>
                <span className="text-sm text-muted-foreground">{item.count} emails</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Retention Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard.retentionSummary.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">{item.guidance}</span>
                <span className="text-sm text-muted-foreground">{item.count} emails</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Compliance & Privacy</h3>
            <p className="text-sm text-blue-700">
              This analysis is performed in real-time without storing any email content. 
              All data remains on Microsoft servers, and only metadata is analyzed for 
              compliance and risk assessment purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard; 