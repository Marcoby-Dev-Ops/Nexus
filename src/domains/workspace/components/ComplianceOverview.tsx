import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Shield, AlertTriangle, CheckCircle, Clock, Database, Zap, Lock, Eye } from 'lucide-react';
import { dataPrincipleService } from '@/core/services/DataPrincipleService';
import { useQuery } from '@tanstack/react-query';

const ComplianceOverview: React.FC = () => {
  const { data: principles } = useQuery({
    queryKey: ['dataPrinciples'],
    queryFn: () => dataPrincipleService.getDataPrinciples(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: guidelines } = useQuery({
    queryKey: ['dataProcessingGuidelines'],
    queryFn: () => dataPrincipleService.getDataProcessingGuidelines(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: requirements } = useQuery({
    queryKey: ['complianceRequirements'],
    queryFn: () => dataPrincipleService.getComplianceRequirements(),
    staleTime: 10 * 60 * 1000,
  });

  const renderPrincipleCard = (principle: any) => (
    <Card key={principle.principle} className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          {principle.principle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {principle.description}
        </p>
        <div className="space-y-2">
          <div className="text-xs font-medium text-blue-600">Implementation:</div>
          <p className="text-xs">{principle.implementation}</p>
          <div className="text-xs font-medium text-green-600 mt-3">Examples:</div>
          <ul className="text-xs space-y-1">
            {principle.examples.map((example: string, index: number) => (
              <li key={index} className="flex items-start gap-1">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {example}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  const renderGuidelineCard = (guideline: any) => (
    <Card key={guideline.domain} className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-purple-600" />
          {guideline.domain}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-600">Data Type:</div>
            <p className="text-sm">{guideline.dataType}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-blue-600">Processing:</div>
            <p className="text-sm">{guideline.processingMethod}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-green-600">Storage:</div>
            <p className="text-sm">{guideline.storagePolicy}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-orange-600">Compliance:</div>
            <ul className="text-xs space-y-1">
              {guideline.complianceNotes.map((note: string, index: number) => (
                <li key={index} className="flex items-start gap-1">
                  <Lock className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRequirementCard = (requirement: any) => (
    <Card key={requirement.requirement} className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          {requirement.requirement}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {requirement.description}
          </p>
          <div>
            <div className="text-xs font-medium text-blue-600">Implementation:</div>
            <p className="text-sm">{requirement.implementation}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={requirement.riskLevel === 'high' ? 'destructive' : 
                       requirement.riskLevel === 'medium' ? 'secondary' : 'default'}
            >
              {requirement.riskLevel} risk
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Data Principles & Compliance</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nexus follows a "enrich and analyze but don't store" approach across all domains. 
          We process data in real-time without storing sensitive client information locally.
        </p>
      </div>

      {/* Core Principles */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Core Data Principles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles?.map(renderPrincipleCard)}
        </div>
      </div>

      {/* Domain Guidelines */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-600" />
          Domain Processing Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidelines?.map(renderGuidelineCard)}
        </div>
      </div>

      {/* Compliance Requirements */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Compliance Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements?.map(renderRequirementCard)}
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Privacy-First Architecture
            </h3>
            <p className="text-blue-800 mb-4">
              Every feature in Nexus is designed with privacy and compliance as the foundation. 
              We never store sensitive client data locally - instead, we:
            </p>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Process data in real-time via secure APIs</span>
              </li>
              <li className="flex items-start gap-2">
                <Database className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Store only metadata and analysis results</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Apply compliance checks automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Maintain audit trails for all data access</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold">Compliance Ready</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Built-in GDPR, SOC 2, HIPAA, and SOX compliance with zero data storage.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Real-Time Processing</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              All analysis and enrichment happens in real-time without storing raw data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Database className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Provider Agnostic</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Works with any data source without storing its content locally.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplianceOverview; 