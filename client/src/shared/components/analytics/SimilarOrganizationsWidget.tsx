import React, { useState, useEffect } from 'react';
import type { SimilarOrganizationsSummary, IndustryTrends, MaturityLevelInsights } from '../../../services/analytics/InsightsAnalyticsClient';
import { InsightsAnalyticsClient } from '../../../services/analytics/InsightsAnalyticsClient';
import { BuildingBlocksService } from '../../../services/playbook/BuildingBlocksService';

interface SimilarOrganizationsWidgetProps {
  userContext: {
    industry?: string;
    companySize?: string;
    maturityLevel?: string;
    sophisticationLevel?: string;
    keyPriorities?: string[];
    selectedTools?: Record<string, string[]>;
  };
  className?: string;
}

export const SimilarOrganizationsWidget: React.FC<SimilarOrganizationsWidgetProps> = ({
  userContext,
  className = ''
}) => {
  const [analyticsData, setAnalyticsData] = useState<{
    similarOrganizations: SimilarOrganizationsSummary;
    industryTrends: IndustryTrends[];
    maturityInsights: MaturityLevelInsights[];
    summary: {
      hasSimilarOrgs: boolean;
      hasIndustryTrends: boolean;
      hasMaturityInsights: boolean;
      totalDataPoints: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'similar' | 'trends' | 'maturity'>('similar');

  const analyticsClient = new InsightsAnalyticsClient();

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await analyticsClient.getAnalyticsDashboard(userContext);
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (userContext.industry || userContext.maturityLevel) {
      loadAnalyticsData();
    }
  }, [userContext]);

  const getBuildingBlockIcon = (blockId: string) => {
    const block = BuildingBlocksService.getBuildingBlock(blockId);
    return block?.icon || '🏢';
  };

  const getBuildingBlockName = (blockId: string) => {
    const block = BuildingBlocksService.getBuildingBlock(blockId);
    return block?.name || blockId;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Unable to load analytics data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.summary.totalDataPoints === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>We're building our database of organizations like yours</p>
          <p className="text-sm mt-1">Check back soon for insights from similar companies!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Organizations Like Yours
        </h3>
        <p className="text-sm text-gray-600">
          {analyticsData.similarOrganizations.message}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('similar')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'similar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Similar Organizations
          </button>
          {analyticsData.hasIndustryTrends && (
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Industry Trends
            </button>
          )}
          {analyticsData.hasMaturityInsights && (
            <button
              onClick={() => setActiveTab('maturity')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'maturity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Maturity Insights
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'similar' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.similarOrganizations.summary.totalOrganizations}
                </div>
                <div className="text-sm text-gray-500">Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.similarOrganizations.summary.averageInsights}
                </div>
                <div className="text-sm text-gray-500">Avg Insights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.similarOrganizations.summary.averageToolCategories}
                </div>
                <div className="text-sm text-gray-500">Tool Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData.similarOrganizations.summary.averageIntegrations}
                </div>
                <div className="text-sm text-gray-500">Integrations</div>
              </div>
            </div>

            {/* Top Building Blocks */}
            {analyticsData.similarOrganizations.summary.topBuildingBlocks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Most Common Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {analyticsData.similarOrganizations.summary.topBuildingBlocks.map((blockId) => (
                    <span
                      key={blockId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {getBuildingBlockIcon(blockId)} {getBuildingBlockName(blockId)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Organizations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Similar Organizations</h4>
              <div className="space-y-4">
                {analyticsData.similarOrganizations.organizations.map((org, index) => (
                  <div key={org.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {org.industry} • {org.companySize}
                        </div>
                        <div className="text-sm text-gray-500">
                          {org.maturityLevel} • {org.sophisticationLevel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {org.insightCount} insights
                        </div>
                        <div className="text-xs text-gray-500">
                          {org.similarityScore}% similar
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {org.buildingBlocksCovered.slice(0, 3).map((blockId) => (
                        <span
                          key={blockId}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {getBuildingBlockIcon(blockId)} {getBuildingBlockName(blockId)}
                        </span>
                      ))}
                    </div>

                    {org.selectedIntegrations.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Tools: {org.selectedIntegrations.slice(0, 3).join(', ')}
                        {org.selectedIntegrations.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && analyticsData.hasIndustryTrends && (
          <div className="space-y-4">
            {analyticsData.industryTrends.map((trend, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {trend.companySize} Companies
                    </h4>
                    <p className="text-sm text-gray-500">
                      {trend.organizationCount} organizations analyzed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {trend.avgInsightsPerOrg.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">avg insights</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {trend.avgToolCategories.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Tool Categories</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {trend.avgIntegrations.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Integrations</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {(trend.avgConfidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>

                {trend.topBuildingBlocks.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Top Focus Areas:</div>
                    <div className="flex flex-wrap gap-1">
                      {trend.topBuildingBlocks.map((blockId) => (
                        <span
                          key={blockId}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {getBuildingBlockIcon(blockId)} {getBuildingBlockName(blockId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'maturity' && analyticsData.hasMaturityInsights && (
          <div className="space-y-4">
            {analyticsData.maturityInsights.map((insight, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {insight.maturityLevel} Organizations
                    </h4>
                    <p className="text-sm text-gray-500">
                      {insight.organizationCount} organizations analyzed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {insight.avgInsights.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">avg insights</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {insight.avgToolCategories.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Tool Categories</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {insight.avgIntegrations.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Integrations</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {(insight.avgConfidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>

                {insight.commonInsights.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Common Insights:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {insight.commonInsights.slice(0, 3).map((insightText, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span>{insightText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(insight.toolAdoption).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Popular Tools:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(insight.toolAdoption)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([tool, count]) => (
                          <span
                            key={tool}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tool} ({count})
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
